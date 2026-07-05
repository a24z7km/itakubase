import { DerivationResult, EngagementProfile, Question, Rule } from './types';
import { DERIVATION_RULES } from './rules';
import { ALL_QUESTIONS } from './data';

/**
 * 導出エンジン（業務属性 ⊢ 確認項目）。
 *
 * React に依存しない純関数。業務属性プロファイルとルール集合・設問カタログを入力に、
 * 適用された設問集合と、その導出根拠（どのルールがどの設問を選んだか）を返す。
 *
 * 性質（選択単調性）: ルールは「追加のみ」で除外を行わないため、プロファイルの属性を
 * 増やしても導出集合は単調増加する。rules.ts の condition が上方閉であることと合わせて、
 * この性質を満たす。
 *
 * @param profile   業務属性プロファイル
 * @param rules     導出ルール（既定: DERIVATION_RULES）
 * @param questions 設問カタログ（既定: ALL_QUESTIONS）
 */
export function deriveChecklist(
  profile: EngagementProfile,
  rules: Rule[] = DERIVATION_RULES,
  questions: Question[] = ALL_QUESTIONS,
): DerivationResult {
  // controlId -> questionId[] のインデックスと、設問の存在確認・並び順を構築。
  const controlIndex = new Map<string, string[]>();
  const catalogOrder = new Map<string, number>();
  questions.forEach((q, i) => {
    catalogOrder.set(q.id, i);
    if (q.controlId) {
      const arr = controlIndex.get(q.controlId) ?? [];
      arr.push(q.id);
      controlIndex.set(q.controlId, arr);
    }
  });

  const perQuestionRationale: Record<string, string[]> = {};
  const appliedRules: string[] = [];

  const addQuestion = (questionId: string, ruleId: string) => {
    if (!catalogOrder.has(questionId)) return; // カタログに存在しないIDは無視
    const rationale = perQuestionRationale[questionId] ?? [];
    if (!rationale.includes(ruleId)) {
      rationale.push(ruleId);
    }
    perQuestionRationale[questionId] = rationale;
  };

  // depth（適用段階）→ id の順で安定評価する。
  const orderedRules = [...rules].sort(
    (a, b) => a.depth - b.depth || a.id.localeCompare(b.id),
  );

  for (const rule of orderedRules) {
    if (!rule.condition(profile)) continue;
    appliedRules.push(rule.id);
    for (const questionId of rule.addQuestionIds ?? []) {
      addQuestion(questionId, rule.id);
    }
    for (const controlId of rule.addControlIds ?? []) {
      for (const questionId of controlIndex.get(controlId) ?? []) {
        addQuestion(questionId, rule.id);
      }
    }
  }

  // 出力の設問IDはカタログ順に安定ソートする。
  const questionIds = Object.keys(perQuestionRationale).sort(
    (a, b) => (catalogOrder.get(a) ?? 0) - (catalogOrder.get(b) ?? 0),
  );

  return { questionIds, appliedRules, perQuestionRationale };
}
