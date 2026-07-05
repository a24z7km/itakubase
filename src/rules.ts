import { EngagementProfile, Rule, SystemAccess, VendorSize } from './types';

/**
 * 導出ルール定義（データ駆動）。
 *
 * 設計方針:
 *  - ルールは「追加のみ」を行う。除外ルールは作らない。
 *  - 各 condition は業務属性の半順序に対して上方閉（upward-closed）とする。
 *    すなわち、属性を「増やす」（boolean を true に、権限・規模を上位に）と
 *    condition が false から true に変わることはあっても、true から false に
 *    変わることはない。これにより導出集合の単調増加（選択単調性）が保証される。
 *  - 追加対象は addControlIds（ISO/IEC 27002:2022 管理策番号）を主とし、
 *    導出エンジンが該当 controlId を持つ設問へ解決する。
 */

// 権限・規模を数値ランクへ変換し、`>=` 比較で上方閉な述語を書けるようにする。
const accessRank = (a: SystemAccess): number =>
  a === '管理者権限' ? 2 : a === '一般権限' ? 1 : 0;

const sizeRank = (s: VendorSize): number =>
  s === '大規模' ? 2 : s === '中規模' ? 1 : 0;

export const DERIVATION_RULES: Rule[] = [
  {
    id: 'R-BASELINE',
    description: '全ての委託関係に共通する基本統制（方針・体制・インシデント対応・バックアップ）。',
    condition: () => true,
    addControlIds: ['5.1', '5.2', '5.24', '8.13'],
    depth: 0,
  },
  {
    id: 'R-CONFIDENTIAL',
    description: '機密情報を取り扱うため、守秘義務・取引先管理・契約終了時の情報回収を確認する。',
    condition: (p: EngagementProfile) => p.handlesConfidentialData,
    addControlIds: ['6.6', '5.19', '5.11'],
    depth: 1,
  },
  {
    id: 'R-PERSONAL-DATA',
    description: '個人情報を取り扱うため、情報分類・暗号化・法令要求対応を確認する。',
    condition: (p: EngagementProfile) => p.handlesPersonalData,
    addControlIds: ['5.12', '8.24', '5.31'],
    depth: 1,
  },
  {
    id: 'R-ACCESS-GENERAL',
    description: '自社システムへのアクセス権を付与するため、ID管理・アクセス権管理を確認する。',
    condition: (p: EngagementProfile) => accessRank(p.systemAccess) >= 1,
    addControlIds: ['5.16', '5.18'],
    depth: 1,
  },
  {
    id: 'R-ACCESS-ADMIN',
    description: '管理者権限を付与するため、ログ監視・脆弱性管理・マルウェア対策を追加で確認する。',
    condition: (p: EngagementProfile) => accessRank(p.systemAccess) >= 2,
    addControlIds: ['8.15', '8.8', '8.7'],
    depth: 2,
  },
  {
    id: 'R-CLOUD',
    description: 'クラウドサービスを利用するため、クラウド利用管理・外部資産一覧を確認する。',
    condition: (p: EngagementProfile) => p.cloudService,
    addControlIds: ['5.23', '5.9'],
    depth: 1,
  },
  {
    id: 'R-SUBCONTRACT',
    description: '再委託が発生するため、サプライチェーン上の委託先評価・継続監視を確認する。',
    condition: (p: EngagementProfile) => p.subcontracting,
    addControlIds: ['5.19', '5.22'],
    depth: 2,
  },
  {
    id: 'R-SIZE-MEDIUM',
    description: '中規模以上のため、資産管理・マルウェア対策の整備状況を確認する。',
    condition: (p: EngagementProfile) => sizeRank(p.vendorSize) >= 1,
    addControlIds: ['5.9', '8.7'],
    depth: 1,
  },
  {
    id: 'R-SIZE-LARGE',
    description: '大規模のため、経営関与・脅威情報収集・脆弱性管理の高度な体制を確認する。',
    condition: (p: EngagementProfile) => sizeRank(p.vendorSize) >= 2,
    addControlIds: ['5.4', '5.7', '8.8'],
    depth: 2,
  },
  {
    id: 'R-LINK-COMMISSION',
    description: '委託型のため、取引先管理と契約終了時の資産回収を確認する。',
    condition: (p: EngagementProfile) => p.linkType === '委託型',
    addControlIds: ['5.19', '5.11'],
    depth: 1,
  },
  {
    id: 'R-LINK-INTERCONNECT',
    description: '提携・相互接続型（水平連携）のため、脅威情報連携・ログ監視・インシデント連絡体制を確認する。',
    condition: (p: EngagementProfile) => p.linkType === '提携・相互接続型',
    addControlIds: ['5.7', '8.15', '5.24'],
    depth: 1,
  },
  {
    id: 'R-LINK-SUPPLY',
    description: '供給型のため、サプライチェーン管理・供給者評価・クラウド利用管理を確認する。',
    condition: (p: EngagementProfile) => p.linkType === '供給型',
    addControlIds: ['5.19', '5.22', '5.23'],
    depth: 1,
  },
];

/** ルールIDから説明文を引く（UIの導出根拠表示に使用）。 */
export const RULE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  DERIVATION_RULES.map((r) => [r.id, r.description]),
);
