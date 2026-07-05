import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, AlertCircle, FileText, Upload, BrainCircuit, 
  Send, ListTodo, Plus, Edit2, Check, ArrowLeft, RefreshCw,
  ChevronRight, Calendar, User, Save, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Vendor, Template, Assessment, AnswerItem, AssessmentStatus,
  PastAnswerSet, FollowUpItem, FollowUpStatus, ItemStatus, Evidence
} from '../types';
import { ALL_QUESTIONS } from '../data';

interface VendorPortalProps {
  vendor: Vendor;
  assessments: Assessment[];
  templates: Template[];
  pastAnswers: PastAnswerSet[];
  evidences: Evidence[];
  followUps: FollowUpItem[];
  homeResetKey: number;
  onUpdateAssessmentItem: (assessmentId: string, questionId: string, updates: Partial<AnswerItem>) => void;
  onUpdateAssessmentStatus: (assessmentId: string, status: AssessmentStatus) => void;
  onRegisterEvidence: (evidence: Omit<Evidence, 'id'>) => string;
  onAddFollowUp: (item: Omit<FollowUpItem, 'id'>) => void;
  onUpdateFollowUp: (id: string, updates: Partial<FollowUpItem>) => void;
}

// ===========================================================================
// MOCK: AI回答提案。GitHub Pages 配信ではAPIキーが露出するため実API接続は行わず、
// 設問IDに対応する固定文言を返すモックとして維持する（本番実装時に差し替え想定）。
// ===========================================================================
const AI_ANSWER_PROPOSALS: Record<string, string> = {
  'scs3-01': '当社ではセキュリティ責任者、担当部署、平時・緊急時の連絡先を体制図と連絡先一覧で定義し、四半期ごとに更新しています。',
  'scs3-03': '情報セキュリティ方針を制定し、社内ポータルおよび入社時研修で関係者へ周知しています。改訂時は全社通知を行っています。',
  'scs3-08': 'ユーザIDの発行・変更・削除は申請承認フローで管理し、退職・異動時には不要IDを速やかに無効化しています。',
  'scs3-09': '重要データは日次でバックアップを取得し、復元手順書に基づいて年1回以上のリストア確認を実施しています。',
  'scs4-03': '脅威情報と脆弱性情報を定期収集し、監視ログと照合して優先度の高いリスクを運用会議で確認しています。',
  'scs4-07': '重要システムのアクセス権は最小権限を原則とし、権限付与基準と棚卸記録に基づいて定期確認しています。',
  'cis-01': '企業資産、端末、サーバ、クラウド資産を台帳で管理し、未管理資産が検出された場合は登録・是正しています。',
  'cis-05': '脆弱性診断結果とパッチ情報を継続的に確認し、重要度に応じた修正計画と適用記録を管理しています。',
  'cis-10': 'インシデント対応方針、役割、連絡体制、報告手順を文書化し、年1回の訓練で有効性を確認しています。',
};

const getAiProposalText = (questionId: string): string => {
  return AI_ANSWER_PROPOSALS[questionId] || '当該設問について、社内規程・運用記録・証跡資料を確認し、現在の管理状況と実施頻度、責任部署を明記して回答します。必要に応じて関連する台帳、手順書、承認記録、レビュー記録を証跡として添付します。';
};

// Evidence file names helper based on question ID
const getDummyFileName = (questionId: string): string => {
  switch (questionId) {
    case 'scs3-01': return 'security_organization_contacts.xlsx';
    case 'scs3-03': return 'security_policy_and_awareness_record.pdf';
    case 'scs3-08': return 'id_lifecycle_approval_records.xlsx';
    case 'scs3-09': return 'backup_restore_procedure_and_test_log.pdf';
    case 'scs4-03': return 'threat_intelligence_monitoring_record.pdf';
    case 'scs4-07': return 'critical_system_access_review.xlsx';
    case 'cis-01': return 'enterprise_asset_inventory.xlsx';
    case 'cis-05': return 'vulnerability_remediation_plan.xlsx';
    case 'cis-10': return 'incident_response_playbook.pdf';
    default: return 'security_evidence_attachment.pdf';
  }
};

export default function VendorPortal({
  vendor,
  assessments,
  templates,
  pastAnswers,
  evidences,
  followUps,
  homeResetKey,
  onUpdateAssessmentItem,
  onUpdateAssessmentStatus,
  onRegisterEvidence,
  onAddFollowUp,
  onUpdateFollowUp
}: VendorPortalProps) {
  const [currentView, setCurrentView] = useState<'home' | 'assessment_list' | 'answer_screen' | 'followup'>('home');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  // AI Answer Proposal Modal states
  const [activeProposalQId, setActiveProposalQId] = useState<string | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  // Follow-up input form states
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [newFollowTitle, setNewFollowTitle] = useState('');
  const [newFollowAgreement, setNewFollowAgreement] = useState('');
  const [newFollowDeadline, setNewFollowDeadline] = useState('2026-08-31');
  const [newFollowAssignee, setNewFollowAssignee] = useState('情報システム担当');
  const [newFollowStatus, setNewFollowStatus] = useState<FollowUpStatus>('検討中');

  // Editing Follow-up states
  const [editingFollowId, setEditingFollowId] = useState<string | null>(null);
  const [editFollowStatus, setEditFollowStatus] = useState<FollowUpStatus>('検討中');
  const [editFollowAssignee, setEditFollowAssignee] = useState('');

  // Selected Assessment Details
  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);
  const selectedTemplate = selectedAssessment ? templates.find(t => t.id === selectedAssessment.templateId) : null;

  useEffect(() => {
    setCurrentView('home');
    setSelectedAssessmentId(null);
    setActiveProposalQId(null);
    setIsGeneratingProposal(false);
    setIsAddingFollowUp(false);
    setEditingFollowId(null);
  }, [homeResetKey]);

  // Filter assessments for this vendor (A社)
  const myAssessments = assessments.filter(a => a.vendorId === vendor.id);

  // Unanswered / pending notification alert
  const hasPendingRequest = myAssessments.some(a => ['依頼中', '回答中'].includes(a.status));

  // Status badge style helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '依頼中': return 'bg-slate-100 text-slate-700 border-slate-200';
      case '回答中': return 'bg-sky-50 text-sky-700 border-sky-100';
      case '記載中': return 'bg-blue-50 text-blue-700 border-blue-100';
      case '確認中': return 'bg-amber-50 text-amber-700 border-amber-100';
      case '回答済': return 'bg-amber-100 text-amber-800 border-amber-200';
      case '評価中': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case '確認済': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case '完了': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '却下': return 'bg-rose-100 text-rose-800 border-rose-200';
      case '更問': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // 1. One-click Past Answers Import（controlId ベースの突合）
  // 過去回答は questionId 直結ではなく、管理策ID（controlId）でマッチングする。
  // これにより、様式（テンプレート）が異なっても同一管理策の回答を再利用候補にできる。
  const handleImportPastAnswers = (pastSetId: string) => {
    if (!selectedAssessment || !selectedTemplate) return;
    const pastSet = pastAnswers.find(pa => pa.id === pastSetId);
    if (!pastSet) return;

    // 過去回答の questionId を controlId へ解決し、controlId -> 回答本文のマップを作る。
    const controlToAnswer = new Map<string, string>();
    Object.entries(pastSet.answers).forEach(([qid, text]) => {
      const control = ALL_QUESTIONS.find(q => q.id === qid)?.controlId;
      if (control && !controlToAnswer.has(control)) {
        controlToAnswer.set(control, text);
      }
    });

    let importCount = 0;
    selectedTemplate.questions.forEach(q => {
      // 同一 questionId、または同一 controlId の過去回答があれば転記する。
      const directText = pastSet.answers[q.id];
      const controlText = q.controlId ? controlToAnswer.get(q.controlId) : undefined;
      const sourceText = directText ?? controlText;
      if (!sourceText) return;

      const matchNote = directText
        ? `（『${pastSet.name}』より転記）`
        : `（『${pastSet.name}』より同一管理策 ${q.controlId} の回答を転記）`;
      onUpdateAssessmentItem(selectedAssessment.id, q.id, {
        answerText: `${sourceText}\n${matchNote}`,
        status: '記載中'
      });
      importCount++;
    });

    alert(`${importCount}件の設問に対して、過去の回答履歴「${pastSet.name}」から管理策ID突合で一括転記を行いました。残りの項目を記入してください。`);
  };

  // 2. Mock Attachment Upload
  // 証跡をレジストリ（Evidence）へ登録し、その id を回答項目の evidenceIds に追加する。
  const handleAddDummyAttachment = (questionId: string) => {
    if (!selectedAssessment) return;
    const fileName = getDummyFileName(questionId);
    const controlId = ALL_QUESTIONS.find(q => q.id === questionId)?.controlId ?? '';
    const today = new Date().toISOString().slice(0, 10);
    const validUntil = `${new Date().getFullYear() + 1}${today.slice(4)}`;
    const evidenceId = onRegisterEvidence({
      fileName,
      controlId,
      registeredAt: today,
      validUntil,
      version: '1.0',
      disclosureLevel: '提出可',
    });
    const current = selectedAssessment.answers[questionId]?.evidenceIds ?? [];
    onUpdateAssessmentItem(selectedAssessment.id, questionId, {
      evidenceIds: [...current, evidenceId],
      status: '記載中'
    });
  };

  // 証跡IDから Evidence を解決するヘルパー。
  const resolveEvidences = (ids: string[]): Evidence[] =>
    ids.map(id => evidences.find(ev => ev.id === id)).filter((ev): ev is Evidence => Boolean(ev));

  // 指定設問の回答から証跡IDを1件除去する。
  const removeEvidenceId = (questionId: string, evidenceId: string) => {
    if (!selectedAssessment) return;
    const current = selectedAssessment.answers[questionId]?.evidenceIds ?? [];
    onUpdateAssessmentItem(selectedAssessment.id, questionId, {
      evidenceIds: current.filter(id => id !== evidenceId),
    });
  };

  // 3. Mock AI Answer proposal generator trigger
  const triggerAiProposal = (questionId: string) => {
    setActiveProposalQId(questionId);
    setIsGeneratingProposal(true);
    setTimeout(() => {
      setIsGeneratingProposal(false);
    }, 1000);
  };

  // 4. Adopt AI Proposal
  const adoptAiProposal = () => {
    if (!selectedAssessment || !activeProposalQId) return;
    const proposalText = getAiProposalText(activeProposalQId);
    onUpdateAssessmentItem(selectedAssessment.id, activeProposalQId, {
      answerText: proposalText,
      status: '記載中'
    });
    setActiveProposalQId(null);
  };

  // 5. Submit Answers
  const handleSubmitAssessment = () => {
    if (!selectedAssessment) return;
    
    // Validate if at least some answers are filled
    const allAnswers = Object.values(selectedAssessment.answers);
    const hasUnfilled = allAnswers.some(ans => !ans.answerText);
    
    if (hasUnfilled) {
      if (!confirm('まだ未回答の設問が含まれています。このまま送信してよろしいですか？')) {
        return;
      }
    }

    // Set all answer items' status to '回答済'
    Object.keys(selectedAssessment.answers).forEach(qId => {
      onUpdateAssessmentItem(selectedAssessment.id, qId, { status: '回答済' });
    });

    // Update overall assessment status to '確認中'
    onUpdateAssessmentStatus(selectedAssessment.id, '確認中');
    
    alert('Z社へ回答シートの送付が完了しました。Z社セキュリティ事務局での審査をお待ちください。');
    setCurrentView('assessment_list');
  };

  // 6. Add Follow Up
  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowTitle) return;
    onAddFollowUp({
      title: newFollowTitle,
      agreement: newFollowAgreement,
      deadline: newFollowDeadline,
      status: newFollowStatus,
      assignee: newFollowAssignee
    });
    setIsAddingFollowUp(false);
    setNewFollowTitle('');
    setNewFollowAgreement('');
    setNewFollowDeadline('2026-08-31');
    setNewFollowAssignee('情報システム担当');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Vendor Portal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-1">
            <span>{vendor.name} 担当者ポータル</span>
            {currentView !== 'home' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setCurrentView('home')} className="hover:text-blue-600 transition-colors">
                  ホーム
                </button>
              </>
            )}
            {currentView === 'assessment_list' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">回答依頼状況</span>
              </>
            )}
            {currentView === 'answer_screen' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setCurrentView('assessment_list')} className="hover:text-blue-600">依頼一覧</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">回答入力フォーム</span>
              </>
            )}
            {currentView === 'followup' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">残対応項目（改善フォロー）</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
            {currentView === 'home' && `${vendor.name} セキュリティ監査対応システム`}
            {currentView === 'assessment_list' && 'セキュリティチェックシート回答依頼一覧'}
            {currentView === 'answer_screen' && `Z社宛 ${selectedTemplate?.name} 回答作成画面`}
            {currentView === 'followup' && '改善事項フォローアップ・残作業管理'}
          </h1>
        </div>
      </div>

      {/* Global Notice Banner */}
      {currentView === 'home' && hasPendingRequest && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6 shadow-sm flex items-start space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-800">
              重要なお知らせ：新しい回答依頼が届いています
            </h3>
            <p className="text-xs text-amber-700 mt-1">
              委託元（Z社）よりセキュリティチェックシートの回答依頼が届いています。「回答依頼の確認」ボタン、または下の「回答メニュー」よりフォームを開き、回答および証跡の提出をお願いします。
            </p>
            <button
              id="notice-banner-action"
              onClick={() => {
                // If there is an assessment, auto select the first one
                if (myAssessments.length > 0) {
                  setSelectedAssessmentId(myAssessments[0].id);
                  setCurrentView('answer_screen');
                } else {
                  setCurrentView('assessment_list');
                }
              }}
              className="mt-2.5 inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              回答入力フォームを直接開く
            </button>
          </div>
        </motion.div>
      )}

      {/* VIEW: HOME */}
      {currentView === 'home' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Answer assessments Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-lg mb-2">セキュリティチェックシート回答</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Z社などの委託元から届いたセキュリティ評価依頼に対応します。過去回答セットからのワンクリック自動入力や、AI回答下書き作成機能が利用できます。
              </p>
              
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                <div className="text-xs text-slate-400 font-bold uppercase">現在の依頼状況</div>
                {myAssessments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">現在届いている回答依頼はありません。</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {myAssessments.map(a => (
                      <li key={a.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                        <span className="font-semibold text-slate-700">Z社向けチェックシート（期限：{a.deadline}）</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold ${getStatusBadgeClass(a.status)}`}>
                          {a.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              id="open-assessment-list-btn"
              onClick={() => setCurrentView('assessment_list')}
              className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              回答依頼の一覧・作成へ
            </button>
          </div>

          {/* Follow ups (改善フォロー) Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ListTodo className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-lg mb-2">改善指摘・残対応事項管理</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                審査官から指摘されたセキュリティ不備（指摘事項）に対する改善プランの進捗、期限、担当者を一元管理します。
              </p>

              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                <div className="text-xs text-slate-400 font-bold uppercase">残りの対応タスク</div>
                <div className="flex justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded">
                  <span>検討中 / 対応中のタスク</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {followUps.filter(f => f.status !== '完了').length} 件
                  </span>
                </div>
              </div>
            </div>

            <button
              id="open-followup-btn"
              onClick={() => setCurrentView('followup')}
              className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-medium rounded-lg text-sm transition-colors"
            >
              残対応事項（改善フォロー）を開く
            </button>
          </div>
        </motion.div>
      )}

      {/* VIEW: ASSESSMENT LIST */}
      {currentView === 'assessment_list' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-base">Z社から受領したセキュリティ回答依頼</h3>
              <p className="text-xs text-slate-500 mt-1">
                回答シートを開き、適切な対策内容を入力して提出送信してください。
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {myAssessments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                現在、Z社からのセキュリティチェック依頼はありません。
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">委託元企業</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">規格・テンプレート</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">提出期限</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">回答ステータス</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">アクション</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {myAssessments.map(a => {
                    const template = templates.find(t => t.id === a.templateId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-800">Z社（委託元）</div>
                          <div className="text-xs text-slate-500">セキュリティ事務局</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                          {template?.name} チェックシート ({template?.questions.length}項目)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          <div className="flex items-center space-x-1.5 font-mono text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{a.deadline}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(a.status)}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            id={`open-answer-form-${a.id}`}
                            onClick={() => {
                              setSelectedAssessmentId(a.id);
                              setCurrentView('answer_screen');
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md font-semibold transition-all"
                          >
                            {a.status === '完了' ? '提出回答の閲覧' : '回答を記入する'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* VIEW: ANSWER SCREEN */}
      {currentView === 'answer_screen' && selectedAssessment && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Checklist Quick Controls / Past Answers import */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-base">回答作成・サポートツール</h3>
                <p className="text-xs text-slate-500 mt-1">
                  過去に提出済みの他社向けチェックリスト情報から転記したり、AI機能を用いた下書きの自動作成が可能です。
                </p>
              </div>

              {/* Past Answers Selection Dropdown */}
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2.5 items-center">
                <span className="text-xs font-semibold text-slate-500">過去回答インポート：</span>
                <select
                  id="past-answer-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleImportPastAnswers(e.target.value);
                      e.target.value = ''; // Reset
                    }
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- 過去の回答履歴セットを選択 --</option>
                  {pastAnswers.map(pa => (
                    <option key={pa.id} value={pa.id}>
                      {pa.name} ({pa.year})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setCurrentView('assessment_list')}
                  className="px-3 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>一覧に戻る</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Questions Cards */}
          <div className="space-y-4">
            {selectedTemplate?.questions.map((question, index) => {
              const answer = selectedAssessment.answers[question.id] || {
                questionId: question.id,
                answerText: '',
                status: '依頼中',
                evidenceIds: [],
                assignee: '',
                clientComment: '',
                needsAdditionalConfirm: false
              };
              const attachedEvidences = resolveEvidences(answer.evidenceIds);

              return (
                <div key={question.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Q Section */}
                    <div className="lg:col-span-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          設問 {index + 1}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-mono font-medium">
                          {question.guideline}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs border font-medium ${getStatusBadgeClass(answer.status)}`}>
                          {answer.status}
                        </span>
                      </div>

                      <h4 className="font-sans font-bold text-slate-800 text-sm leading-relaxed">
                        {question.text}
                      </h4>
                      <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        {question.category && (
                          <div>
                            <span className="font-semibold text-slate-500">カテゴリ：</span>{question.category}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-500">根拠：</span>{question.guideline}
                        </div>
                        {question.evidenceExamples && question.evidenceExamples.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-500">証跡例：</span>{question.evidenceExamples.join('、')}
                          </div>
                        )}
                      </div>

                      {/* CLIENT FEEDBACK WARNING (if returned / has comment) */}
                      {answer.clientComment && (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-800 space-y-1 mt-2">
                          <div className="font-bold flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                            <span>Z社審査官からの指摘・コメント</span>
                          </div>
                          <p className="font-sans whitespace-pre-wrap text-slate-700">{answer.clientComment}</p>
                          {answer.needsAdditionalConfirm && (
                            <div className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded w-max mt-1">
                              ⚠️ 要追加確認マークあり
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Answer Fill Section */}
                    <div className="lg:col-span-8 space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-semibold text-slate-500">
                            回答テキスト <span className="text-rose-500">*</span>
                          </label>
                          
                          {/* AI proposal draft co-pilot helper */}
                          <button
                            id={`ai-proposal-btn-${question.id}`}
                            type="button"
                            onClick={() => triggerAiProposal(question.id)}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            <BrainCircuit className="w-3.5 h-3.5 mr-1 text-blue-500" />
                            AI回答提案を作成
                          </button>
                        </div>

                        <textarea
                          id={`answer-textarea-${question.id}`}
                          disabled={selectedAssessment.status === '完了' || selectedAssessment.status === '確認中'}
                          value={answer.answerText}
                          onChange={(e) => onUpdateAssessmentItem(selectedAssessment.id, question.id, {
                            answerText: e.target.value,
                            status: '記載中'
                          })}
                          placeholder="セキュリティ対策状況を記入してください（過去データコピーやAI提案も活用できます）"
                          className="w-full h-28 border border-slate-300 rounded-lg p-3 text-sm font-sans focus:ring-1 focus:ring-blue-500 focus:outline-none resize-y bg-white"
                        />
                      </div>

                      {/* Evidence upload & assignee Row */}
                      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                        {/* Evidence attachment */}
                        <div className="w-full sm:w-auto">
                          <span className="block text-[10px] font-semibold text-slate-400 mb-1">証跡添付資料（PDF、Excel、Word等 / 複数登録可）</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {attachedEvidences.map(ev => (
                              <div key={ev.id} className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5 text-xs text-emerald-800 font-mono">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                <span>{ev.fileName}</span>
                                {ev.controlId && (
                                  <span className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-1 py-0.5 rounded font-sans">管理策 {ev.controlId}</span>
                                )}
                                <span className="text-[10px] text-emerald-600 font-sans">{ev.disclosureLevel}</span>
                                <button
                                  onClick={() => removeEvidenceId(question.id, ev.id)}
                                  className="text-rose-600 hover:text-rose-800 font-sans font-bold text-xs pl-1"
                                >
                                  削除
                                </button>
                              </div>
                            ))}
                            <button
                              id={`upload-evidence-${question.id}`}
                              disabled={selectedAssessment.status === '完了' || selectedAssessment.status === '確認中'}
                              onClick={() => handleAddDummyAttachment(question.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded shadow-sm transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              証跡ファイルを登録
                            </button>
                          </div>
                        </div>

                        {/* Assignee */}
                        <div className="w-full sm:w-auto flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">社内担当者:</span>
                          <input
                            type="text"
                            disabled={selectedAssessment.status === '完了' || selectedAssessment.status === '確認中'}
                            value={answer.assignee}
                            onChange={(e) => onUpdateAssessmentItem(selectedAssessment.id, question.id, { assignee: e.target.value })}
                            placeholder="（例）セキュリティ課：山田"
                            className="border border-slate-300 rounded p-1 text-xs w-44 bg-white"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Action Block */}
          {['依頼中', '回答中', '更問'].includes(selectedAssessment.status) && (
            <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 shadow-md">
              <div>
                <h3 className="font-sans font-bold text-base text-slate-100">回答情報の正式提出</h3>
                <p className="text-xs text-slate-400 mt-1">
                  すべての入力が終わりましたら「回答シートを送信する」を押して委託元（Z社）へ審査を提出してください。
                </p>
              </div>

              <button
                id="submit-answers-btn"
                onClick={handleSubmitAssessment}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-md transition-all"
              >
                <Send className="w-4 h-4 mr-1.5" />
                回答シートを正式送信する
              </button>
            </div>
          )}

        </motion.div>
      )}

      {/* VIEW: FOLLOW UP (残作業管理) */}
      {currentView === 'followup' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Add Follow Up Form trigger */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-base">セキュリティ不備事項の改善フォロー管理</h3>
              <p className="text-xs text-slate-500 mt-1">
                審査官から指摘された課題や不備に対する「改善ロードマップ」を管理します。追加・編集・ステータス更新が可能です。
              </p>
            </div>

            <button
              onClick={() => setIsAddingFollowUp(true)}
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              改善フォロー項目を追加
            </button>
          </div>

          {/* Adding Form Block */}
          {isAddingFollowUp && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-50 border border-slate-200 rounded-xl p-5 overflow-hidden"
            >
              <form onSubmit={handleSaveFollowUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 text-sm font-bold text-slate-800 mb-2 border-b pb-1">
                  新規改善フォロー項目の登録
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">改善項目名 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newFollowTitle}
                    onChange={(e) => setNewFollowTitle(e.target.value)}
                    placeholder="（例）セキュリティポリシーの役員会正式決裁"
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">対応担当者</label>
                  <input
                    type="text"
                    value={newFollowAssignee}
                    onChange={(e) => setNewFollowAssignee(e.target.value)}
                    placeholder="（例）情報システム部：佐藤"
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">合意内容・是正計画</label>
                  <textarea
                    value={newFollowAgreement}
                    onChange={(e) => setNewFollowAgreement(e.target.value)}
                    placeholder="委託元（Z社）と合意した是正内容を具体的に記入してください"
                    className="w-full h-20 border border-slate-300 rounded p-2 text-sm bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">改善対応期限</label>
                  <input
                    type="date"
                    value={newFollowDeadline}
                    onChange={(e) => setNewFollowDeadline(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ステータス</label>
                  <select
                    value={newFollowStatus}
                    onChange={(e) => setNewFollowStatus(e.target.value as FollowUpStatus)}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                  >
                    <option value="検討中">検討中</option>
                    <option value="対応中">対応中</option>
                    <option value="完了">完了</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-2 pt-2 border-t mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingFollowUp(false)}
                    className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs rounded"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                  >
                    項目を登録する
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Follow-up Items List Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">改善項目名</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">合意内容・是正計画</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">改善期限</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">担当者</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ステータス</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">アクション</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {followUps.map(item => {
                    const isEditing = editingFollowId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {item.title}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                          {item.agreement}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                          <div className="flex items-center space-x-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.deadline}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFollowAssignee}
                              onChange={(e) => setEditFollowAssignee(e.target.value)}
                              className="border border-slate-300 rounded p-1 text-xs w-32"
                            />
                          ) : (
                            item.assignee
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editFollowStatus}
                              onChange={(e) => setEditFollowStatus(e.target.value as FollowUpStatus)}
                              className="border border-slate-300 rounded p-1 text-xs"
                            >
                              <option value="検討中">検討中</option>
                              <option value="対応中">対応中</option>
                              <option value="完了">完了</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              item.status === '完了' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : item.status === '対応中'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          {isEditing ? (
                            <button
                              id={`save-followup-edit-${item.id}`}
                              onClick={() => {
                                onUpdateFollowUp(item.id, {
                                  status: editFollowStatus,
                                  assignee: editFollowAssignee
                                });
                                setEditingFollowId(null);
                              }}
                              className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded inline-flex items-center space-x-0.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>保存</span>
                            </button>
                          ) : (
                            <button
                              id={`edit-followup-btn-${item.id}`}
                              onClick={() => {
                                setEditingFollowId(item.id);
                                setEditFollowStatus(item.status);
                                setEditFollowAssignee(item.assignee);
                              }}
                              className="text-blue-600 hover:text-blue-800 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded inline-flex items-center space-x-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>更新</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Answer Proposal Dialog */}
      <AnimatePresence>
        {activeProposalQId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center space-x-2 text-blue-700 font-bold mb-3 border-b border-slate-100 pb-3">
                <BrainCircuit className="w-5 h-5" />
                <span>AI セキュリティ Copilot 回答提案</span>
              </div>

              {isGeneratingProposal ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">
                    セキュリティ規格(SCS/CIS)と企業の一般回答モデルに沿って、最適な文面を下書き中...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-400 block mb-1">対象設問:</span>
                    <p className="text-slate-800 font-semibold leading-relaxed">
                      {selectedTemplate?.questions.find(q => q.id === activeProposalQId)?.text}
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">AIが作成した回答案:</span>
                    <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-4 text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                      {getAiProposalText(activeProposalQId)}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    ※この提案は一般モデルを想定した文面です。自社の実際の対応環境に応じて編集してご利用ください。
                  </p>

                  <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveProposalQId(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg"
                    >
                      閉じる
                    </button>
                    <button
                      id="adopt-ai-proposal-btn"
                      type="button"
                      onClick={adoptAiProposal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      回答案を「採用」する
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
