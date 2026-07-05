export type Role = 'client' | 'vendor';

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
}

export interface Question {
  id: string;
  text: string;
  guideline: string;
  source?: 'SCS' | 'CIS';
  level?: 'SCS3' | 'SCS4' | 'CIS';
  category?: string;
  /** ISO/IEC 27002:2022 の管理策番号（例 '5.19'）。導出エンジン・証跡再利用の突合キー。 */
  controlId?: string;
  evidenceExamples?: string[];
  reviewCriteria?: string;
  riskTags?: string[];
  requiredFor?: string;
}

export interface Template {
  id: string;
  name: string;
  questions: Question[];
  /** 業務属性導出によって生成されたテンプレートの場合、その導出根拠を保持する。 */
  derivation?: DerivationResult;
  /** 導出に用いた業務属性プロファイル。 */
  profile?: EngagementProfile;
}

// ---------------------------------------------------------------------------
// 導出エンジン（業務属性 ⊢ 確認項目）用の型
// ---------------------------------------------------------------------------

/** 委託先との連携形態。 */
export type LinkType = '委託型' | '提携・相互接続型' | '供給型';
/** 委託先に付与するシステムアクセス権限のレベル。 */
export type SystemAccess = 'なし' | '一般権限' | '管理者権限';
/** 委託先の規模。 */
export type VendorSize = '小規模' | '中規模' | '大規模';

/** 業務属性プロファイル。導出エンジンの入力。 */
export interface EngagementProfile {
  linkType: LinkType;
  handlesPersonalData: boolean;
  handlesConfidentialData: boolean;
  systemAccess: SystemAccess;
  subcontracting: boolean; // 再委託の有無
  cloudService: boolean;
  vendorSize: VendorSize;
}

/**
 * 導出ルール。データ駆動（rules.ts）で記述する。
 * condition はプロファイル属性に対する述語。追加のみを行い、除外は行わない
 * （選択単調性を保証するため）。
 */
export interface Rule {
  id: string;
  description: string;
  condition: (profile: EngagementProfile) => boolean;
  addQuestionIds?: string[];
  addControlIds?: string[];
  /** ルールの適用段階（0=基本、値が大きいほど属性依存の追加）。並び順の安定化に使用。 */
  depth: number;
}

/** 導出結果。どのルールがどの設問を導出したかのトレーサビリティを保持する。 */
export interface DerivationResult {
  questionIds: string[];
  appliedRules: string[];
  /** questionId -> それを導出したルールIDの配列 */
  perQuestionRationale: Record<string, string[]>;
}

export interface PastAnswerSet {
  id: string;
  name: string;
  templateId: string;
  year: string;
  target: string;
  answers: Record<string, string>; // questionId -> answer text
}

export type DisclosureLevel = '提出可' | 'マスキング要' | '閲覧のみ' | '提出不可';

/** 証跡エンティティ。管理策ID（controlId）を軸に管理・再利用する。 */
export interface Evidence {
  id: string;
  fileName: string;
  controlId: string;
  registeredAt: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  version: string;
  disclosureLevel: DisclosureLevel;
}

export type ItemStatus = '依頼中' | '記載中' | '回答済' | '確認済' | '更問';
export type EvaluationResult = 'OK' | 'NG';
export type FinalDecision = '承認' | '承認（残対応項目あり）' | '却下';

export interface AnswerItem {
  questionId: string;
  answerText: string;
  status: ItemStatus;
  evidenceIds: string[]; // 紐づく Evidence の id 配列
  assignee: string;
  clientComment: string;
  needsAdditionalConfirm: boolean;
  evaluationResult?: EvaluationResult;
  evaluationComment?: string;
}

export type AssessmentStatus = '依頼中' | '回答中' | '確認中' | '評価中' | '完了' | '却下';

export interface Assessment {
  id: string;
  vendorId: string;
  templateId: string;
  deadline: string;
  status: AssessmentStatus;
  answers: Record<string, AnswerItem>; // questionId -> AnswerItem
  /** 導出モードで作成された場合の導出根拠（トレーサビリティ）。 */
  derivation?: DerivationResult;
  /** 導出に用いた業務属性プロファイル。 */
  profile?: EngagementProfile;
}

export type FollowUpStatus = '検討中' | '対応中' | '完了';

export interface FollowUpItem {
  id: string;
  title: string;
  agreement: string;
  deadline: string;
  status: FollowUpStatus;
  assignee: string;
}
