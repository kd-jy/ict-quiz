/* ============================================================
   quiz.js — 答题会话与统计（纯函数优先）
   ============================================================ */

import { shuffle, todayStr, fmtMD } from './ui.js';

export function uniqueSorted(list) {
  return Array.from(new Set((list || []).map(Number).filter((n) => Number.isFinite(n) && n >= 0))).sort((a, b) => a - b);
}

export function isCorrect(question, picks) {
  if (!question || !Array.isArray(question.answer)) return false;
  const a = uniqueSorted(question.answer);
  const p = uniqueSorted(picks);
  if (a.length !== p.length) return false;
  return a.every((value, i) => value === p[i]);
}

export function createSession({ mode = 'practice', ids = [], durationSec = 0 } = {}) {
  const now = Date.now();
  return {
    v: 1,
    mode,
    ids: ids.slice(),
    index: 0,
    picks: {},
    verdict: {},
    seed: (Math.random() * 1e9) | 0 || 1,
    startedAt: now,
    deadline: durationSec > 0 ? now + durationSec * 1000 : 0,
    finished: false,
    endedAt: 0
  };
}

function seededRandom(seed, key) {
  let s = (seed >>> 0) || 1;
  const text = String(key || '');
  for (let i = 0; i < text.length; i += 1) s = (Math.imul(s, 31) + text.charCodeAt(i)) >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 选项展示顺序（原始下标数组）。同一会话内稳定可复现；
 * 判断题不洗牌，选项少于 3 个也不洗牌。
 */
export function displayOrder(question, seed = 1, shuffled = true) {
  if (!question || !Array.isArray(question.options)) return [];
  const order = question.options.map((_, i) => i);
  if (!shuffled || question.type === 'judge' || order.length < 3) return order;
  const next = seededRandom(seed, question.id);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

export function summarize(session) {
  const ids = session && Array.isArray(session.ids) ? session.ids : [];
  let answered = 0;
  let correct = 0;
  const wrongIds = [];
  const unanswered = [];
  for (const id of ids) {
    const v = session.verdict ? session.verdict[id] : null;
    if (!v) {
      unanswered.push(id);
      continue;
    }
    answered += 1;
    if (v.correct) correct += 1;
    else wrongIds.push(id);
  }
  const total = ids.length;
  return {
    total,
    answered,
    correct,
    wrongIds,
    unanswered,
    score: total ? Math.round((correct / total) * 100) : 0,
    durationSec: Math.max(0, Math.round(((session.endedAt || Date.now()) - (session.startedAt || Date.now())) / 1000))
  };
}

/* ---------- 选题 ---------- */

export function selectIds(questions, { topicIds = [], count = 0, order = 'random' } = {}) {
  const chosen = Array.isArray(topicIds) ? topicIds : [];
  let list = (questions || []).filter((q) => chosen.length === 0 || chosen.includes(q.topic));
  if (order === 'random') list = shuffle(list);
  if (count > 0) list = list.slice(0, count);
  return list.map((q) => q.id);
}

/* ---------- 统计 ---------- */

export function overview(questions, state) {
  const list = questions || [];
  const progress = state && state.progress ? state.progress : {};
  let done = 0;
  let attempts = 0;
  let correct = 0;
  let wrong = 0;
  for (const q of list) {
    const p = progress[q.id];
    if (!p) continue;
    attempts += Number(p.a) || 0;
    correct += Number(p.c) || 0;
    if ((Number(p.a) || 0) > 0) done += 1;
    if (p.wrong === 1) wrong += 1;
  }
  return {
    total: list.length,
    done,
    attempts,
    correct,
    wrong,
    accuracy: attempts ? Math.min(100, Math.round((correct / attempts) * 100)) : 0,
    fav: Object.keys((state && state.fav) || {}).length
  };
}

export function topicMastery(questions, topics, state) {
  const progress = state && state.progress ? state.progress : {};
  return (topics || [])
    .map((t) => {
      const list = (questions || []).filter((q) => q.topic === t.id);
      let attempts = 0;
      let correct = 0;
      let seen = 0;
      for (const q of list) {
        const p = progress[q.id];
        if (!p) continue;
        attempts += Number(p.a) || 0;
        correct += Number(p.c) || 0;
        if ((Number(p.a) || 0) > 0) seen += 1;
      }
      return {
        id: t.id,
        name: t.name,
        count: list.length,
        seen,
        attempts,
        correct,
        rate: attempts ? Math.min(100, Math.round((correct / attempts) * 100)) : 0
      };
    })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function recentDays(state, days = 7, now = new Date()) {
  const store = (state && state.days) || {};
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = todayStr(d);
    const rec = store[key] && typeof store[key] === 'object' ? store[key] : { a: 0, c: 0 };
    out.push({
      key,
      md: fmtMD(key),
      weekday: '日一二三四五六'[d.getDay()],
      a: Number(rec.a) || 0,
      c: Number(rec.c) || 0
    });
  }
  return out;
}

export function wrongQuestions(questions, state) {
  const progress = state && state.progress ? state.progress : {};
  return (questions || [])
    .filter((q) => progress[q.id] && progress[q.id].wrong === 1)
    .sort((a, b) => {
      const la = progress[a.id].last || '';
      const lb = progress[b.id].last || '';
      if (la === lb) return a.id < b.id ? -1 : 1;
      return la < lb ? 1 : -1;
    });
}