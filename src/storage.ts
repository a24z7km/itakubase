import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/**
 * localStorage に状態を保存・復元する薄いフック。
 * インメモリ状態のデモだが、リロードしても評価データが失われないようにする。
 *
 * SSR や localStorage 非対応環境でも壊れないよう、読み書きは try/catch で保護する。
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return raw != null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // 保存に失敗しても致命的ではないため握りつぶす（容量超過・プライベートモード等）。
    }
  }, [key, state]);

  return [state, setState];
}

/** localStorage 上の永続化データを一括削除する（リセット用）。 */
export function clearPersistedState(keys: string[]): void {
  try {
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** アプリで使用する localStorage キーの一覧。 */
export const STORAGE_KEYS = {
  vendors: 'itakubase.vendors',
  templates: 'itakubase.templates',
  assessments: 'itakubase.assessments',
  followUps: 'itakubase.followUps',
  evidences: 'itakubase.evidences',
} as const;
