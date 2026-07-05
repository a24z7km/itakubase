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
  evidenceExamples?: string[];
  reviewCriteria?: string;
  riskTags?: string[];
  requiredFor?: string;
}

export interface Template {
  id: string;
  name: string;
  questions: Question[];
}

export interface PastAnswerSet {
  id: string;
  name: string;
  templateId: string;
  year: string;
  target: string;
  answers: Record<string, string>; // questionId -> answer text
}

export type ItemStatus = '依頼中' | '記載中' | '回答済' | '確認済' | '更問';
export type EvaluationResult = 'OK' | 'NG';
export type FinalDecision = '承認' | '承認（残対応項目あり）' | '却下';

export interface AnswerItem {
  questionId: string;
  answerText: string;
  status: ItemStatus;
  evidence: string | null; // filename like "policy.pdf" or null
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
