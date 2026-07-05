import React, { useState } from 'react';
import Header from './components/Header';
import ClientPortal from './components/ClientPortal';
import VendorPortal from './components/VendorPortal';
import { 
  Role, Vendor, Assessment, AnswerItem, AssessmentStatus, 
  FollowUpItem, Template, PastAnswerSet, FinalDecision 
} from './types';
import { 
  INITIAL_VENDORS, INITIAL_TEMPLATES, INITIAL_PAST_ANSWERS, INITIAL_FOLLOWUPS 
} from './data';

export default function App() {
  const [activeRole, setActiveRole] = useState<Role>('client');
  const [homeResetKey, setHomeResetKey] = useState(0);

  // Shared in-memory DB states
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [templates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [pastAnswers] = useState<PastAnswerSet[]>(INITIAL_PAST_ANSWERS);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(INITIAL_FOLLOWUPS);

  // 1. Add a new vendor to the database
  const handleAddVendor = (name: string, contact: string, email: string) => {
    const newVendor: Vendor = {
      id: `v_${Date.now()}`,
      name,
      contactPerson: contact || '未登録',
      email: email || '未登録',
    };
    setVendors(prev => [...prev, newVendor]);
    alert(`新規委託先「${name}」を登録しました！`);
  };

  // 2. Create and dispatch a new assessment checklist request
  const handleCreateAssessment = (vendorId: string, templateId: string, deadline: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Initialize answer items for all template questions
    const initialAnswers: Record<string, AnswerItem> = {};
    template.questions.forEach(q => {
      initialAnswers[q.id] = {
        questionId: q.id,
        answerText: '',
        status: '依頼中',
        evidence: null,
        assignee: '',
        clientComment: '',
        needsAdditionalConfirm: false,
        evaluationComment: '',
      };
    });

    const newAssessment: Assessment = {
      id: `a_${Date.now()}`,
      vendorId,
      templateId,
      deadline,
      status: '依頼中',
      answers: initialAnswers,
    };

    setAssessments(prev => [newAssessment, ...prev]);
    alert(`${vendors.find(v => v.id === vendorId)?.name}宛に「${template.name}」チェックリスト回答依頼を送付しました。`);
  };

  // 3. Update answers or audit comments on a single question item
  const handleUpdateAssessmentItem = (
    assessmentId: string,
    questionId: string,
    updates: Partial<AnswerItem>
  ) => {
    setAssessments(prev => prev.map(ass => {
      if (ass.id === assessmentId) {
        const currentAnswer = ass.answers[questionId] || {
          questionId,
          answerText: '',
          status: '依頼中',
          evidence: null,
          assignee: '',
          clientComment: '',
          needsAdditionalConfirm: false,
          evaluationComment: '',
        };
        return {
          ...ass,
          answers: {
            ...ass.answers,
            [questionId]: {
              ...currentAnswer,
              ...updates,
            }
          }
        };
      }
      return ass;
    }));
  };

  // 4. Update the overall state of an assessment task
  const handleUpdateAssessmentStatus = (assessmentId: string, status: AssessmentStatus) => {
    setAssessments(prev => prev.map(ass => {
      if (ass.id === assessmentId) {
        return { ...ass, status };
      }
      return ass;
    }));
  };

  // 5. Client returns the checklist to the vendor for corrections (更問・差戻し)
  const handleReturnToVendor = (assessmentId: string): number => {
    const targetAssessment = assessments.find(ass => ass.id === assessmentId);
    if (!targetAssessment) return 0;

    const returnableQuestionIds = new Set(
      Object.keys(targetAssessment.answers).filter(qId => {
        const item = targetAssessment.answers[qId];
        return item.needsAdditionalConfirm && item.clientComment.trim().length > 0;
      })
    );
    if (returnableQuestionIds.size === 0) return 0;

    setAssessments(prev => prev.map(ass => {
      if (ass.id === assessmentId) {
        const nextAnswers = { ...ass.answers };
        Object.keys(nextAnswers).forEach(qId => {
          const item = nextAnswers[qId];
          if (returnableQuestionIds.has(qId)) {
            nextAnswers[qId] = {
              ...item,
              status: '更問',
            };
          }
        });
        return {
          ...ass,
          status: '回答中' as AssessmentStatus, // Send overall back to A社
          answers: nextAnswers,
        };
      }
      return ass;
    }));
    return returnableQuestionIds.size;
  };

  // 6. Client marks all checklist answers as checked and ready for evaluation (確認完了)
  const handleConfirmAll = (assessmentId: string) => {
    setAssessments(prev => prev.map(ass => {
      if (ass.id === assessmentId) {
        const nextAnswers = { ...ass.answers };
        Object.keys(nextAnswers).forEach(qId => {
          const item = nextAnswers[qId];
          nextAnswers[qId] = {
            ...item,
            status: '確認済',
          };
        });
        return {
          ...ass,
          status: '評価中' as AssessmentStatus,
          answers: nextAnswers,
        };
      }
      return ass;
    }));
  };

  // 7. Client finalizes the checklist evaluation and promotes NG items into follow-up records
  const handleFinalizeAssessment = (assessmentId: string, decision: FinalDecision, finalComment: string): boolean => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) return false;
    if (assessment.status !== '評価中') {
      alert('最終判断は評価中フェーズで実行してください。');
      return false;
    }

    const assessmentTemplate = templates.find(t => t.id === assessment.templateId);
    const missingEvaluationCount = assessmentTemplate?.questions.filter(q => {
      const answer = assessment.answers[q.id];
      return !answer?.evaluationResult || !answer.evaluationComment?.trim();
    }).length || 0;
    if (missingEvaluationCount > 0) {
      alert(`最終判断には全設問のOK/NG選択と評価コメント入力が必要です。未入力: ${missingEvaluationCount}件`);
      return false;
    }
    if (!finalComment.trim()) {
      alert('最終判断コメントを入力してください。');
      return false;
    }

    const ngAnswers = assessmentTemplate?.questions
      .map(question => ({
        question,
        answer: assessment.answers[question.id],
      }))
      .filter(item => item.answer?.evaluationResult === 'NG') || [];

    if (decision === '承認' && ngAnswers.length > 0) {
      alert('NG項目がある場合は「承認（残対応項目あり）」または「却下」を選択してください。');
      return false;
    }
    if (decision === '承認（残対応項目あり）' && ngAnswers.length === 0) {
      alert('残対応項目ありの承認には、少なくとも1件のNG評価が必要です。');
      return false;
    }

    if (decision === '却下') {
      setAssessments(prev => prev.map(ass => {
        if (ass.id === assessmentId) {
          return {
            ...ass,
            status: '却下' as AssessmentStatus,
          };
        }
        return ass;
      }));
      alert('最終判断を「却下」として保存しました。');
      return true;
    }

    const newFollowUps: FollowUpItem[] = [];
    if (decision === '承認（残対応項目あり）') {
      ngAnswers.forEach(({ question, answer }) => {
        newFollowUps.push({
          id: `f_auto_${Date.now()}_${question.id}`,
          title: question ? `【要是正】${question.text.substring(0, 18)}...` : '要改善セキュリティ事項',
          agreement: `${answer.evaluationComment}\n\n最終判断コメント: ${finalComment}`,
          deadline: assessment.deadline,
          status: '検討中',
          assignee: answer.assignee || 'システム・セキュリティ担当',
        });
      });
    }

    if (newFollowUps.length > 0) {
      setFollowUps(prev => [...prev, ...newFollowUps]);
    }
    
    // Set overall status to Completed
    setAssessments(prev => prev.map(ass => {
      if (ass.id === assessmentId) {
        const nextAnswers = { ...ass.answers };
        Object.keys(nextAnswers).forEach(qId => {
          const item = nextAnswers[qId];
          nextAnswers[qId] = { ...item, status: '確認済' };
        });
        return {
          ...ass,
          status: '完了' as AssessmentStatus,
          answers: nextAnswers,
        };
      }
      return ass;
    }));
    return true;
  };

  // 8. Add a new manual follow-up task
  const handleAddFollowUp = (newItem: Omit<FollowUpItem, 'id'>) => {
    const followItem: FollowUpItem = {
      ...newItem,
      id: `f_${Date.now()}`,
    };
    setFollowUps(prev => [...prev, followItem]);
    alert('改善事項フォローアップ項目を新しく登録しました！');
  };

  // 9. Update existing follow-up tasks
  const handleUpdateFollowUp = (id: string, updates: Partial<FollowUpItem>) => {
    setFollowUps(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, ...updates };
      }
      return f;
    }));
    alert('改善指摘フォローアップ情報を更新しました。');
  };

  // Reset to original demo values
  const handleResetDemoData = () => {
    if (confirm('デモデータを初期状態にリセットしますか？')) {
      setVendors(INITIAL_VENDORS);
      setAssessments([]);
      setFollowUps(INITIAL_FOLLOWUPS);
      setActiveRole('client');
      setHomeResetKey(prev => prev + 1);
      alert('デモデータを初期化しました！');
    }
  };

  const handleGoHome = () => {
    setHomeResetKey(prev => prev + 1);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-indigo-100 font-sans">
      {/* Top persistent header and role switcher */}
      <Header 
        activeRole={activeRole} 
        onChangeRole={setActiveRole} 
        onGoHome={handleGoHome}
        resetDemoData={handleResetDemoData}
      />

      <main className="transition-all duration-300">
        {activeRole === 'client' ? (
          <ClientPortal
            vendors={vendors}
            assessments={assessments}
            templates={templates}
            homeResetKey={homeResetKey}
            onAddVendor={handleAddVendor}
            onCreateAssessment={handleCreateAssessment}
            onUpdateAssessmentItem={handleUpdateAssessmentItem}
            onUpdateAssessmentStatus={handleUpdateAssessmentStatus}
            onReturnToVendor={handleReturnToVendor}
            onConfirmAll={handleConfirmAll}
            onFinalizeAssessment={handleFinalizeAssessment}
          />
        ) : (
          <VendorPortal
            vendor={vendors[0]} // Always act as 'A社' (the first vendor) for the demo
            assessments={assessments}
            templates={templates}
            pastAnswers={pastAnswers}
            followUps={followUps}
            homeResetKey={homeResetKey}
            onUpdateAssessmentItem={handleUpdateAssessmentItem}
            onUpdateAssessmentStatus={handleUpdateAssessmentStatus}
            onAddFollowUp={handleAddFollowUp}
            onUpdateFollowUp={handleUpdateFollowUp}
          />
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 ITAKU BASE - 委託先セキュリティ管理チェックシートシステム（デモプロトタイプ）</p>
          <p className="mt-1 text-slate-400">
            本製品はインメモリ状態で稼働する単一ページ検証環境です。
          </p>
        </div>
      </footer>
    </div>
  );
}
