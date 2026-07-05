import { describe, it, expect } from 'vitest';
import { deriveChecklist } from './derive';
import { ALL_QUESTIONS } from './data';
import { EngagementProfile, SystemAccess, VendorSize } from './types';

// controlId から、その管理策を持つ設問IDの一覧を引くヘルパー。
const questionsForControl = (controlId: string): string[] =>
  ALL_QUESTIONS.filter((q) => q.controlId === controlId).map((q) => q.id);

describe('deriveChecklist — 机上適用シナリオ', () => {
  it('(a) 個人情報を扱う業務委託（管理者権限あり）', () => {
    const profile: EngagementProfile = {
      linkType: '委託型',
      handlesPersonalData: true,
      handlesConfidentialData: true,
      systemAccess: '管理者権限',
      subcontracting: false,
      cloudService: false,
      vendorSize: '中規模',
    };

    const result = deriveChecklist(profile);

    // 個人情報・機密情報・管理者権限・委託型のルールが適用される。
    expect(result.appliedRules).toEqual(
      expect.arrayContaining([
        'R-BASELINE',
        'R-PERSONAL-DATA',
        'R-CONFIDENTIAL',
        'R-ACCESS-GENERAL',
        'R-ACCESS-ADMIN',
        'R-LINK-COMMISSION',
        'R-SIZE-MEDIUM',
      ]),
    );

    // 個人情報 → データ分類(5.12)・暗号化(8.24) が導出される。
    for (const qid of [...questionsForControl('5.12'), ...questionsForControl('8.24')]) {
      expect(result.questionIds).toContain(qid);
    }
    // 管理者権限 → ログ監視(8.15) が導出される。
    for (const qid of questionsForControl('8.15')) {
      expect(result.questionIds).toContain(qid);
    }

    // トレーサビリティ: 暗号化設問は R-PERSONAL-DATA を根拠に持つ。
    for (const qid of questionsForControl('8.24')) {
      expect(result.perQuestionRationale[qid]).toContain('R-PERSONAL-DATA');
    }
    // ログ監視設問は R-ACCESS-ADMIN を根拠に持つ。
    for (const qid of questionsForControl('8.15')) {
      expect(result.perQuestionRationale[qid]).toContain('R-ACCESS-ADMIN');
    }

    // 出力IDはすべてカタログに存在し、根拠が付与されている。
    for (const qid of result.questionIds) {
      expect(ALL_QUESTIONS.some((q) => q.id === qid)).toBe(true);
      expect(result.perQuestionRationale[qid].length).toBeGreaterThan(0);
    }
  });

  it('(b) 提携・相互接続型（水平連携）', () => {
    const profile: EngagementProfile = {
      linkType: '提携・相互接続型',
      handlesPersonalData: false,
      handlesConfidentialData: true,
      systemAccess: '一般権限',
      subcontracting: false,
      cloudService: true,
      vendorSize: '大規模',
    };

    const result = deriveChecklist(profile);

    expect(result.appliedRules).toEqual(
      expect.arrayContaining([
        'R-LINK-INTERCONNECT',
        'R-CLOUD',
        'R-SIZE-LARGE',
        'R-ACCESS-GENERAL',
      ]),
    );
    // 相互接続型は管理者権限ではないため R-ACCESS-ADMIN は適用されない。
    expect(result.appliedRules).not.toContain('R-ACCESS-ADMIN');
    // 個人情報は扱わないため R-PERSONAL-DATA は適用されない。
    expect(result.appliedRules).not.toContain('R-PERSONAL-DATA');

    // 脅威情報連携(5.7)・クラウド利用管理(5.23) が導出される。
    for (const qid of [...questionsForControl('5.7'), ...questionsForControl('5.23')]) {
      expect(result.questionIds).toContain(qid);
    }
  });

  it('(c) 供給型（クラウドサービス利用、再委託あり）', () => {
    const profile: EngagementProfile = {
      linkType: '供給型',
      handlesPersonalData: true,
      handlesConfidentialData: true,
      systemAccess: '一般権限',
      subcontracting: true,
      cloudService: true,
      vendorSize: '大規模',
    };

    const result = deriveChecklist(profile);

    expect(result.appliedRules).toEqual(
      expect.arrayContaining(['R-LINK-SUPPLY', 'R-SUBCONTRACT', 'R-CLOUD']),
    );

    // サプライチェーン管理(5.22)・委託先評価(5.19) が導出される。
    for (const qid of [...questionsForControl('5.22'), ...questionsForControl('5.19')]) {
      expect(result.questionIds).toContain(qid);
    }
    // 再委託(5.22)の導出根拠に R-SUBCONTRACT または R-LINK-SUPPLY が含まれる。
    for (const qid of questionsForControl('5.22')) {
      expect(result.perQuestionRationale[qid].some((r) => ['R-SUBCONTRACT', 'R-LINK-SUPPLY'].includes(r))).toBe(true);
    }
  });
});

describe('deriveChecklist — 選択単調性（プロパティテスト）', () => {
  const accessLevels: SystemAccess[] = ['なし', '一般権限', '管理者権限'];
  const sizeLevels: VendorSize[] = ['小規模', '中規模', '大規模'];

  const accessRank = (a: SystemAccess) => accessLevels.indexOf(a);
  const sizeRank = (s: VendorSize) => sizeLevels.indexOf(s);

  // p ≤ q （linkType 固定・booleanはfalse→true・権限/規模は上位）を満たすか。
  const isLessOrEqual = (p: EngagementProfile, q: EngagementProfile) =>
    p.linkType === q.linkType &&
    Number(p.handlesPersonalData) <= Number(q.handlesPersonalData) &&
    Number(p.handlesConfidentialData) <= Number(q.handlesConfidentialData) &&
    Number(p.subcontracting) <= Number(q.subcontracting) &&
    Number(p.cloudService) <= Number(q.cloudService) &&
    accessRank(p.systemAccess) <= accessRank(q.systemAccess) &&
    sizeRank(p.vendorSize) <= sizeRank(q.vendorSize);

  it('属性を増やすと導出集合は単調増加する（p ⊆ q）', () => {
    // linkType を固定し、各属性軸で網羅的にプロファイルを列挙する。
    const linkType = '委託型' as const;
    const profiles: EngagementProfile[] = [];
    for (const pd of [false, true])
      for (const cd of [false, true])
        for (const sc of [false, true])
          for (const cloud of [false, true])
            for (const access of accessLevels)
              for (const size of sizeLevels)
                profiles.push({
                  linkType,
                  handlesPersonalData: pd,
                  handlesConfidentialData: cd,
                  subcontracting: sc,
                  cloudService: cloud,
                  systemAccess: access,
                  vendorSize: size,
                });

    let comparablePairs = 0;
    for (const p of profiles) {
      for (const q of profiles) {
        if (!isLessOrEqual(p, q)) continue;
        comparablePairs += 1;
        const setP = new Set(deriveChecklist(p).questionIds);
        const setQ = new Set(deriveChecklist(q).questionIds);
        for (const id of setP) {
          expect(setQ.has(id)).toBe(true);
        }
      }
    }
    // 実際に比較可能なペアが評価されたことを確認する。
    expect(comparablePairs).toBeGreaterThan(0);
  });
});
