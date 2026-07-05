import React, { useState } from 'react';
import { 
  Plus, Users, ClipboardCheck, ArrowLeft, Send, CheckCircle2, 
  AlertTriangle, FileText, BrainCircuit, MessageSquare, AlertCircle, 
  ChevronRight, Calendar, UserCheck, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vendor, Template, Assessment, AnswerItem, AssessmentStatus, Role } from '../types';

interface ClientPortalProps {
  vendors: Vendor[];
  assessments: Assessment[];
  templates: Template[];
  onAddVendor: (name: string, contact: string, email: string) => void;
  onCreateAssessment: (vendorId: string, templateId: string, deadline: string) => void;
  onUpdateAssessmentItem: (assessmentId: string, questionId: string, updates: Partial<AnswerItem>) => void;
  onUpdateAssessmentStatus: (assessmentId: string, status: AssessmentStatus) => void;
  onReturnToVendor: (assessmentId: string) => void;
  onConfirmAll: (assessmentId: string) => void;
  onApproveAssessment: (assessmentId: string) => void;
}

export default function ClientPortal({
  vendors,
  assessments,
  templates,
  onAddVendor,
  onCreateAssessment,
  onUpdateAssessmentItem,
  onUpdateAssessmentStatus,
  onReturnToVendor,
  onConfirmAll,
  onApproveAssessment
}: ClientPortalProps) {
  const [currentView, setCurrentView] = useState<'home' | 'vendor_list' | 'assessment_detail' | 'request_wizard'>('home');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  // Request wizard states
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardVendorId, setWizardVendorId] = useState<string>('');
  const [wizardTemplateId, setWizardTemplateId] = useState<string>('');
  const [wizardDeadline, setWizardDeadline] = useState<string>('2026-08-31');
  const [isAddingNewVendor, setIsAddingNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorContact, setNewVendorContact] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');

  // AI assessment review panel state
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [aiCheckResults, setAiCheckResults] = useState<string[] | null>(null);

  // Find selected assessment
  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);
  const selectedVendor = selectedAssessment ? vendors.find(v => v.id === selectedAssessment.vendorId) : null;
  const selectedTemplate = selectedAssessment ? templates.find(t => t.id === selectedAssessment.templateId) : null;

  // Status Colors for badges
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
      case '更問': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // Run AI One-click check
  const handleAiCheck = () => {
    setIsAiChecking(true);
    setAiCheckResults(null);
    setTimeout(() => {
      setIsAiChecking(false);
      // Generate some smart suggestions based on what's answered
      if (selectedAssessment) {
        const results = [
          '【要確認】設問1（セキュリティ方針）: 回答テキストに対象範囲の明記がありません。子会社や協力会社が含まれているか確認を推奨します。',
          '【要更問】設問3（責任分界・連絡体制）: 責任分界の記載が「SLAにて定義」とありますが、実際の契約書該当条項（例：第12条等）の提示を求めることを推奨します。',
          '【確認済】設問5（バックアップ）: 暗号化、世代管理、復旧シミュレーションまで詳細に回答されており、十分な対策と評価できます。',
        ];
        setAiCheckResults(results);
      }
    }, 1200);
  };

  // Submit wizard handler
  const handleSendRequest = () => {
    if (!wizardVendorId || !wizardTemplateId) return;
    onCreateAssessment(wizardVendorId, wizardTemplateId, wizardDeadline);
    // Reset wizard
    setWizardStep(1);
    setWizardVendorId('');
    setWizardTemplateId('');
    setIsAddingNewVendor(false);
    // Redirect to assessment list
    setCurrentView('vendor_list');
  };

  // Add New Vendor in Wizard
  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName) return;
    onAddVendor(newVendorName, newVendorContact, newVendorEmail);
    // Auto select newly created vendor
    // We assume the newest vendor has index list length, let's select it in the state update
    setIsAddingNewVendor(false);
    setNewVendorName('');
    setNewVendorContact('');
    setNewVendorEmail('');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Client Portal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-1">
            <span>Z社セキュリティ事務局ポータル</span>
            {currentView !== 'home' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button 
                  onClick={() => {
                    setCurrentView('home');
                    setAiCheckResults(null);
                  }} 
                  className="hover:text-blue-600 transition-colors"
                >
                  ホーム
                </button>
              </>
            )}
            {currentView === 'vendor_list' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">委託先回答状況</span>
              </>
            )}
            {currentView === 'assessment_detail' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setCurrentView('vendor_list')} className="hover:text-blue-600">委託先一覧</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">回答詳細監査</span>
              </>
            )}
            {currentView === 'request_wizard' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-800 font-medium">新規評価依頼の作成</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
            {currentView === 'home' && '委託先セキュリティ審査管理'}
            {currentView === 'vendor_list' && '委託先セキュリティ審査状況'}
            {currentView === 'assessment_detail' && `${selectedVendor?.name} - セキュリティ回答詳細`}
            {currentView === 'request_wizard' && '新規セキュリティ評価依頼の作成'}
          </h1>
        </div>

        {currentView === 'home' && (
          <button
            onClick={() => {
              setWizardStep(1);
              setCurrentView('request_wizard');
            }}
            className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            新規評価依頼を送付
          </button>
        )}
      </div>

      {/* VIEW: HOME */}
      {currentView === 'home' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Dashboard Summary Widget */}
          <div className="md:col-span-3 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
              <ShieldCheck className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10">
              <span className="bg-blue-500/20 text-blue-300 font-semibold text-xs px-3 py-1 rounded-full border border-blue-500/30">
                現在のステータス概要
              </span>
              <h2 className="text-xl md:text-2xl font-bold mt-3 mb-2 font-sans tracking-tight text-white">
                委託先セキュリティ対策のセルフ監査プラットフォーム
              </h2>
              <p className="text-slate-100 text-sm max-w-2xl mb-4 leading-relaxed">
                Excel往復によるセキュリティ管理から、リアルタイムな回答収集とAI支援審査へ。委託先のセキュリティリスクを可視化します。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800">
                <div>
                  <div className="text-slate-400 text-xs">総委託先数</div>
                  <div className="text-2xl font-bold font-mono">{vendors.length}社</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">審査完了</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {assessments.filter(a => a.status === '完了').length}件
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">審査中 / 確認待ち</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {assessments.filter(a => ['確認中', '評価中'].includes(a.status)).length}件
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">回答対応中</div>
                  <div className="text-2xl font-bold font-mono text-sky-400">
                    {assessments.filter(a => a.status === '回答中').length}件
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menus / Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-lg mb-2">① 回答依頼の新規送付</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                委託先に対してセキュリティ審査チェックリストを送付します。新規登録の委託先も追加可能です。
              </p>
            </div>
            <button
              onClick={() => {
                setWizardStep(1);
                setCurrentView('request_wizard');
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg text-sm transition-colors"
            >
              依頼フローを開く
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-lg mb-2">② 回答の確認と評価</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                委託先から受領した回答および証跡（添付ファイル）を審査し、更問（差戻し）や最終承認を行います。
              </p>
            </div>
            <button
              onClick={() => setCurrentView('vendor_list')}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-medium rounded-lg text-sm transition-colors"
            >
              回答ステータス一覧を見る
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-lg mb-2">③ セキュリティ標準・テンプレート</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                標準の評価基準テンプレート「SCS ⭐︎3」（8項目）、「SCS ⭐︎4」（10項目）の内容を参照・確認します。
              </p>
            </div>
            <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <div className="flex justify-between py-1">
                <span>SCS ⭐︎3 基準（中規模委託先推奨）</span>
                <span className="font-bold text-slate-800">8問</span>
              </div>
              <div className="flex justify-between py-1">
                <span>SCS ⭐︎4 基準（重要データ取扱委託先）</span>
                <span className="font-bold text-slate-800">10問</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW: VENDOR LIST (回答参照) */}
      {currentView === 'vendor_list' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-base">委託先セキュリティ審査一覧</h3>
              <p className="text-xs text-slate-500 mt-1">
                各委託先企業のセキュリティ対策チェックシート送信状況、回答状況、および監査結果の一覧です。
              </p>
            </div>
            <div className="mt-2 sm:mt-0 text-xs text-slate-500 font-medium">
              現在：{assessments.length} 件 of 評価タスク
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">委託先企業名</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">使用テンプレート</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">提出期限</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">評価ステータス</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">進捗（回答済 / 総設問）</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">アクション</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {vendors.map(vendor => {
                  const vendorAssessment = assessments.find(a => a.vendorId === vendor.id);
                  const template = vendorAssessment ? templates.find(t => t.id === vendorAssessment.templateId) : null;
                  
                  // Compute answers progress
                  let totalQs = template?.questions.length || 0;
                  let answeredQs = 0;
                  if (vendorAssessment) {
                    answeredQs = Object.values(vendorAssessment.answers).filter(
                      ans => ans.status === '回答済' || ans.status === '確認済'
                    ).length;
                  }

                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mr-3 text-sm">
                            {vendor.name.substring(0, 1)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{vendor.name}</div>
                            <div className="text-xs text-slate-500">{vendor.contactPerson} ({vendor.email})</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {template ? template.name : <span className="text-slate-400">評価未作成</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {vendorAssessment ? (
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{vendorAssessment.deadline}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vendorAssessment ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(vendorAssessment.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                            {vendorAssessment.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-400 border-slate-200">
                            未評価
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {vendorAssessment ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${totalQs > 0 ? (answeredQs / totalQs) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs text-slate-500">{answeredQs}/{totalQs}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {vendorAssessment ? (
                          <button
                            id={`view-detail-btn-${vendor.id}`}
                            onClick={() => {
                              setSelectedAssessmentId(vendorAssessment.id);
                              setCurrentView('assessment_detail');
                            }}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-all inline-flex items-center"
                          >
                            詳細監査へ
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setWizardVendorId(vendor.id);
                              setWizardStep(1);
                              setCurrentView('request_wizard');
                            }}
                            className="text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-all inline-flex items-center"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            依頼作成
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* VIEW: ASSESSMENT DETAIL (回答詳細) */}
      {currentView === 'assessment_detail' && selectedAssessment && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Assessment Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(selectedAssessment.status)}`}>
                    全体ステータス：{selectedAssessment.status}
                  </span>
                  <span className="text-slate-400 text-xs">|</span>
                  <span className="text-slate-500 text-sm">
                    評価項目規格: <strong className="text-slate-700">{selectedTemplate?.name}</strong>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedVendor?.name} セキュリティ対策回答書 監査画面
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  提出された回答テキストおよび証跡資料が適切か監査し、指摘コメント入力や再質問（更問）、または承認の意思決定を行います。
                </p>
              </div>

              {/* Top actions */}
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                <button
                  id="ai-quick-check-btn"
                  onClick={handleAiCheck}
                  disabled={isAiChecking}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  <BrainCircuit className="w-4 h-4 mr-1.5" />
                  {isAiChecking ? 'AI判定を実行中...' : 'AI一次自動チェック'}
                </button>
                <button
                  onClick={() => setCurrentView('vendor_list')}
                  className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  一覧に戻る
                </button>
              </div>
            </div>

            {/* AI Check Progress/Result Panel */}
            <AnimatePresence>
              {(isAiChecking || aiCheckResults) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 border border-blue-200 bg-blue-50/30 rounded-lg p-5 overflow-hidden"
                >
                  <div className="flex items-center space-x-2 text-blue-800 font-bold mb-3">
                    <BrainCircuit className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span>AI セキュリティ Copilot 監査結果</span>
                  </div>

                  {isAiChecking ? (
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">
                        生成AIが提出済みの回答テキストおよびセキュリティガイドライン（SCS/CIS）を照合して一次監査中...
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-blue-500 via-slate-500 to-blue-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        ※このAI判定結果はデモ用の自動抽出アドバイスです。審査官はこれを確認の上、適切な判断・コメントを記入してください。
                      </p>
                      <ul className="space-y-2">
                        {aiCheckResults?.map((result, idx) => (
                          <li key={idx} className="bg-white p-3 rounded-md border border-blue-100 text-sm text-slate-700 shadow-sm flex items-start space-x-2">
                            <span className="text-blue-600 font-bold mt-0.5">•</span>
                            <span>{result}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setAiCheckResults(null)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline mt-2"
                      >
                        AIパネルを閉じる
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Question / Answers Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-sans font-bold text-slate-700 text-sm">審査対象設問リスト（全 {selectedTemplate?.questions.length} 問）</h3>
            </div>
            
            <div className="divide-y divide-slate-200">
              {selectedTemplate?.questions.map((question, index) => {
                const answer = selectedAssessment.answers[question.id] || {
                  questionId: question.id,
                  answerText: '',
                  status: '依頼中',
                  evidence: null,
                  assignee: '',
                  clientComment: '',
                  needsAdditionalConfirm: false
                };

                return (
                  <div key={question.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Q Number & Text */}
                      <div className="lg:col-span-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            設問 {index + 1}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                            {question.guideline}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs border font-medium ${getStatusBadgeClass(answer.status)}`}>
                            {answer.status}
                          </span>
                        </div>
                        <h4 className="font-sans font-semibold text-slate-800 text-sm leading-relaxed">
                          {question.text}
                        </h4>
                      </div>

                      {/* Vendor Answer */}
                      <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                          <div className="text-xs text-slate-400 font-semibold mb-1">委託先（A社）の回答</div>
                          {answer.answerText ? (
                            <p className="text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                              {answer.answerText}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400 italic font-sans">
                              未回答（回答作成を待っています）
                            </p>
                          )}
                        </div>

                        {/* Attachment Link */}
                        {answer.evidence && (
                          <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded text-xs text-slate-700">
                            <span className="flex items-center space-x-1 font-medium">
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-slate-600">証跡ファイル：</span>
                              <span className="text-blue-600 hover:underline cursor-pointer font-mono">{answer.evidence}</span>
                            </span>
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                              添付あり
                            </span>
                          </div>
                        )}

                        {answer.assignee && (
                          <div className="text-xs text-slate-500">
                            回答担当者: <strong className="text-slate-700">{answer.assignee}</strong>
                          </div>
                        )}
                      </div>

                      {/* Client Audit / Comment Box */}
                      <div className="lg:col-span-3 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Z社審査官指摘・コメント
                          </label>
                          <textarea
                            id={`client-comment-input-${question.id}`}
                            value={answer.clientComment}
                            onChange={(e) => onUpdateAssessmentItem(selectedAssessment.id, question.id, { clientComment: e.target.value })}
                            placeholder="更問指摘、または合格判断時の補足事項等"
                            className="w-full h-24 border border-slate-200 rounded-md p-2 text-xs font-sans focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none bg-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                             id={`checkbox-confirm-${question.id}`}
                            checked={answer.needsAdditionalConfirm}
                            onChange={(e) => onUpdateAssessmentItem(selectedAssessment.id, question.id, { needsAdditionalConfirm: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`checkbox-confirm-${question.id}`} className="text-xs font-medium text-slate-600">
                            追加確認フラグを立てる
                          </label>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Assessment Actions Card */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-100">審査アクションゲート</h3>
              <p className="text-xs text-slate-400 mt-1">
                チェックシート審査の結果に応じて、差戻し（更問）、確認合意、または最終完了（承認）フェーズへ進めます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                id="reject-assessment-btn"
                onClick={() => {
                  onReturnToVendor(selectedAssessment.id);
                  alert('コメント入りの設問を「更問」として委託先へ差し戻しました。');
                }}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                更問（差戻し）
              </button>
              
              <button
                id="confirm-assessment-btn"
                onClick={() => {
                  onConfirmAll(selectedAssessment.id);
                  alert('すべての回答項目を「確認済」に設定し、評価中フェーズへ進めました。');
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                確認完了（評価中へ）
              </button>

              <button
                id="approve-assessment-btn"
                onClick={() => {
                  onApproveAssessment(selectedAssessment.id);
                  alert('セキュリティ審査を承認（完了）しました！指摘コメントの一部は、委託先側の「残対応項目（改善フォロー）」として自動起票されました。');
                  setCurrentView('vendor_list');
                }}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                承認完了（完了へ）
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW: REQUEST WIZARD (回答依頼フロー 3ステップ) */}
      {currentView === 'request_wizard' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-3xl mx-auto"
        >
          {/* Steps Indicator */}
          <div className="bg-slate-50 border-b border-slate-200 py-4 px-6 flex justify-between items-center">
            <span className="font-sans font-bold text-sm text-slate-700">新しい評価依頼ウィザード</span>
            <div className="flex space-x-1 text-xs">
              <span className={`px-2 py-1 rounded-md font-semibold ${wizardStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Step 1</span>
              <span className={`px-2 py-1 rounded-md font-semibold ${wizardStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Step 2</span>
              <span className={`px-2 py-1 rounded-md font-semibold ${wizardStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Step 3</span>
            </div>
          </div>

          <div className="p-6">
            
            {/* STEP 1: Select or Create Vendor */}
            {wizardStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-base mb-1">評価対象の委託先企業を選んでください</h3>
                  <p className="text-xs text-slate-500">
                    審査を行う委託先企業を選択します。リストにない場合は、新規登録して指定することも可能です。
                  </p>
                </div>

                {!isAddingNewVendor ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-600">登録済み委託先リスト</label>
                    <div className="grid grid-cols-1 gap-3">
                      {vendors.map(v => (
                        <div 
                          key={v.id}
                          onClick={() => setWizardVendorId(v.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${
                            wizardVendorId === v.id 
                              ? 'border-blue-600 bg-blue-50/20' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{v.name}</div>
                            <div className="text-xs text-slate-500">担当：{v.contactPerson} ({v.email})</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${wizardVendorId === v.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                            {wizardVendorId === v.id && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setIsAddingNewVendor(true)}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        新規に委託先企業を追加登録
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateVendor} className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-sm font-bold text-slate-700 mb-2">新規委託先情報フォーム</div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">企業・委託先名 <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                        placeholder="（例）株式会社セキュリティテック"
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">担当者名</label>
                        <input
                          type="text"
                          value={newVendorContact}
                          onChange={(e) => setNewVendorContact(e.target.value)}
                          placeholder="（例）斉藤 健"
                          className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">担当メールアドレス</label>
                        <input
                          type="email"
                          value={newVendorEmail}
                          onChange={(e) => setNewVendorEmail(e.target.value)}
                          placeholder="saito@securitytech.co.jp"
                          className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewVendor(false)}
                        className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs rounded"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        委託先を登録する
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    id="wizard-step1-next"
                    disabled={!wizardVendorId}
                    onClick={() => setWizardStep(2)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm disabled:opacity-50 transition-colors"
                  >
                    次へ進む
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Select Template */}
            {wizardStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-base mb-1">使用するセキュリティチェックシート（テンプレート）</h3>
                  <p className="text-xs text-slate-500">
                    評価項目を定義したテンプレート、または過去回答履歴を転記・インポートできるセットを指定します。
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-600">セキュリティ基準・テンプレートの選択</label>
                  <div className="grid grid-cols-1 gap-3">
                    {templates.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setWizardTemplateId(t.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${
                          wizardTemplateId === t.id 
                            ? 'border-blue-600 bg-blue-50/20' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{t.name} セキュリティチェックシート</div>
                          <div className="text-xs text-slate-500">総設問数: {t.questions.length}問 / ガイドライン対応：SCS、CIS Controls</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${wizardTemplateId === t.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                          {wizardTemplateId === t.id && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800">
                    <p className="font-bold flex items-center mb-1">
                      <AlertCircle className="w-4 h-4 mr-1 inline" /> 過去回答インポート対応
                    </p>
                    <p className="leading-relaxed">
                      委託先は、回答入力画面にて「SCS ⭐︎3（2025年回答：S社向け）」などの過去の提出済みのデータから回答を一括でコピー・転記することができます。
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-lg text-sm transition-colors"
                  >
                    戻る
                  </button>
                  <button
                    id="wizard-step2-next"
                    disabled={!wizardTemplateId}
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm disabled:opacity-50 transition-colors"
                  >
                    次へ進む
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirm & Send */}
            {wizardStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-base mb-1">作成内容の最終確認</h3>
                  <p className="text-xs text-slate-500">
                    送付先、チェックリスト名、提出期限に問題ないか確認の上、「送付する」を押してください。
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden text-sm bg-white">
                  <div className="grid grid-cols-3 p-4">
                    <div className="font-semibold text-slate-500 text-xs">送付対象委託先</div>
                    <div className="col-span-2 text-slate-800 font-medium">
                      {vendors.find(v => v.id === wizardVendorId)?.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-4">
                    <div className="font-semibold text-slate-500 text-xs">担当宛先情報</div>
                    <div className="col-span-2 text-slate-600 text-xs">
                      {vendors.find(v => v.id === wizardVendorId)?.contactPerson} 様 ({vendors.find(v => v.id === wizardVendorId)?.email})
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-4">
                    <div className="font-semibold text-slate-500 text-xs">審査規格（テンプレート）</div>
                    <div className="col-span-2 text-slate-800 font-medium">
                      {templates.find(t => t.id === wizardTemplateId)?.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-4 items-center">
                    <div className="font-semibold text-slate-500 text-xs">提出回答期限</div>
                    <div className="col-span-2">
                      <input
                        type="date"
                        id="wizard-deadline-input"
                        value={wizardDeadline}
                        onChange={(e) => setWizardDeadline(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-sm font-sans font-medium bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong>送信後のフロー:</strong> 委託先ポータルに自動的に評価依頼が通知されます。委託先企業が回答、添付資料のアップロードを完了して送信すると、Z社側の一覧に「確認中」ステータスとして届きます。
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-lg text-sm transition-colors"
                  >
                    戻る
                  </button>
                  <button
                    id="submit-request-wizard-btn"
                    onClick={handleSendRequest}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    依頼を正式に送付する
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}

    </div>
  );
}
