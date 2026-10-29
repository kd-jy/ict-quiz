/* ============================================================
   app.js — 入口：数据装载、路由、外壳状态
   ============================================================ */

import { el, applyTheme, applyFontScale, toast } from './ui.js';
import * as store from './store.js';
import * as quiz from './quiz.js';
import { renderHome, renderQuiz, renderWrong, renderStats, renderSettings } from './views.js';

const RENDERERS = {
  home: renderHome,
  quiz: renderQuiz,
  wrong: renderWrong,
  stats: renderStats,
  settings: renderSettings
};

const TITLES = {
  home: '练习',
  quiz: '答题',
  wrong: '错题',
  stats: '统计',
  settings: '设置'
};

const app = {
  data: null,
  meta: null,
  topics: [],
  byId: new Map(),
  cleanup: null
};

function startSession({ mode = 'practice', topicIds = [], count = 0, order = 'random', durationSec = 0, ids = null } = {}) {
  if (!app.data) return;
  let list;
  if (Array.isArray(ids)) {
    list = ids.filter((id) => app.byId.has(id));
  } else {
    list = quiz.selectIds(app.data.questions, { topicIds, count, order });
  }
  if (!list.length) {
    toast('这个范围里还没有题目');
    return;
  }
  const session = quiz.createSession({ mode, ids: list, durationSec });
  store.saveSession(session);
  if (location.hash === '#/quiz') route();
  else location.hash = '#/quiz';
}

function makeCtx(name) {
  return {
    name,
    data: app.data,
    meta: app.meta,
    topics: app.topics,
    byId: app.byId,
    get state() {
      return store.getState();
    },
    get session() {
      return store.getSession();
    },
    startSession,
    refreshChrome() {
      updateChrome(name);
    },
    refresh() {
      route();
    },
    onCleanup(fn) {
      app.cleanup = typeof fn === 'function' ? fn : null;
    }
  };
}

function updateChrome(name) {
  document.body.dataset.view = name;
  document.title = (TITLES[name] || '练习') + ' · 网络赛道刷题';

  let done = 0;
  let wrong = 0;
  let total = 0;
  if (app.data) {
    const state = store.getState();
    total = app.data.questions.length;
    for (const q of app.data.questions) {
      const p = state.progress[q.id];
      if (!p) continue;
      if ((Number(p.a) || 0) > 0) done += 1;
      if (p.wrong === 1) wrong += 1;
    }
  }

  const progress = document.getElementById('top-progress');
  if (progress) progress.textContent = '已做 ' + done + ' / ' + total;

  document.querySelectorAll('[data-nav]').forEach((link) => {
    const nav = link.dataset.nav;
    const active = nav === name || (name === 'quiz' && nav === 'home');
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  document.querySelectorAll('[data-count="wrong"]').forEach((badge) => {
    badge.textContent = String(wrong);
    badge.hidden = wrong === 0;
  });
}

function fatalView(error) {
  const message = error && error.message ? error.message : String(error || '未知错误');
  return el(
    'section',
    { class: 'view' },
    el(
      'header',
      { class: 'page-head' },
      el(
        'div',
        { class: 'page-head-main' },
        el('p', { class: 'eyebrow', text: '加载失败' }),
        el('h1', { class: 'page-title', text: '题库没有装载成功' }),
        el('p', { class: 'page-desc', text: message })
      )
    ),
    el(
      'div',
      { class: 'empty' },
      el('h2', { class: 'empty-title', text: '检查一下运行方式' }),
      el('p', {
        class: 'empty-desc',
        text: '这个站点通过 fetch 读取 data/questions.json，需要用本地静态服务器打开（例如 python -m http.server），不能直接双击 index.html。'
      }),
      el(
        'div',
        { class: 'empty-actions' },
        el('button', { class: 'btn btn-primary', type: 'button', onClick: () => location.reload() }, '重新加载')
      )
    )
  );
}

function route() {
  const match = String(location.hash || '').match(/^#\/([a-z]+)/);
  let name = match ? match[1] : 'home';
  if (!RENDERERS[name]) {
    name = 'home';
    if (location.hash !== '#/home') {
      location.replace('#/home');
      return;
    }
  }

  // 题库还在路上（首屏 fetch 未完成）时，hash 变化也会触发这里；
  // 此时各页面拿不到 ctx.data，先跳过，boot() 拿到数据后会再路由一次。
  if (!app.data) return;

  if (app.cleanup) {
    try {
      app.cleanup();
    } catch (err) {
      console.error('清理上一个页面失败：', err);
    }
    app.cleanup = null;
  }

  const main = document.getElementById('main');
  if (!main) return;
  const ctx = makeCtx(name);
  let node;
  try {
    node = RENDERERS[name](ctx);
  } catch (err) {
    console.error('页面渲染失败：', err);
    node = fatalView(err);
  }
  main.replaceChildren(node);
  updateChrome(name);
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function bindChrome() {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = store.getState().settings.theme === 'dark' ? 'light' : 'dark';
      store.setSettings({ theme: next });
      applyTheme(next);
    });
  }
  applyTheme(store.getState().settings.theme);
  applyFontScale(store.getState().settings.fontScale);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  // 题库是 await 完之后才走到这里的，那时 load 可能已经触发过了；
  // 只挂监听会让 PWA 在快网速/二访时永远注册不上，所以补一次「已经 complete 就立刻注册」。
  const start = () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.error('Service Worker 注册失败：', err);
    });
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

async function boot() {
  bindChrome();
  window.addEventListener('hashchange', route);

  const main = document.getElementById('main');
  if (main) main.append(el('p', { class: 'muted', text: '正在装载题库…' }));

  try {
    const res = await fetch('data/questions.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('请求 data/questions.json 返回 HTTP ' + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('题库为空或结构不正确');
    }
    app.data = data;
    app.meta = data.meta || {};
    app.topics = Array.isArray(data.topics) ? data.topics : [];
    app.byId = new Map(data.questions.map((q) => [q.id, q]));
  } catch (err) {
    console.error('题库加载失败：', err);
    if (main) main.replaceChildren(fatalView(err));
    return;
  }

  if (!location.hash) {
    location.replace('#/home');
    return;
  }
  route();
  registerServiceWorker();

  // 进度为空但存在自动备份：提示可恢复（换域名/误清数据后的兜底）
  try {
    const st = store.getState();
    const backup = store.getBackupInfo();
    const empty = !Object.keys(st.progress || {}).length;
    if (empty && backup && backup.questions > 0 && !sessionStorage.getItem('ictquiz.restoreHint')) {
      sessionStorage.setItem('ictquiz.restoreHint', '1');
      setTimeout(() => {
        toast('检测到本地备份（' + backup.questions + ' 题记录），可在「设置 → 从自动备份恢复」找回', 'info', 6000);
      }, 1200);
    }
  } catch (err) {
    console.error('检查自动备份失败：', err);
  }
}

boot();