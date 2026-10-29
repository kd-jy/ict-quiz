/* ============================================================
   ui.js — 通用组件与工具
   图标为常量 SVG 字符串；所有文本节点通过 textContent 写入。
   ============================================================ */

const ICONS = {
  practice:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.2h6.2A1.8 1.8 0 0 1 12 7v13a1.8 1.8 0 0 0-1.8-1.8H4z"></path><path d="M20 5.2h-6.2A1.8 1.8 0 0 0 12 7v13a1.8 1.8 0 0 1 1.8-1.8H20z"></path></svg>',
  wrong:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.2L6 21V4.5a1 1 0 0 1 1-1z"></path></svg>',
  stats:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20.5h18"></path><path d="M6.5 20.5v-6"></path><path d="M12 20.5V5"></path><path d="M17.5 20.5v-9"></path></svg>',
  settings:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2L5.4 5.4"></path></svg>',
  grid:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect></svg>',
  chevronDown:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5L20 6.5"></path></svg>',
  x:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  star:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.6l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8z"></path></svg>',
  download:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v11.5"></path><path d="M7 10.5l5 5 5-5"></path><path d="M4 20.5h16"></path></svg>',
  upload:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16.5V4.5"></path><path d="M7 9l5-5 5 5"></path><path d="M4 20.5h16"></path></svg>',
  trash:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"></path><path d="M9.5 7V4h5v3"></path><path d="M6.5 7l1 13h9l1-13"></path><path d="M10 11v5.5M14 11v5.5"></path></svg>',
  refresh:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7"></path><path d="M20 4.5v5h-5"></path></svg>',
  play:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 4.5l12 7.5-12 7.5z"></path></svg>',
  clock:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3.5 2"></path></svg>',
  arrowRight:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"></path><path d="M13 5.5l6.5 6.5L13 18.5"></path></svg>',
  arrowLeft:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5"></path><path d="M11 5.5L4.5 12 11 18.5"></path></svg>',
  image:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><circle cx="9" cy="10" r="1.6"></circle><path d="M4.5 17l5-5 4 4 2.5-2.5 3.5 3.5"></path></svg>',
  zoomIn:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5L21 21"></path><path d="M10.5 7.8v5.4M7.8 10.5h5.4"></path></svg>',
  zoomOut:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5L21 21"></path><path d="M7.8 10.5h5.4"></path></svg>'
};

const overlayLock = { count: 0, overflow: '' };

function lockScroll() {
  if (overlayLock.count === 0) {
    overlayLock.overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  overlayLock.count += 1;
}

function unlockScroll() {
  overlayLock.count = Math.max(0, overlayLock.count - 1);
  if (overlayLock.count === 0) document.body.style.overflow = overlayLock.overflow;
}

export function icon(name, cls) {
  const tpl = document.createElement('template');
  tpl.innerHTML = ICONS[name] || '';
  const node = tpl.content.firstElementChild;
  if (!node) return document.createTextNode('');
  node.setAttribute('class', cls ? 'ico ' + cls : 'ico');
  node.setAttribute('focusable', 'false');
  return node;
}

function appendKids(node, kids) {
  for (const kid of kids) {
    if (kid === null || kid === undefined || kid === false || kid === true) continue;
    if (Array.isArray(kid)) {
      appendKids(node, kid);
      continue;
    }
    if (kid instanceof Node) node.append(kid);
    else node.append(document.createTextNode(String(kid)));
  }
}

export function el(tag, props, ...kids) {
  const node = document.createElement(tag);
  if (props && typeof props === 'object') {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = String(value);
      else if (key === 'text') node.textContent = String(value);
      else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
      else if (key === 'dataset' && typeof value === 'object') {
        for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = String(dv);
      } else if (key === 'value' && 'value' in node) node.value = String(value);
      else if (key === 'checked' && 'checked' in node) node.checked = Boolean(value);
      else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    }
  }
  appendKids(node, kids);
  return node;
}

export function frag(...kids) {
  const f = document.createDocumentFragment();
  appendKids(f, kids);
  return f;
}

/* ---------- 格式化 ---------- */

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function todayStr(date = new Date()) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

export function fmtMD(dateStr) {
  const parts = String(dateStr || '').split('-');
  if (parts.length < 3) return String(dateStr || '');
  return Number(parts[1]) + '/' + Number(parts[2]);
}

export function fmtClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return pad2(mm) + ':' + pad2(ss);
}

export function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m <= 0) return rest + ' 秒';
  return m + ' 分 ' + rest + ' 秒';
}

export function pct(correct, attempts) {
  if (!attempts) return 0;
  return Math.round((correct / attempts) * 100);
}

export function typeLabel(type) {
  return { single: '单选题', multiple: '多选题', judge: '判断题' }[type] || '题目';
}

export function letter(index) {
  return String.fromCharCode(65 + index);
}

export function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function pageSrc(page) {
  const n = Number(page);
  if (!Number.isFinite(n) || n <= 0) return '';
  return 'data/pages/p' + String(Math.round(n)).padStart(3, '0') + '.jpg';
}

/* ---------- 主题与字号 ---------- */

export function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#111310' : '#F2EDE1');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-label', t === 'dark' ? '切换到浅色主题' : '切换到深色主题');
    btn.setAttribute('title', t === 'dark' ? '切换到浅色主题' : '切换到深色主题');
  }
}

export function applyFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', String(scale || 1));
}

/* ---------- Toast ---------- */

export function toast(message, kind = 'info', ms = 2600) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const node = el('div', { class: 'toast toast-' + kind, text: String(message) });
  root.append(node);
  const remove = () => {
    node.classList.remove('is-in');
    setTimeout(() => node.remove(), 240);
  };
  requestAnimationFrame(() => node.classList.add('is-in'));
  setTimeout(remove, ms);
  while (root.children.length > 3) root.firstElementChild.remove();
}

/* ---------- 焦点圈定 ---------- */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function trapFocus(container, event) {
  const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter((n) => !n.hidden && n.getClientRects().length > 0);
  if (items.length === 0) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- 抽屉 ---------- */

let activeDrawer = null;

export function openDrawer({ title = '面板', subtitle = '', content }) {
  if (activeDrawer) activeDrawer.close();
  const root = document.getElementById('overlay-root');
  const prevFocus = document.activeElement;

  const closeBtn = el('button', { class: 'icon-btn drawer-close', type: 'button', 'aria-label': '关闭' }, icon('x'));
  const panel = el(
    'aside',
    { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    el(
      'header',
      { class: 'drawer-head' },
      el('div', {}, subtitle ? el('p', { class: 'eyebrow', text: subtitle }) : null, el('h2', { class: 'drawer-title', text: title })),
      closeBtn
    ),
    el('div', { class: 'drawer-body' }, content)
  );
  const backdrop = el('div', { class: 'drawer-backdrop' });
  const wrap = el('div', { class: 'drawer-root' }, backdrop, panel);
  root.append(wrap);
  lockScroll();
  requestAnimationFrame(() => wrap.classList.add('is-in'));

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    wrap.classList.remove('is-in');
    unlockScroll();
    setTimeout(() => wrap.remove(), 240);
    activeDrawer = null;
    if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
  }
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      trapFocus(panel, event);
    }
  }
  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  setTimeout(() => closeBtn.focus({ preventScroll: true }), 0);

  activeDrawer = { close };
  return { close };
}

/* ---------- 二次确认 ---------- */

export function confirmDialog({ title = '确认', message = '', confirmLabel = '确认', cancelLabel = '取消', danger = false }) {
  return new Promise((resolve) => {
    const root = document.getElementById('overlay-root');
    const prevFocus = document.activeElement;
    const cancel = el('button', { class: 'btn', type: 'button', text: cancelLabel });
    const ok = el('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), type: 'button', text: confirmLabel });
    const panel = el(
      'div',
      { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      el('div', { class: 'modal-body' }, el('h2', { class: 'modal-title', text: title }), el('p', { class: 'modal-text', text: message })),
      el('div', { class: 'modal-actions' }, cancel, ok)
    );
    const backdrop = el('div', { class: 'drawer-backdrop' });
    const wrap = el('div', { class: 'modal-root' }, backdrop, panel);
    root.append(wrap);
    lockScroll();
    requestAnimationFrame(() => wrap.classList.add('is-in'));

    let done = false;
    function finish(value) {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey, true);
      wrap.classList.remove('is-in');
      unlockScroll();
      setTimeout(() => wrap.remove(), 220);
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
      resolve(value);
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      } else if (event.key === 'Tab') {
        trapFocus(panel, event);
      }
    }
    cancel.addEventListener('click', () => finish(false));
    ok.addEventListener('click', () => finish(true));
    backdrop.addEventListener('click', () => finish(false));
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => cancel.focus({ preventScroll: true }), 0);
  });
}

/* ---------- 原题页浮层 ---------- */

export function openPageViewer({ page, title = '原题页', src } = {}) {
  const root = document.getElementById('overlay-root');
  const prevFocus = document.activeElement;
  const source = src || pageSrc(page);
  const label = '原题第 ' + page + ' 页';

  if (!source) {
    toast('这一题没有可用的原题页编号', 'error');
    return { close() {} };
  }

  const img = el('img', { class: 'page-viewer-img', alt: label, src: source, decoding: 'async' });
  const missing = el(
    'div',
    { class: 'page-viewer-missing', hidden: true },
    icon('image'),
    el('p', { text: '这一页原图还没收录（' + source + '）' }),
    el('p', { class: 'muted', text: '可先对照纸质原卷，或在题库补充后刷新再看。' })
  );
  const stage = el('div', { class: 'page-viewer-stage' }, img, missing);

  const zoomIn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': '放大原题页' }, icon('zoomIn'));
  const zoomOut = el('button', { class: 'icon-btn', type: 'button', 'aria-label': '缩小原题页' }, icon('zoomOut'));
  const closeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': '关闭原题页' }, icon('x'));

  const panel = el(
    'div',
    { class: 'page-viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': label },
    el(
      'div',
      { class: 'page-viewer-head' },
      el('p', { class: 'page-viewer-title', text: title + ' · 第 ' + page + ' 页' }),
      el('div', { class: 'page-viewer-tools' }, zoomOut, zoomIn, closeBtn)
    ),
    stage
  );
  const backdrop = el('div', { class: 'drawer-backdrop' });
  const wrap = el('div', { class: 'modal-root', style: { zIndex: '78' } }, backdrop, panel);
  root.append(wrap);
  lockScroll();
  requestAnimationFrame(() => wrap.classList.add('is-in'));

  let scale = 1;
  function applyScale() {
    img.style.width = Math.round(scale * 100) + '%';
    zoomOut.disabled = scale <= 0.5;
    zoomIn.disabled = scale >= 3;
  }
  applyScale();

  img.addEventListener('error', () => {
    img.remove();
    missing.hidden = false;
    zoomIn.disabled = true;
    zoomOut.disabled = true;
  });
  zoomIn.addEventListener('click', () => {
    scale = Math.min(3, scale + 0.25);
    applyScale();
  });
  zoomOut.addEventListener('click', () => {
    scale = Math.max(0.5, scale - 0.25);
    applyScale();
  });

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    wrap.classList.remove('is-in');
    unlockScroll();
    setTimeout(() => wrap.remove(), 220);
    if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
  }
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      trapFocus(panel, event);
    }
  }
  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  setTimeout(() => closeBtn.focus({ preventScroll: true }), 0);

  return { close };
}