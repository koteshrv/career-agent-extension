import type { SavedAnswer } from '../types';

export function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

/** Exact match on the normalized question, else the saved question that shares the most words (≥ 70%). */
export function findSavedAnswer(answers: Record<string, SavedAnswer>, question: string): SavedAnswer | null {
  const key = normalizeQuestion(question);
  if (!key) return null;
  if (answers[key]) return answers[key];
  const words = new Set(key.split(' ').filter((w) => w.length > 2));
  if (words.size < 3) return null;
  let best: { score: number; a: SavedAnswer } | null = null;
  for (const [k, a] of Object.entries(answers)) {
    const kw = k.split(' ').filter((w) => w.length > 2);
    if (!kw.length) continue;
    const overlap = kw.filter((w) => words.has(w)).length / Math.max(kw.length, words.size);
    if (overlap >= 0.7 && (!best || overlap > best.score)) best = { score: overlap, a };
  }
  return best?.a ?? null;
}
