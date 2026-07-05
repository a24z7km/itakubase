import React, { useState } from 'react';
import Header from './components/Header';
import ClientPortal from './components/ClientPortal';
import VendorPortal from './components/VendorPortal';
import { 
  Role, Vendor, Assessment, AnswerItem, AssessmentStatus, 
  FollowUpItem, Template, PastAnswerSet 
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
  const handleReturnToVendor = (assessmentId: string) => {
    setAssessments(prev => prev.map(ass => {
      if (ass.id === assessmentId) {
        const nextAnswers = { ...ass.answers };
        Object.keys(nextAnswers).forEach(qId => {
          const item = nextAnswers[qId];
          // If the auditor left a feedback comment, send this question back into '更問' status
          if (item.clientComment && item.clientComment.trim().length > 0) {
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

  // 7. Client approves the checklist as completed, promoting audit comments into actionable follow-up records
  const handleApproveAssessment = (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) return;

    // Auto promote comments into follow-up items
    const newFollowUps: FollowUpItem[] = [];
    Object.keys(assessment.answers).forEach(qId => {
      const item = assessment.answers[qId];
      if (item.clientComment && item.clientComment.trim().length > 0) {
        const template = templates.find(t => t.id === assessment.templateId);
        const question = template?.questions.find(q => q.id === qId);
        
        newFollowUps.push({
          id: `f_auto_${Date.now()}_${qId}`,
          title: question ? `【要是正】${question.text.substring(0, 18)}...` : '要改善セキュリティ事項',
          agreement: item.clientComment,
          deadline: assessment.deadline,
          status: '検討中',
          assignee: item.assignee || 'システム・セキュリティ担当',
        });
      }
    });

    // If no comments but completed, we can also add a general confirmation follow-up
    if (newFollowUps.length === 0) {
      newFollowUps.push({
        id: `f_auto_${Date.now()}_general`,
        title: `【定期確認】${vendors.find(v => v.id === assessment.vendorId)?.name} 承認後フォロー`,
        agreement: '今回のセキュリティ対策回答は全項目承認されました。次年度のチェックシート更新に向け、現在のセキュリティポリシー体制を維持してください。',
        deadline: assessment.deadline,
        status: '完了',
        assignee: 'セキュリティ事務局',
      });
    }

    setFollowUps(prev => [...prev, ...newFollowUps]);
    
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
            onApproveAssessment={handleApproveAssessment}
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
