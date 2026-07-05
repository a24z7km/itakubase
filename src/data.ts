import { Vendor, Question, Template, PastAnswerSet, FollowUpItem } from './types';

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'v1', name: 'A社', contactPerson: '山田 太郎', email: 'yamada@company-a.com' },
  { id: 'v2', name: 'B社', contactPerson: '鈴木 一郎', email: 'suzuki@company-b.com' },
  { id: 'v3', name: 'C社', contactPerson: '佐藤 花子', email: 'sato@company-c.com' },
];

export const QUESTIONS_SCS3: Question[] = [
  { id: 'q1', text: '情報セキュリティ方針が作成され、経営層の承認を得ているか', guideline: 'SCS 1-1' },
  { id: 'q2', text: '従業員へのセキュリティ教育を定期的に実施しているか', guideline: 'SCS 3-1' },
  { id: 'q3', text: '情報漏えい発生時の責任分界・連絡体制が整理されているか', guideline: 'SCS 2-2' },
  { id: 'q4', text: 'アクセス権限の付与・棚卸のルールがあるか', guideline: 'CIS Controls 5' },
  { id: 'q5', text: '重要データのバックアップを取得・検証しているか', guideline: 'CIS Controls 11' },
  { id: 'q6', text: 'OS・ソフトウェアの脆弱性修正（パッチ適用）を実施しているか', guideline: 'CIS Controls 7' },
  { id: 'q7', text: 'インシデント発生時の対応手順が文書化されているか', guideline: 'SCS 4-1' },
  { id: 'q8', text: '再委託を行う場合の管理ルールがあるか', guideline: 'SCS 2-3' },
];

export const QUESTIONS_SCS4: Question[] = [
  ...QUESTIONS_SCS3,
  { id: 'q9', text: '外部機関によるペネトレーションテストを年1回以上実施しているか', guideline: 'CIS Controls 18' },
  { id: 'q10', text: 'WAF等のセキュリティ防御システムをネットワーク・アプリ境界に導入しているか', guideline: 'SCS 5-2' },
];

export const INITIAL_TEMPLATES: Template[] = [
  { id: 't1', name: 'SCS ⭐︎3', questions: QUESTIONS_SCS3 },
  { id: 't2', name: 'SCS ⭐︎4', questions: QUESTIONS_SCS4 },
];

export const INITIAL_PAST_ANSWERS: PastAnswerSet[] = [
  {
    id: 'pa1',
    name: 'SCS ⭐︎3（2025年回答：S社向け）',
    templateId: 't1',
    year: '2025年',
    target: 'S社向け',
    answers: {
      q1: '情報セキュリティ基本方針を2024年4月に制定し、取締役会にて承認を得ております。最新の改訂は2025年4月です。',
      q2: '全従業員（派遣・役員含む）を対象に、年2回（10月・3月）にE-learningによる研修および確認テストを実施し、受講率100%を維持しています。',
      q3: 'インシデント等発生時のエスカレーションフロー図を作成・配備。連絡体制及び責任分界は基本契約書第12条「秘密保持およびインシデント対応」にて定義済みです。',
      q4: '社内管理システムにて個人ごとに最小限のアクセス権限を付与。また、半年に1回（5月・11月）にアカウント有効性の棚卸監査を実施しています。',
      q5: '基幹データの暗号化バックアップを毎日深夜にAWS S3に自動転送・世代保存。また、毎年12月にバックアップデータを用いた復旧シミュレーション訓練を実施し稼働を確認しています。',
    },
  },
];

export const INITIAL_FOLLOWUPS: FollowUpItem[] = [
  {
    id: 'f1',
    title: 'セキュリティポリシの役員承認フローの整備',
    agreement: '現状のセキュリティポリシーは部長決裁となっているため、次回改訂時に役員（取締役会）の承認フローを正式整備し、承認書コピーを提出すること。',
    deadline: '2026-08-31',
    status: '検討中',
    assignee: '情シス：佐藤',
  },
];
