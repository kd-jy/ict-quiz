/* ============================================================
   store.js — localStorage 读写、进度记录、导入导出
   单键：ictquiz.v1
   ============================================================ */

export const KEY = 'ictquiz.v1';
export const BACKUP_KEY = 'ictquiz.backup.v1';
const BACKUP_INTERVAL = 5 * 60 * 1000;

const THEMES = ['light', 'dark'];
const SCALES = [0.95, 1, 1.12];

let state = null;
let lastBackupAt = 0;

function defaults() {
  return {
    v: 2,
    settings: {
      theme: 'light',
      fontScale: 1,
      shuffle: true,
      instantFeedback: false,
      autoRemoveWrong: true
    },
    progress: {},
    fav: {},
    notes: {},
    days: {},
    lastSession: null
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeObject(value) {
  return isPlainObject(value) ? value : {};
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function todayStr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function pruneDays(target) {
  const keys = Object.keys(target.days);
  if (keys.length <= 45) return;
  keys.sort();
  for (const key of keys.slice(0, keys.length - 45)) delete target.days[key];
}

function normalizeProgress(progress) {
  const out = {};
  for (const [id, raw] of Object.entries(safeObject(progress))) {
    if (!isPlainObject(raw)) continue;
    out[id] = {
      a: num(raw.a),
      c: num(raw.c),
      last: typeof raw.last === 'string' ? raw.last : '',
      wrong: raw.wrong === 1 || raw.wrong === true ? 1 : 0,
      streak: num(raw.streak)
    };
  }
  return out;
}

function normalizeSession(raw) {
  if (!isPlainObject(raw)) return null;
  const ids = Array.isArray(raw.ids) ? raw.ids.filter((id) => typeof id === 'string') : [];
  if (ids.length === 0) return null;
  const index = Math.min(Math.max(0, Math.trunc(num(raw.index))), ids.length - 1);
  const mode = ['practice', 'exam', 'review'].includes(raw.mode) ? raw.mode : 'practice';
  const picks = {};
  for (const [id, list] of Object.entries(safeObject(raw.picks))) {
    if (Array.isArray(list)) picks[id] = list.map((v) => Math.trunc(num(v))).filter((v) => v >= 0);
  }
  const verdict = {};
  for (const [id, v] of Object.entries(safeObject(raw.verdict))) {
    if (isPlainObject(v)) verdict[id] = { correct: v.correct === true, at: num(v.at) };
  }
  return {
    v: 1,
    mode,
    ids,
    index,
    picks,
    verdict,
    seed: num(raw.seed) || 1,
    startedAt: num(raw.startedAt) || Date.now(),
    deadline: num(raw.deadline),
    finished: raw.finished === true,
    endedAt: num(raw.endedAt)
  };
}

function normalize(raw) {
  const base = defaults();
  if (!isPlainObject(raw)) return base;
  const settings = { ...base.settings, ...safeObject(raw.settings) };
  // v1 -> v2：答题判定改为「先选答案、再点提交」，老用户一次性切换到新默认值
  const isV2 = raw.v === 2;
  return {
    v: 2,
    settings: {
      theme: THEMES.includes(settings.theme) ? settings.theme : 'light',
      fontScale: SCALES.includes(Number(settings.fontScale)) ? Number(settings.fontScale) : 1,
      shuffle: settings.shuffle !== false,
      instantFeedback: isV2 ? settings.instantFeedback === true : false,
      autoRemoveWrong: settings.autoRemoveWrong !== false
    },
    progress: normalizeProgress(raw.progress),
    fav: safeObject(raw.fav),
    notes: safeObject(raw.notes),
    days: safeObject(raw.days),
    lastSession: normalizeSession(raw.lastSession)
  };
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('保存到 localStorage 失败：', err);
    return false;
  }
}

/* ---------- 自动备份（防止误清数据/换域名丢进度）---------- */

function maybeBackup() {
  if (Date.now() - lastBackupAt < BACKUP_INTERVAL) return;
  try {
    const s = getState();
    if (!Object.keys(s.progress || {}).length) return;
    const payload = {
      at: Date.now(),
      v: 2,
      progress: s.progress,
      fav: s.fav,
      notes: s.notes,
      days: s.days
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
    lastBackupAt = Date.now();
  } catch (err) {
    console.error('写自动备份失败：', err);
  }
}

export function getBackupInfo() {
  try {
    const raw = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
    if (!raw || !raw.progress) return null;
    return {
      at: Number(raw.at) || 0,
      questions: Object.keys(raw.progress).length,
      fav: Object.keys(raw.fav || {}).length,
      notes: Object.keys(raw.notes || {}).length
    };
  } catch (err) {
    return null;
  }
}

export function restoreFromBackup() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
  } catch (err) {
    return { ok: false, error: '自动备份已损坏' };
  }
  if (!raw || !raw.progress || !Object.keys(raw.progress).length) {
    return { ok: false, error: '现在没有可恢复的自动备份' };
  }
  const s = getState();
  s.progress = normalizeProgress(raw.progress);
  s.fav = safeObject(raw.fav);
  s.notes = safeObject(raw.notes);
  s.days = safeObject(raw.days);
  save();
  return { ok: true, questions: Object.keys(s.progress).length };
}

export function getState() {
  if (!state) {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (err) {
      console.error('本地数据损坏，已使用默认状态：', err);
    }
    state = normalize(raw);
  }
  return state;
}

export function save() {
  persist();
  maybeBackup();
}

/* ---------- 设置 ---------- */

export function setSettings(patch) {
  const s = getState();
  s.settings = { ...s.settings, ...safeObject(patch) };
  save();
  return s.settings;
}

export function setTheme(theme) {
  return setSettings({ theme: theme === 'dark' ? 'dark' : 'light' }).theme;
}

export function cycleTheme() {
  const s = getState();
  return setTheme(s.settings.theme === 'dark' ? 'light' : 'dark');
}

/* ---------- 答题记录 ---------- */

export function recordAnswer(id, correct) {
  const s = getState();
  if (typeof id !== 'string' || !id) return { wrong: false, autoRemoved: false };
  const date = todayStr();
  const prev = s.progress[id];
  const wasWrong = Boolean(prev && prev.wrong === 1);
  const p = prev || { a: 0, c: 0, last: '', wrong: 0, streak: 0 };

  p.a += 1;
  if (correct) {
    p.c += 1;
    p.streak = num(p.streak) + 1;
  } else {
    p.streak = 0;
    p.wrong = 1;
  }
  p.last = date;
  if (correct && p.wrong === 1 && s.settings.autoRemoveWrong && p.streak >= 2) p.wrong = 0;
  s.progress[id] = p;

  const day = isPlainObject(s.days[date]) ? s.days[date] : { a: 0, c: 0 };
  day.a = num(day.a) + 1;
  if (correct) day.c = num(day.c) + 1;
  s.days[date] = day;
  pruneDays(s);

  save();
  return { wrong: p.wrong === 1, autoRemoved: wasWrong && p.wrong === 0 };
}

export function removeWrong(id) {
  const s = getState();
  const p = s.progress[id];
  if (p) {
    p.wrong = 0;
    p.streak = 0;
    save();
  }
}

/* ---------- 收藏与笔记 ---------- */

export function isFav(id) {
  return Boolean(getState().fav[id]);
}

export function toggleFav(id) {
  const s = getState();
  if (s.fav[id]) delete s.fav[id];
  else s.fav[id] = 1;
  save();
  return Boolean(s.fav[id]);
}

export function getNote(id) {
  return typeof getState().notes[id] === 'string' ? getState().notes[id] : '';
}

export function setNote(id, text) {
  const s = getState();
  const value = String(text || '').slice(0, 4000);
  if (value.trim()) s.notes[id] = value;
  else delete s.notes[id];
  save();
}

/* ---------- 会话 ---------- */

export function getSession() {
  return getState().lastSession;
}

export function saveSession(session) {
  getState().lastSession = session;
  save();
}

export function clearSession() {
  getState().lastSession = null;
  save();
}

/* ---------- 导入 / 导出 / 清空 ---------- */

export function snapshot() {
  const s = getState();
  return {
    v: 2,
    exportedAt: new Date().toISOString(),
    settings: { ...s.settings },
    progress: { ...s.progress },
    fav: { ...s.fav },
    notes: { ...s.notes },
    days: { ...s.days }
  };
}

export function downloadBackup() {
  const data = JSON.stringify(snapshot(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const name = 'ictquiz-backup-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return name;
}

export function importBackup(text) {
  let parsed = null;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch (err) {
    return { ok: false, error: '不是合法的 JSON 文件' };
  }
  if (!isPlainObject(parsed)) return { ok: false, error: '备份内容为空或格式不正确' };
  if (parsed.v !== 1 && parsed.v !== 2) return { ok: false, error: '备份版本不匹配（需要 v:1 或 v:2）' };
  const hasContent = isPlainObject(parsed.progress) || isPlainObject(parsed.days) || isPlainObject(parsed.fav);
  if (!hasContent) return { ok: false, error: '备份里没有可导入的练习记录' };

  const next = normalize(parsed);
  const s = getState();
  const keepSession = s.lastSession;
  Object.assign(s, next);
  s.lastSession = keepSession;
  save();
  return { ok: true, progressCount: Object.keys(s.progress).length, favCount: Object.keys(s.fav).length };
}

export function clearPractice() {
  const s = getState();
  s.progress = {};
  s.fav = {};
  s.notes = {};
  s.days = {};
  s.lastSession = null;
  save();
}
