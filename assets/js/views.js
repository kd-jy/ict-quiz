/* ============================================================
   views.js — 各页面模板（全部通过 DOM API 构建，文本走 textContent）
   ============================================================ */

import {
  el,
  frag,
  icon,
  typeLabel,
  letter,
  fmtClock,
  fmtDuration,
  pad2,
  todayStr,
  toast,
  openDrawer,
  confirmDialog,
  openPageViewer,
  applyTheme,
  applyFontScale
} from './ui.js';
import * as quiz from './quiz.js';
import {
  getState,
  recordAnswer,
  toggleFav,
  isFav,
  getNote,
  setNote,
  removeWrong,
  saveSession,
  clearSession,
  setSettings,
  setTheme,
  downloadBackup,
  importBackup,
  getBackupInfo,
  restoreFromBackup,
  clearPractice
} from './store.js';

/* ---------- 共享小件 ---------- */

function pageHead({ eyebrow = '', title = '', desc = '', aside = null } = {}) {
  return el(
    'header',
    { class: 'page-head' },
    el(
      'div',
      { class: 'page-head-main' },
      eyebrow ? el('p', { class: 'eyebrow', text: eyebrow }) : null,
      el('h1', { class: 'page-title', text: title }),
      desc ? el('p', { class: 'page-desc', text: desc }) : null
    ),
    aside
  );
}

function statStrip(items) {
  return el(
    'div',
    { class: 'stat-strip' },
    items.map((item) =>
      el(
        'div',
        { class: 'stat' },
        el('p', { class: 'stat-label', text: item.label }),
        el('p', { class: 'stat-value' }, String(item.value), item.unit ? el('span', { class: 'stat-unit', text: item.unit }) : null)
      )
    )
  );
}

function emptyState({ iconName = 'practice', title = '', desc = '', actions = [] } = {}) {
  return el(
    'div',
    { class: 'empty' },
    el('div', { class: 'empty-icon' }, icon(iconName)),
    el('h2', { class: 'empty-title', text: title }),
    desc ? el('p', { class: 'empty-desc', text: desc }) : null,
    actions.length ? el('div', { class: 'empty-actions' }, actions) : null
  );
}

function topicName(ctx, id) {
  const found = (ctx.topics || []).find((t) => t.id === id);
  return found ? found.name : id || '未分类';
}

function collapseText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
   首页
   ============================================================ */

export function renderHome(ctx) {
  const root = el('section', { class: 'view view-home' });
  const questions = ctx.data.questions;
  const topics = (ctx.topics || []).slice();
  const chosen = new Set();
  let amount = 20;
  let focusKey = null;

  function paint() {
    const st = getState();
    const ov = quiz.overview(questions, st);
    const last = st.lastSession;
    const resume =
      last && Array.isArray(last.ids) && last.ids.length
        ? last.finished
          ? '查看上次成绩'
          : '继续上次（第 ' + (last.index + 1) + ' / ' + last.ids.length + ' 题）'
        : '';

    const hero = el(
      'section',
      { class: 'hero' },
      el(
        'div',
        { class: 'hero-main' },
        el('p', { class: 'eyebrow', text: '网络赛道 · 刷题 — 题库 ' + ov.total + ' 题' }),
        el('h1', { class: 'hero-title', text: '把每一道题，做成本能。' }),
        el('p', {
          class: 'hero-lead',
          text: '省赛题库与 WLAN 题库合并。专项、随机、顺序与模考，进度、错题、掌握度都留在本机。'
        }),
        el(
          'div',
          { class: 'hero-actions' },
          resume ? el('a', { class: 'btn btn-primary', href: '#/quiz' }, icon('arrowRight'), resume) : null,
          el(
            'button',
            {
              class: 'btn' + (resume ? '' : ' btn-primary'),
              type: 'button',
              onClick: () => ctx.startSession({ mode: 'practice', count: 20, order: 'random' })
            },
            icon('refresh'),
            '随机 20 题'
          ),
          el(
            'button',
            {
              class: 'btn',
              type: 'button',
              onClick: () => ctx.startSession({ mode: 'practice', count: 0, order: 'sequential' })
            },
            icon('practice'),
            '顺序通做'
          )
        )
      ),
      el(
        'div',
        { class: 'hero-figure' },
        el('p', { class: 'hero-figure-label', text: '题库总量' }),
        el('p', { class: 'hero-figure-num', text: String(ov.total) }),
        el('p', { class: 'hero-figure-unit', text: '题 · ' + topics.length + ' 个模块' }),
        el('div', { class: 'hero-stamp', 'aria-hidden': 'true' }, el('span', { text: '刷' }), el('span', { text: '题' }))
      )
    );

    const stats = statStrip([
      { label: '题库', value: ov.total, unit: '题' },
      { label: '已做', value: ov.done, unit: '题' },
      { label: '正确率', value: ov.accuracy, unit: '%' },
      { label: '错题', value: ov.wrong, unit: '题' }
    ]);

    const scopeCount = quiz.selectIds(questions, { topicIds: Array.from(chosen), count: 0, order: 'sequential' }).length;
    const estimate = amount > 0 ? Math.min(amount, scopeCount) : scopeCount;

    const allChip = el(
      'button',
      {
        class: 'chip' + (chosen.size === 0 ? ' is-on' : ''),
        type: 'button',
        'aria-pressed': chosen.size === 0 ? 'true' : 'false',
        'data-fk': 'topic-all',
        onClick: () => {
          chosen.clear();
          focusKey = 'topic-all';
          paint();
        }
      },
      '全部',
      el('span', { class: 'chip-count', text: String(ov.total) })
    );

    const topicChips = topics.map((t) =>
      el(
        'button',
        {
          class: 'chip' + (chosen.has(t.id) ? ' is-on' : ''),
          type: 'button',
          'aria-pressed': chosen.has(t.id) ? 'true' : 'false',
          'data-fk': 'topic-' + t.id,
          onClick: () => {
            if (chosen.has(t.id)) chosen.delete(t.id);
            else chosen.add(t.id);
            focusKey = 'topic-' + t.id;
            paint();
          }
        },
        t.name,
        el('span', { class: 'chip-count', text: String(t.count) })
      )
    );

    const amountOptions = [
      { value: 10, label: '10 题' },
      { value: 20, label: '20 题' },
      { value: 0, label: '全部' }
    ];

    const setup = el(
      'section',
      { class: 'card' },
      el(
        'div',
        { class: 'card-head' },
        el('div', {}, el('p', { class: 'eyebrow', text: '按模块' }), el('h2', { class: 'card-title', text: '专项练习' })),
        el('p', { class: 'card-hint', text: '可多选模块；不选即全库' })
      ),
      el('div', { class: 'chips' }, allChip, topicChips),
      el(
        'div',
        { class: 'setup-row' },
        el('span', { class: 'field-label', text: '题量' }),
        el(
          'div',
          { class: 'segmented' },
          amountOptions.map((opt) =>
            el(
              'button',
              {
                class: 'seg-btn',
                type: 'button',
                'aria-pressed': amount === opt.value ? 'true' : 'false',
                'data-fk': 'amount-' + opt.value,
                onClick: () => {
                  amount = opt.value;
                  focusKey = 'amount-' + opt.value;
                  paint();
                }
              },
              opt.label
            )
          )
        )
      ),
      el(
        'div',
        { class: 'setup-foot' },
        el('p', {
          class: 'muted',
          text:
            '本次 ' +
            estimate +
            ' 题 · ' +
            (chosen.size ? Array.from(chosen).length + ' 个模块' : '全部模块')
        }),
        el(
          'button',
          {
            class: 'btn btn-primary',
            type: 'button',
            onClick: () =>
              ctx.startSession({
                mode: 'practice',
                count: amount,
                order: 'random',
                topicIds: Array.from(chosen)
              })
          },
          icon('play'),
          '开始专项练习'
        )
      )
    );

    const exam = el(
      'section',
      { class: 'card' },
      el(
        'div',
        { class: 'home-exam' },
        el(
          'div',
          { class: 'home-exam-text' },
          el('h2', { text: '模拟考 · 40 题 / 60 分钟' }),
          el('p', { text: '计时开始后不可暂停，时间到自动交卷；交卷页给出得分与错题清单。' })
        ),
        el(
          'button',
          {
            class: 'btn btn-primary',
            type: 'button',
            onClick: () =>
              ctx.startSession({ mode: 'exam', count: 40, order: 'random', durationSec: 60 * 60 })
          },
          icon('clock'),
          '开始模考'
        )
      )
    );

    const seenByTopic = new Map();
    for (const t of topics) seenByTopic.set(t.id, { seen: 0, attempts: 0, correct: 0 });
    for (const q of questions) {
      const rec = seenByTopic.get(q.topic);
      const p = st.progress[q.id];
      if (!rec || !p) continue;
      if (p.a > 0) rec.seen += 1;
      rec.attempts += p.a || 0;
      rec.correct += p.c || 0;
    }

    const bank = el(
      'section',
      { class: 'card' },
      el(
        'div',
        { class: 'card-head' },
        el('div', {}, el('p', { class: 'eyebrow', text: '题库' }), el('h2', { class: 'card-title', text: '模块概览' })),
        el('p', { class: 'card-hint', text: '已做 / 总题 · 正确率' })
      ),
      topics.length
        ? el(
            'div',
            { class: 'topic-list' },
            topics.map((t) => {
              const rec = seenByTopic.get(t.id) || { seen: 0, attempts: 0, correct: 0 };
              const rate = rec.attempts ? Math.round((rec.correct / rec.attempts) * 100) : 0;
              return el(
                'div',
                { class: 'topic-row' },
                el('span', { class: 'topic-name', text: t.name }),
                el('span', { class: 'topic-meta', text: rec.seen + '/' + t.count + ' · ' + rate + '%' }),
                el('span', { class: 'topic-bar' }, el('span', { class: 'topic-fill', style: { width: rate + '%' } }))
              );
            })
          )
        : el('p', { class: 'muted', text: '题库暂未提供模块信息。' })
    );

    root.replaceChildren(hero, stats, setup, exam, bank);
    if (focusKey) {
      const target = root.querySelector('[data-fk="' + focusKey + '"]');
      if (target) target.focus({ preventScroll: true });
      focusKey = null;
    }
  }

  paint();
  return root;
}

/* ============================================================
   答题
   ============================================================ */

export function renderQuiz(ctx) {
  let session = ctx.session;
  if (!session) return noSessionView(ctx);

  // 题库可能被替换：丢掉已不存在的题号，避免渲染空题。
  if (Array.isArray(session.ids)) {
    const known = session.ids.filter((id) => ctx.byId.has(id));
    if (known.length !== session.ids.length) {
      session.ids = known;
      session.index = Math.min(session.index, Math.max(0, known.length - 1));
      if (!known.length) {
        clearSession();
        return noSessionView(ctx);
      }
      saveSession(session);
    }
  }
  if (!session.ids.length) {
    clearSession();
    return noSessionView(ctx);
  }
  if (session.finished) return resultView(ctx, session);

  const root = el('section', { class: 'view view-quiz' });
  const expandedMap = new Map();
  let timerId = null;
  let noteTimer = null;
  let pendingNote = null;
  let dossier = null;

  function flushNote() {
    if (!pendingNote) return;
    setNote(pendingNote.id, pendingNote.value);
    pendingNote = null;
  }

  function currentQ() {
    const s = ctx.session;
    return ctx.byId.get(s.ids[s.index]);
  }

  function store(sess) {
    saveSession(sess);
  }

  function paint(focusOpt, toTop) {
    flushNote();
    const scroll = window.scrollY;
    root.replaceChildren(build());
    if (toTop) window.scrollTo({ top: 0, behavior: 'auto' });
    else window.scrollTo(0, scroll);
    if (focusOpt !== null && focusOpt !== undefined) {
      const btn = root.querySelector('[data-opt="' + focusOpt + '"]');
      if (btn) btn.focus({ preventScroll: true });
    }
  }

  function go(delta) {
    const sess = ctx.session;
    if (delta < 0) {
      if (sess.index > 0) {
        sess.index -= 1;
        store(sess);
        paint(null, true);
      }
      return;
    }
    if (sess.index < sess.ids.length - 1) {
      sess.index += 1;
      store(sess);
      paint(null, true);
      return;
    }
    if (sess.mode === 'exam') requestFinish();
    else finish();
  }

  function finish() {
    const sess = ctx.session;
    sess.finished = true;
    sess.endedAt = Date.now();
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    store(sess);
    ctx.refresh();
  }

  async function requestFinish() {
    const sum = quiz.summarize(ctx.session);
    if (sum.answered < sum.total) {
      const ok = await confirmDialog({
        title: '现在交卷？',
        message: '还有 ' + (sum.total - sum.answered) + ' 题未作答，交卷后按错计入总分。',
        confirmLabel: '交卷'
      });
      if (!ok) return;
    }
    finish();
  }

  function canJudge(question, judged) {
    if (judged) return false;
    if (question.type === 'multiple') return true;
    return !getState().settings.instantFeedback;
  }

  function pick(orig) {
    const sess = ctx.session;
    const question = currentQ();
    if (!question || sess.verdict[question.id]) return;
    let picks = (sess.picks[question.id] || []).slice();
    if (question.type === 'multiple') {
      picks = picks.includes(orig) ? picks.filter((n) => n !== orig) : picks.concat(orig);
      picks.sort((a, b) => a - b);
    } else {
      picks = [orig];
    }
    sess.picks[question.id] = picks;
    store(sess);
    if (question.type !== 'multiple' && getState().settings.instantFeedback) {
      submit(orig);
      return;
    }
    paint(orig);
  }

  function submit(focusOpt) {
    const sess = ctx.session;
    const question = currentQ();
    if (!question || sess.verdict[question.id]) return;
    const picks = sess.picks[question.id] || [];
    if (!picks.length) {
      toast('先选一个选项');
      return;
    }
    const correct = quiz.isCorrect(question, picks);
    sess.verdict[question.id] = { correct, at: Date.now() };
    const result = recordAnswer(question.id, correct);
    store(sess);
    if (!correct) toast('答错了，已收入错题本', 'error');
    else if (result.autoRemoved) toast('连续答对 2 次，已移出错题本', 'jade');
    ctx.refreshChrome();
    paint(focusOpt);
    revealVerdict();
  }

  // 判定条可能在长题下方：滚出屏幕时把它带进视野，避免"点了提交却没反应"的错觉。
  function revealVerdict() {
    requestAnimationFrame(() => {
      const node = root.querySelector('.verdict');
      if (!node) return;
      const box = node.getBoundingClientRect();
      const fits = box.top >= 8 && box.bottom <= window.innerHeight - 8;
      if (fits) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  function primary() {
    const sess = ctx.session;
    const question = currentQ();
    if (!question) return;
    if (sess.verdict[question.id]) {
      go(1);
      return;
    }
    if (canJudge(question, false) && (sess.picks[question.id] || []).length) {
      submit();
      return;
    }
    toast(question.type === 'multiple' ? '多选题：选好后点「提交答案」' : '先选择一个选项');
  }

  function sheetCells(sess, onPick) {
    return el(
      'div',
      { class: 'sheet-grid' },
      sess.ids.map((qid, i) => {
        const v = sess.verdict[qid];
        const isCurrent = i === sess.index;
        const cls = 'sheet-cell' + (isCurrent ? ' is-current' : '') + (v ? (v.correct ? ' is-correct' : ' is-wrong') : '');
        return el(
          'button',
          {
            class: cls,
            type: 'button',
            text: String(i + 1),
            'aria-current': isCurrent ? 'true' : null,
            'aria-label':
              '第 ' + (i + 1) + ' 题，' + (v ? (v.correct ? '答对' : '答错') : '未答') + (isCurrent ? '，当前题' : ''),
            onClick: () => onPick(i)
          }
        );
      })
    );
  }

  function sheetLegend() {
    return el(
      'div',
      { class: 'sheet-legend' },
      el('span', { class: 'legend-item' }, el('span', { class: 'dot' }), '未答'),
      el('span', { class: 'legend-item' }, el('span', { class: 'dot dot-current' }), '当前'),
      el('span', { class: 'legend-item' }, el('span', { class: 'dot dot-correct' }), '答对'),
      el('span', { class: 'legend-item' }, el('span', { class: 'dot dot-wrong' }), '答错')
    );
  }

  function jumpTo(i) {
    const sess = ctx.session;
    if (dossier) dossier.close();
    if (i !== sess.index) {
      sess.index = i;
      store(sess);
      paint(null, true);
    }
  }

  function openSheet() {
    const sess = ctx.session;
    const answered = Object.keys(sess.verdict).length;
    const remain =
      sess.mode === 'exam' && sess.deadline ? '剩余 ' + fmtClock(Math.max(0, sess.deadline - Date.now())) : '练习模式';
    dossier = openDrawer({
      title: '答题卡',
      subtitle: '本次会话 · ' + sess.ids.length + ' 题',
      content: el(
        'div',
        {},
        sheetLegend(),
        sheetCells(sess, jumpTo),
        el(
          'div',
          { class: 'sheet-foot' },
          el('span', { text: '已答 ' + answered + ' / ' + sess.ids.length }),
          el('span', { text: remain })
        )
      )
    });
  }

  function stemBlock(text) {
    const wrap = el('div', { class: 'stem' });
    const lines = String(text || '').split('\n');
    let buffer = [];
    const flush = () => {
      if (!buffer.length) return;
      wrap.append(el('pre', { class: 'cmd', text: buffer.join('\n') }));
      buffer = [];
    };
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      const trimmed = line.replace(/^\s+/, '');
      const isCommand = /^(<[A-Za-z][^>]*>|\[[^\]\s]+[^\]]*\])/.test(trimmed) && !/^[A-Za-z]\s*[.、]/.test(trimmed);
      if (isCommand) {
        buffer.push(line);
        continue;
      }
      flush();
      if (trimmed === '') continue;
      wrap.append(el('p', { text: line }));
    }
    flush();
    if (!wrap.childNodes.length) wrap.append(el('p', { text: '' }));
    return wrap;
  }

  function build() {
    const sess = ctx.session;
    const question = ctx.byId.get(sess.ids[sess.index]);
    const settings = getState().settings;
    const judged = Boolean(sess.verdict[question.id]);
    const verdict = sess.verdict[question.id] || null;
    const picks = (sess.picks[question.id] || []).slice();
    const order = quiz.displayOrder(question, sess.seed, settings.shuffle);
    const correctSet = new Set(question.answer || []);
    const correctLetters = order.reduce((acc, orig, pos) => {
      if (correctSet.has(orig)) acc.push(letter(pos));
      return acc;
    }, []);
    const pickedLetters = order.reduce((acc, orig, pos) => {
      if (picks.includes(orig)) acc.push(letter(pos));
      return acc;
    }, []);
    const isLast = sess.index === sess.ids.length - 1;
    const judgeable = canJudge(question, judged) && picks.length > 0;
    const favourited = isFav(question.id);

    const timerText =
      sess.mode === 'exam' && sess.deadline
        ? el('span', { class: 'exam-timer', role: 'timer' }, icon('clock'), el('span', { id: 'exam-timer-text', text: fmtClock(Math.max(0, sess.deadline - Date.now())) }))
        : null;

    const head = el(
      'div',
      { class: 'quiz-top' },
      el(
        'div',
        { class: 'quiz-top-left' },
        el('span', { class: 'quiz-index', text: '第 ' + (sess.index + 1) + ' / ' + sess.ids.length + ' 题' }),
        el('span', { class: 'quiz-index', text: topicName(ctx, question.topic) }),
        timerText
      ),
      el(
        'div',
        { class: 'quiz-top-actions' },
        el(
          'button',
          {
            class: 'btn btn-sm',
            type: 'button',
            onClick: () => {
              const on = toggleFav(question.id);
              toast(on ? '已收藏本题' : '已取消收藏', on ? 'jade' : 'info');
              paint(null, false);
            }
          },
          icon('star'),
          favourited ? '已收藏' : '收藏'
        ),
        el('button', { class: 'btn btn-sm', type: 'button', onClick: openSheet }, icon('grid'), '答题卡')
      )
    );

    const progressEl = el(
      'div',
      {
        class: 'quiz-progress',
        role: 'progressbar',
        'aria-label': '本组进度',
        'aria-valuemin': '1',
        'aria-valuemax': String(sess.ids.length),
        'aria-valuenow': String(sess.index + 1)
      },
      el('span', {
        class: 'quiz-progress-fill',
        style: { width: Math.max(4, Math.round(((sess.index + 1) / sess.ids.length) * 100)) + '%' }
      })
    );

    const optionEls = order.map((orig, pos) => {
      const picked = picks.includes(orig);
      const right = correctSet.has(orig);
      let cls = 'option';
      if (judged) {
        if (right) cls += ' is-correct';
        if (picked && !right) cls += ' is-wrong';
        if (picked && right) cls += ' is-picked';
      } else if (picked) {
        cls += ' is-picked';
      }
      const mark = judged && right ? icon('check') : judged && picked && !right ? icon('x') : null;
      return el(
        'button',
        {
          class: cls,
          type: 'button',
          'data-opt': orig,
          'aria-pressed': picked ? 'true' : 'false',
          'aria-disabled': judged ? 'true' : null
        },
        el('span', { class: 'letter', text: letter(pos) }),
        el('span', { class: 'opt-text', text: question.options[orig] }),
        el('span', { class: 'opt-mark' }, mark)
      );
    });

    const verdictEl = judged
      ? el(
          'div',
          { class: 'verdict ' + (verdict.correct ? 'is-correct' : 'is-wrong'), role: 'status' },
          icon(verdict.correct ? 'check' : 'x'),
          el(
            'div',
            { class: 'verdict-body' },
            el('p', { class: 'verdict-title', text: verdict.correct ? '回答正确' : '回答错误' }),
            el('p', {
              class: 'verdict-text',
              text:
                '正确答案：' +
                (correctLetters.join('、') || '—') +
                (pickedLetters.length ? ' · 你的选择：' + pickedLetters.join('、') : '')
            })
          )
        )
      : null;

    const openKey = expandedMap.has(question.id) ? expandedMap.get(question.id) : judged;
    const explainBody = el(
      'div',
      { class: 'explain-body' },
      (question.explanation || '').trim()
        ? el('p', { class: 'explain-text', text: question.explanation })
        : el('p', { class: 'explain-empty', text: '本题暂无解析，可在下方记一条自己的笔记。' }),
      el(
        'div',
        { class: 'note' },
        el('label', { class: 'note-label', for: 'q-note', text: '随手记' }),
        el('textarea', {
          class: 'note-input',
          id: 'q-note',
          rows: 3,
          placeholder: '记一句自己的理解，或写下易错点…',
          'aria-label': '本题笔记',
          value: getNote(question.id),
          onInput: (event) => {
            const value = event.target.value;
            pendingNote = { id: question.id, value };
            if (noteTimer) clearTimeout(noteTimer);
            noteTimer = setTimeout(flushNote, 500);
          },
          onBlur: (event) => {
            pendingNote = { id: question.id, value: event.target.value };
            flushNote();
          }
        }),
        el('p', { class: 'note-hint', text: '只保存在本机浏览器，可随时导出备份。' })
      )
    );
    explainBody.hidden = !openKey;

    const explainToggle = el(
      'button',
      {
        class: 'explain-toggle',
        type: 'button',
        'aria-expanded': openKey ? 'true' : 'false',
        onClick: () => {
          const nowOpen = explainBody.hidden;
          explainBody.hidden = !nowOpen;
          expandedMap.set(question.id, nowOpen);
          explainToggle.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
          stateLabel.textContent = nowOpen ? '收起' : '展开';
        }
      },
      el('span', { class: 'tag', text: '解析' }),
      el('span', { class: 'explain-state', text: openKey ? '收起' : '展开' }),
      icon('chevronDown', 'chev')
    );
    const stateLabel = explainToggle.querySelector('.explain-state');

    const imageHint = question.hasImage
      ? el('p', { class: 'q-hint' }, icon('image'), '本题原题含图，请对照原卷')
      : null;
    const pageNo = Number(question.page);
    const pageTools =
      Number.isFinite(pageNo) && pageNo > 0
        ? el(
            'div',
            { class: 'answer-tools' },
            el(
              'button',
              {
                class: 'btn btn-sm',
                type: 'button',
                onClick: () => openPageViewer({ page: Math.round(pageNo), title: '原题页' })
              },
              icon('image'),
              '查看原题页'
            )
          )
        : null;

    const explain = el('section', { class: 'explain' }, explainToggle, explainBody);

    const qcard = el(
      'article',
      { class: 'qcard' },
      el(
        'div',
        { class: 'qcard-head' },
        el('span', { class: 'qnum-idx', text: pad2(sess.index + 1) }),
        el('span', { class: 'qnum-meta', text: topicName(ctx, question.topic) + ' · ' + (question.source || '题库') }),
        el('span', { class: 'qtype-badge is-' + question.type, text: typeLabel(question.type) })
      ),
      el('p', {
        class: 'qtype-hint',
        text:
          question.type === 'multiple'
            ? '多选题 · 选出全部正确项后点「提交答案」'
            : question.type === 'judge'
              ? '判断题 · 判断正误后点「提交答案」'
              : '单选题 · 选中一个选项后点「提交答案」'
      }),
      stemBlock(question.stem),
      imageHint,
      el(
        'div',
        {
          class: 'options',
          role: 'group',
          'aria-label': '选项',
          onClick: (event) => {
            const btn = event.target && event.target.closest ? event.target.closest('[data-opt]') : null;
            if (!btn) return;
            pick(Number(btn.dataset.opt));
          }
        },
        optionEls
      ),
      verdictEl,
      pageTools,
      explain
    );

    const submitDisabled = judged || !judgeable;
    const actionHint = judged
      ? '本题已判定 · 正确答案 ' + (correctLetters.join('、') || '—')
      : picks.length
        ? '已选 ' + pickedLetters.join('、') + ' · 点「提交答案」判定'
        : question.type === 'multiple'
          ? '多选题：选全后点「提交答案」'
          : picks.length === 0
            ? '先选一个选项，再点「提交答案」'
            : '';
    const actions = el(
      'div',
      { class: 'quiz-foot' },
      el('p', { class: 'action-hint', text: actionHint }),
      el(
        'div',
        { class: 'quiz-actions' },
        el('button', { class: 'btn', type: 'button', disabled: sess.index === 0, onClick: () => go(-1) }, '上一题'),
        el(
          'button',
          {
            class: 'btn' + (judgeable ? ' btn-primary' : ''),
            type: 'button',
            disabled: submitDisabled,
            title: judged ? '本题已判定' : !picks.length ? '先选择选项' : '',
            onClick: () => submit()
          },
          judged ? '已判定' : '提交答案'
        ),
        el(
          'button',
          { class: 'btn' + (judged || isLast ? ' btn-primary' : ''), type: 'button', onClick: () => go(1) },
          isLast ? (sess.mode === 'exam' ? '交卷' : '完成本组') : '下一题'
        )
      )
    );

    const answeredCount = Object.keys(sess.verdict).length;
    const remainText =
      sess.mode === 'exam' && sess.deadline ? '剩余 ' + fmtClock(Math.max(0, sess.deadline - Date.now())) : '练习模式';
    const aside = el(
      'aside',
      { class: 'quiz-aside', 'aria-label': '答题卡' },
      el(
        'div',
        { class: 'aside-card' },
        el('p', { class: 'aside-title' }, '答题卡', el('span', { text: '已答 ' + answeredCount + ' / ' + sess.ids.length })),
        sheetCells(sess, jumpTo),
        sheetLegend(),
        el('div', { class: 'aside-foot' }, el('span', { text: '点题号跳转' }), el('span', { text: remainText }))
      )
    );

    return frag(
      el(
        'div',
        { class: 'quiz-shell' },
        el(
          'div',
          { class: 'quiz-main' },
          head,
          progressEl,
          qcard,
          el('p', { class: 'kbd-hint', text: '键盘：1–6 选择 · Enter 提交 / 下一题 · ← → 切换题目' })
        ),
        aside
      ),
      actions
    );
  }

  function onKey(event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const overlay = document.getElementById('overlay-root');
    if (overlay && overlay.childElementCount > 0) return;
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
      return;
    }
    if (/^[1-6]$/.test(event.key)) {
      const question = currentQ();
      if (!question) return;
      const order = quiz.displayOrder(question, ctx.session.seed, getState().settings.shuffle);
      const pos = Number(event.key) - 1;
      if (pos < order.length) {
        event.preventDefault();
        pick(order[pos]);
      }
      return;
    }
    if (event.key === 'Enter') {
      const button = target && target.closest ? target.closest('button') : null;
      if (button && button.classList.contains('option')) {
        event.preventDefault();
        primary();
        return;
      }
      if (button) return;
      event.preventDefault();
      primary();
    }
  }

  if (session.mode === 'exam' && session.deadline) {
    timerId = setInterval(() => {
      const sec = Math.max(0, session.deadline - Date.now());
      const node = root.querySelector('#exam-timer-text');
      if (node) node.textContent = fmtClock(sec);
      if (sec <= 0) {
        clearInterval(timerId);
        timerId = null;
        finish();
      }
    }, 1000);
  }

  document.addEventListener('keydown', onKey, true);
  ctx.onCleanup(() => {
    document.removeEventListener('keydown', onKey, true);
    if (noteTimer) clearTimeout(noteTimer);
    flushNote();
    if (timerId) clearInterval(timerId);
    if (dossier) dossier.close();
  });

  paint();
  return root;
}

function noSessionView(ctx) {
  return el(
    'section',
    { class: 'view' },
    pageHead({ eyebrow: '答题', title: '还没有进行中的练习', desc: '从题库里挑一组开始；也可以直接进入模考。' }),
    emptyState({
      iconName: 'practice',
      title: '先开一组题',
      desc: '随机 20 题最省心；想系统过一遍，就顺序通做。',
      actions: [
        el(
          'button',
          { class: 'btn btn-primary', type: 'button', onClick: () => ctx.startSession({ mode: 'practice', count: 20, order: 'random' }) },
          icon('refresh'),
          '随机 20 题'
        ),
        el(
          'button',
          {
            class: 'btn',
            type: 'button',
            onClick: () => ctx.startSession({ mode: 'practice', count: 0, order: 'sequential' })
          },
          '顺序通做'
        )
      ]
    })
  );
}

/* ============================================================
   结果页（练习完成 / 模考交卷）
   ============================================================ */

function resultView(ctx, session) {
  const sum = quiz.summarize(session);
  const isExam = session.mode === 'exam';
  const wrong = sum.wrongIds.map((id) => ctx.byId.get(id)).filter(Boolean);

  const head = el(
    'div',
    { class: 'result-head' },
    el(
      'div',
      {},
      el('p', { class: 'eyebrow', text: isExam ? '模考交卷' : '本轮完成' }),
      el('h1', { class: 'page-title', text: isExam ? '本次得分' : '本轮正确率' }),
      el('p', {
        class: 'page-desc',
        text: isExam
          ? '共 ' + sum.total + ' 题，答对 ' + sum.correct + ' 题；错题已自动收入错题本。'
          : '共 ' + sum.total + ' 题，答对 ' + sum.correct + ' 题；答错的题已收入错题本。'
      })
    ),
    el('p', { class: 'result-score' }, String(sum.score), el('small', { text: isExam ? '分' : '%' }))
  );

  const stats = statStrip([
    { label: '答对', value: sum.correct + '/' + sum.total },
    { label: '已答', value: sum.answered, unit: '题' },
    { label: '用时', value: fmtDuration(sum.durationSec) },
    { label: '未答', value: sum.total - sum.answered, unit: '题' }
  ]);

  const list = wrong.length
    ? el(
        'ul',
        { class: 'result-list' },
        wrong.slice(0, 12).map((q) =>
          el(
            'li',
            { class: 'result-item' },
            el('span', { class: 'tag', text: typeLabel(q.type) }),
            el('p', { text: collapseText(q.stem) })
          )
        )
      )
    : el('p', { class: 'muted', text: '本轮没有错题。' });

  const actions = el(
    'div',
    { class: 'result-actions' },
    el(
      'button',
      {
        class: 'btn btn-primary',
        type: 'button',
        onClick: () =>
          isExam
            ? ctx.startSession({ mode: 'exam', count: 40, order: 'random', durationSec: 60 * 60 })
            : ctx.startSession({ mode: 'practice', count: 20, order: 'random' })
      },
      icon('refresh'),
      isExam ? '再考一次' : '再来一组'
    ),
    wrong.length
      ? el(
          'button',
          {
            class: 'btn',
            type: 'button',
            onClick: () => ctx.startSession({ mode: 'review', ids: sum.wrongIds })
          },
          icon('play'),
          '重做错题'
        )
      : null,
    el('a', { class: 'btn', href: '#/wrong' }, '错题本'),
    el('a', { class: 'btn btn-ghost', href: '#/home' }, '回首页')
  );

  return el(
    'section',
    { class: 'view' },
    head,
    stats,
    el(
      'section',
      { class: 'card' },
      el(
        'div',
        { class: 'card-head' },
        el('div', {}, el('p', { class: 'eyebrow', text: '复盘' }), el('h2', { class: 'card-title', text: '错题清单' })),
        el('p', { class: 'card-hint', text: wrong.length ? '最多列 12 道' : '干净的一轮' })
      ),
      list,
      actions
    )
  );
}

/* ============================================================
   错题本
   ============================================================ */

export function renderWrong(ctx) {
  const root = el('section', { class: 'view view-wrong' });
  const PAGE_SIZE = 8;
  let filter = 'all';
  let page = 0;
  let focusKey = null;

  function paint() {
    const st = getState();
    const all = quiz.wrongQuestions(ctx.data.questions, st);
    const topics = (ctx.topics || []).filter((t) => all.some((q) => q.topic === t.id));
    const list = filter === 'all' ? all : all.filter((q) => q.topic === filter);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    const slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const head = pageHead({
      eyebrow: '错题本',
      title: all.length ? '错题 ' + all.length + ' 道' : '错题本',
      desc: '答错的题自动收进来；连续答对 2 次（可在设置关闭）或手动移出。'
    });

    if (!all.length) {
      root.replaceChildren(
        head,
        emptyState({
          iconName: 'wrong',
          title: '错题本还是空的',
          desc: '去练一组题，答错的会自动出现在这里。',
          actions: [
            el('a', { class: 'btn btn-primary', href: '#/home' }, icon('play'), '去练习'),
            el('a', { class: 'btn', href: '#/stats' }, '看统计')
          ]
        })
      );
      return;
    }

    const chips = el(
      'div',
      { class: 'chips', style: { marginBottom: '14px' } },
      el(
        'button',
        {
          class: 'chip' + (filter === 'all' ? ' is-on' : ''),
          type: 'button',
          'aria-pressed': filter === 'all' ? 'true' : 'false',
          'data-fk': 'w-all',
          onClick: () => {
            filter = 'all';
            page = 0;
            focusKey = 'w-all';
            paint();
          }
        },
        '全部',
        el('span', { class: 'chip-count', text: String(all.length) })
      ),
      topics.map((t) => {
        const count = all.filter((q) => q.topic === t.id).length;
        return el(
          'button',
          {
            class: 'chip' + (filter === t.id ? ' is-on' : ''),
            type: 'button',
            'aria-pressed': filter === t.id ? 'true' : 'false',
            'data-fk': 'w-' + t.id,
            onClick: () => {
              filter = t.id;
              page = 0;
              focusKey = 'w-' + t.id;
              paint();
            }
          },
          t.name,
          el('span', { class: 'chip-count', text: String(count) })
        );
      })
    );

    const toolbar = el(
      'div',
      { class: 'wrong-toolbar' },
      el(
        'div',
        { class: 'wrong-actions' },
        el(
          'button',
          {
            class: 'btn btn-sm',
            type: 'button',
            disabled: slice.length === 0,
            onClick: () => ctx.startSession({ mode: 'review', ids: slice.map((q) => q.id) })
          },
          icon('play'),
          '重做本页'
        ),
        el(
          'button',
          { class: 'btn btn-sm', type: 'button', onClick: () => ctx.startSession({ mode: 'review', ids: all.map((q) => q.id) }) },
          '重做全部（' + all.length + '）'
        )
      ),
      el('p', { class: 'muted', text: list.length + ' 道 · 第 ' + (page + 1) + ' / ' + pages + ' 页' })
    );

    const items = slice.map((q) => {
      const rec = st.progress[q.id] || {};
      return el(
        'li',
        { class: 'wrong-item' },
        el(
          'div',
          { class: 'wi-head' },
          el('span', { class: 'tag', text: typeLabel(q.type) }),
          el('span', { text: topicName(ctx, q.topic) }),
          rec.last ? el('span', { text: '最近 ' + rec.last }) : null
        ),
        el('p', { class: 'wi-stem', text: collapseText(q.stem) }),
        el(
          'div',
          { class: 'wi-actions' },
          el(
            'button',
            { class: 'btn btn-sm', type: 'button', onClick: () => ctx.startSession({ mode: 'review', ids: [q.id] }) },
            icon('play'),
            '重做'
          ),
          el(
            'button',
            {
              class: 'btn btn-sm btn-danger',
              type: 'button',
              onClick: () => {
                removeWrong(q.id);
                toast('已移出错题本');
                paint();
              }
            },
            '移出'
          )
        )
      );
    });

    const pagination =
      pages > 1
        ? el(
            'div',
            { class: 'pagination' },
            el(
              'button',
              {
                class: 'btn btn-sm',
                type: 'button',
                disabled: page <= 0,
                onClick: () => {
                  page -= 1;
                  paint();
                }
              },
              '上一页'
            ),
            el('span', { class: 'page-info', text: (page + 1) + ' / ' + pages }),
            el(
              'button',
              {
                class: 'btn btn-sm',
                type: 'button',
                disabled: page >= pages - 1,
                onClick: () => {
                  page += 1;
                  paint();
                }
              },
              '下一页'
            )
          )
        : null;

    root.replaceChildren(
      ...[
        head,
        chips,
        toolbar,
        slice.length ? el('ul', { class: 'wrong-list' }, items) : emptyState({ iconName: 'wrong', title: '这个模块没有错题', desc: '换一个模块筛选看看。' }),
        pagination
      ].filter(Boolean)
    );

    if (focusKey) {
      const target = root.querySelector('[data-fk="' + focusKey + '"]');
      if (target) target.focus({ preventScroll: true });
      focusKey = null;
    }
  }

  paint();
  return root;
}

/* ============================================================
   统计
   ============================================================ */

export function renderStats(ctx) {
  const st = getState();
  const questions = ctx.data.questions;
  const ov = quiz.overview(questions, st);
  const mastery = quiz.topicMastery(questions, ctx.topics, st);
  const days = quiz.recentDays(st, 7);
  const weekTotal = days.reduce((sum, d) => sum + d.a, 0);
  const weekCorrect = days.reduce((sum, d) => sum + d.c, 0);

  const head = pageHead({ eyebrow: '数据', title: '掌握度', desc: '按作答次数统计；重复练习也会计入正确率。' });

  if (ov.attempts === 0) {
    return el(
      'section',
      { class: 'view view-stats' },
      head,
      emptyState({
        iconName: 'stats',
        title: '还没有可统计的数据',
        desc: '做完第一组题，这里会出现正确率、模块掌握度和近 7 日曲线。',
        actions: [el('a', { class: 'btn btn-primary', href: '#/home' }, icon('play'), '去练习')]
      })
    );
  }

  const stats = statStrip([
    { label: '题库', value: ov.total, unit: '题' },
    { label: '已做', value: ov.done, unit: '题' },
    { label: '正确率', value: ov.accuracy, unit: '%' },
    { label: '错题', value: ov.wrong, unit: '题' }
  ]);

  const masteryCard = el(
    'section',
    { class: 'card' },
    el(
      'div',
      { class: 'card-head' },
      el('div', {}, el('p', { class: 'eyebrow', text: '模块' }), el('h2', { class: 'card-title', text: '模块掌握度' })),
      el('p', { class: 'card-hint', text: '正确率 · 已练 / 总题' })
    ),
    el(
      'div',
      { class: 'mastery-list' },
      mastery.map((t) =>
        el(
          'div',
          { class: 'mastery-row', title: t.correct + ' 次正确 / ' + t.attempts + ' 次作答' },
          el(
            'div',
            { class: 'mastery-head' },
            el('span', { class: 'mastery-name', text: t.name }),
            el('span', { class: 'mastery-value', text: t.rate + '% · ' + t.seen + '/' + t.count + ' 题' })
          ),
          el('div', { class: 'bar' }, el('span', { class: 'bar-fill' + (t.attempts ? '' : ' is-empty'), style: { width: (t.attempts ? t.rate : 0) + '%' } }))
        )
      )
    )
  );

  const max = Math.max(1, ...days.map((d) => d.a));
  const chart = el(
    'div',
    { class: 'chart' },
    days.map((d) => {
      const height = d.a ? Math.max(8, Math.round((d.a / max) * 96)) : 4;
      const today = d.key === todayStr();
      return el(
        'div',
        { class: 'day' + (today ? ' is-today' : ''), title: d.key + '：作答 ' + d.a + ' 次，答对 ' + d.c + ' 次' },
        el('span', { class: 'day-count', text: String(d.a) }),
        el('div', { class: 'day-bar' + (d.a ? ' has-data' : ''), style: { height: height + 'px' } }),
        el('span', { class: 'day-label', text: d.weekday })
      );
    })
  );

  const chartCard = el(
    'section',
    { class: 'card' },
    el(
      'div',
      { class: 'card-head' },
      el('div', {}, el('p', { class: 'eyebrow', text: '近 7 日' }), el('h2', { class: 'card-title', text: '每日作答' })),
      el('p', { class: 'card-hint', text: weekTotal + ' 次作答 · 答对 ' + weekCorrect + ' 次' })
    ),
    chart,
    el('div', { class: 'chart-caption' }, el('span', { text: '柱高按当日作答次数' }), el('span', { text: '今天以朱砂标出' }))
  );

  return el('section', { class: 'view view-stats' }, head, stats, masteryCard, chartCard);
}

/* ============================================================
   设置
   ============================================================ */

export function renderSettings(ctx) {
  const root = el('section', { class: 'view view-settings' });
  let focusKey = null;

  function segmented(options, value, onPick, prefix) {
    return el(
      'div',
      { class: 'segmented' },
      options.map((opt) =>
        el(
          'button',
          {
            class: 'seg-btn',
            type: 'button',
            'aria-pressed': value === opt.value ? 'true' : 'false',
            'data-fk': prefix + '-' + opt.value,
            onClick: () => {
              onPick(opt.value);
              focusKey = prefix + '-' + opt.value;
              paint();
            }
          },
          opt.label
        )
      )
    );
  }

  function switchControl(checked, onToggle, label) {
    return el(
      'button',
      {
        class: 'switch',
        type: 'button',
        role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': label,
        onClick: () => {
          onToggle();
          paint();
        }
      },
      el('span', { class: 'sr-only', text: label })
    );
  }

  function paint() {
    const st = getState();
    const settings = st.settings;
    const meta = ctx.meta || {};
    const counts = meta.counts || {};
    const topics = ctx.topics || [];

    const head = pageHead({ eyebrow: '设置', title: '偏好与数据', desc: '所有数据只保存在本机浏览器，不上传任何服务器。' });

    const appearance = el(
      'section',
      { class: 'card' },
      el('div', { class: 'card-head' }, el('div', {}, el('p', { class: 'eyebrow', text: '外观' }), el('h2', { class: 'card-title', text: '纸墨' }))),
      el(
        'div',
        {},
        el(
          'div',
          { class: 'setting-row' },
          el('div', { class: 'setting-text' }, el('p', { class: 'setting-title', text: '主题' }), el('p', { class: 'setting-desc', text: '浅色是宣纸底；深色用于夜间。' })),
          el(
            'div',
            { class: 'setting-control' },
            segmented(
              [
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' }
              ],
              settings.theme,
              (value) => {
                setTheme(value);
                applyTheme(value);
              },
              'theme'
            )
          )
        ),
        el(
          'div',
          { class: 'setting-row' },
          el('div', { class: 'setting-text' }, el('p', { class: 'setting-title', text: '字号' }), el('p', { class: 'setting-desc', text: '正文与题目一起缩放。' })),
          el(
            'div',
            { class: 'setting-control' },
            segmented(
              [
                { value: 0.95, label: '小' },
                { value: 1, label: '标准' },
                { value: 1.12, label: '大' }
              ],
              settings.fontScale,
              (value) => {
                setSettings({ fontScale: value });
                applyFontScale(value);
              },
              'font'
            )
          )
        )
      )
    );

    const answering = el(
      'section',
      { class: 'card' },
      el('div', { class: 'card-head' }, el('div', {}, el('p', { class: 'eyebrow', text: '答题' }), el('h2', { class: 'card-title', text: '练习行为' }))),
      el(
        'div',
        { class: 'setting-row' },
        el(
          'div',
          { class: 'setting-text' },
          el('p', { class: 'setting-title', text: '选项乱序' }),
          el('p', { class: 'setting-desc', text: '单选与多选的选项每次按题号稳定打乱，判断题不变。' })
        ),
        switchControl(settings.shuffle, () => setSettings({ shuffle: !settings.shuffle }), '选项乱序')
      ),
      el(
        'div',
        { class: 'setting-row' },
        el(
          'div',
          { class: 'setting-text' },
          el('p', { class: 'setting-title', text: '点选即判' }),
          el('p', { class: 'setting-desc', text: '默认关闭：先选答案，再点「提交答案」判定。打开后单选与判断点选即判，少了核对的机会。' })
        ),
        switchControl(settings.instantFeedback, () => setSettings({ instantFeedback: !settings.instantFeedback }), '点选选项后立即判定')
      ),
      el(
        'div',
        { class: 'setting-row' },
        el(
          'div',
          { class: 'setting-text' },
          el('p', { class: 'setting-title', text: '错题自动移出' }),
          el('p', { class: 'setting-desc', text: '同一题连续答对 2 次后自动移出错题本。' })
        ),
        switchControl(settings.autoRemoveWrong, () => setSettings({ autoRemoveWrong: !settings.autoRemoveWrong }), '连续答对两次自动移出错题本')
      )
    );

    const fileInput = el('input', {
      class: 'file-input',
      type: 'file',
      accept: 'application/json,.json',
      tabindex: '-1',
      'aria-hidden': 'true'
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast('文件太大，不像是备份文件', 'error');
        return;
      }
      try {
        const text = await file.text();
        const result = importBackup(text);
        if (!result.ok) {
          toast('导入失败：' + result.error, 'error', 4200);
          return;
        }
        applyTheme(getState().settings.theme);
        applyFontScale(getState().settings.fontScale);
        ctx.refreshChrome();
        toast('导入成功：' + result.progressCount + ' 题记录', 'jade');
        paint();
      } catch (err) {
        console.error('读取导入文件失败：', err);
        toast('读取文件失败', 'error');
      }
    });

    let armed = false;
    let armTimer = null;
    const clearBtn = el('button', { class: 'btn btn-danger btn-block', type: 'button' }, icon('trash'), '清空练习记录');
    clearBtn.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        clearBtn.classList.add('is-armed');
        clearBtn.replaceChildren(icon('trash'), document.createTextNode('再点一次确认'));
        clearBtn.setAttribute('aria-label', '再点一次确认清空练习记录');
        toast('再点一次将清空进度、错题、收藏与笔记');
        armTimer = setTimeout(() => {
          armed = false;
          clearBtn.classList.remove('is-armed');
          clearBtn.replaceChildren(icon('trash'), document.createTextNode('清空练习记录'));
          clearBtn.removeAttribute('aria-label');
        }, 4000);
        return;
      }
      if (armTimer) clearTimeout(armTimer);
      clearPractice();
      ctx.refreshChrome();
      toast('已清空练习记录', 'jade');
      ctx.refresh();
    });

    const backup = getBackupInfo();
    const backupText = backup
      ? '自动备份：' +
        new Date(backup.at).toLocaleString('zh-CN', { hour12: false }) +
        ' · 覆盖 ' +
        backup.questions +
        ' 题记录' +
        (backup.fav ? ' · 收藏 ' + backup.fav : '') +
        (backup.notes ? ' · 笔记 ' + backup.notes : '')
      : '自动备份：暂无（答过题后每 5 分钟自动存一份）';

    const dataCard = el(
      'section',
      { class: 'card' },
      el('div', { class: 'card-head' }, el('div', {}, el('p', { class: 'eyebrow', text: '数据' }), el('h2', { class: 'card-title', text: '备份与清空' }))),
      el(
        'div',
        { class: 'data-actions' },
        el(
          'button',
          {
            class: 'btn',
            type: 'button',
            onClick: () => {
              const name = downloadBackup();
              toast('已导出 ' + name, 'jade');
            }
          },
          icon('download'),
          '导出备份（JSON）'
        ),
        el(
          'button',
          { class: 'btn', type: 'button', onClick: () => fileInput.click() },
          icon('upload'),
          '导入备份'
        ),
        el(
          'button',
          {
            class: 'btn',
            type: 'button',
            disabled: !backup,
            onClick: () => {
              const r = restoreFromBackup();
              if (r.ok) {
                toast('已从自动备份恢复 ' + r.questions + ' 题记录', 'jade');
                ctx.refreshChrome();
                ctx.refresh();
              } else {
                toast(r.error, 'error');
              }
            }
          },
          icon('download'),
          '从自动备份恢复'
        ),
        fileInput,
        clearBtn
      ),
      el('p', { class: 'settings-note', text: backupText }),
      el('p', {
        class: 'settings-note',
        text: '进度按域名隔离：换域名（如从 edgeone 换到 github.io）或换设备，需要先导出再导入。清理浏览器数据会一并清掉，建议定期导出。'
      })
    );

    const countsText =
      '共 ' +
      (meta.total || ctx.data.questions.length) +
      ' 题' +
      (counts.single || counts.multiple || counts.judge
        ? '（单选 ' + (counts.single || 0) + ' · 多选 ' + (counts.multiple || 0) + ' · 判断 ' + (counts.judge || 0) + '）'
        : '');

    const bankCard = el(
      'section',
      { class: 'card' },
      el('div', { class: 'card-head' }, el('div', {}, el('p', { class: 'eyebrow', text: '题库' }), el('h2', { class: 'card-title', text: '当前题源' }))),
      el(
        'dl',
        { class: 'kv' },
        el('dt', { text: '名称' }),
        el('dd', { text: meta.title || '网络赛道刷题' }),
        el('dt', { text: '版本' }),
        el('dd', { text: 'v' + (meta.version || 1) }),
        el('dt', { text: '题量' }),
        el('dd', { text: countsText }),
        el('dt', { text: '模块' }),
        el('dd', { text: topics.length + ' 个' }),
        el('dt', { text: '来源' }),
        el('dd', { text: Array.isArray(meta.builtFrom) && meta.builtFrom.length ? meta.builtFrom.join('、') : '—' })
      ),
      el('p', {
        class: 'settings-note',
        text: '每题都附有中文解析（按讲义与真题机制整理，如与原卷或讲义冲突以讲义为准）；含图题可点「查看原题页」看扫描原页。'
      })
    );

    root.replaceChildren(head, appearance, answering, dataCard, bankCard);
    if (focusKey) {
      const target = root.querySelector('[data-fk="' + focusKey + '"]');
      if (target) target.focus({ preventScroll: true });
      focusKey = null;
    }
  }

  paint();
  return root;
}