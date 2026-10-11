// ════════════════════════════════════════════════════
//  말문 · 화면 — 홈, 상황 목록, 말하기 연습, 복습함, 내 문장, 설정
//  저장은 이 기기 localStorage(malmun_ 접두어)만 쓴다. 외부로 보내는 데이터 없음.
//  음성 인식·읽어 주기는 브라우저 기능(크롬 권장)을 쓴다.
// ════════════════════════════════════════════════════
(function () {
  const PREFIX = 'malmun_';
  const store = {
    get(k, def) {
      try { const v = localStorage.getItem(PREFIX + k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }
  };

  const DEFAULT_SETTINGS = { eventName: '대만 교류', eventDate: '2026-10-23', rate: 0.9 };
  let settings = Object.assign({}, DEFAULT_SETTINGS, store.get('settings', {}));
  let progress = store.get('progress', { stuck: {}, done: {}, days: {} });
  let mine = store.get('mine', []);
  let swVersion = ''; // 서비스 워커가 알려 주는 버전(설정 화면에 표시)

  const app = document.getElementById('app');
  const today = () => Core.dateKey(new Date());
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── 문장 찾기 ──
  function setItems(set) {
    return set.items.map((it, i) => Object.assign({ key: set.id + ':' + i }, it));
  }
  function mineItems() {
    return mine.map(m => ({ key: 'mine:' + m.id, ko: m.ko, en: m.en, alt: [], tip: m.tip }));
  }
  function itemByKey(key) {
    if (key.startsWith('mine:')) return mineItems().find(it => it.key === key);
    const [sid, i] = key.split(':');
    const set = SETS.find(s => s.id === sid);
    return set && set.items[+i] ? Object.assign({ key }, set.items[+i]) : null;
  }
  function stuckItems() {
    return Object.keys(progress.stuck || {}).map(itemByKey).filter(Boolean);
  }
  function saveProgress() { store.set('progress', progress); }

  // ── 읽어 주기 ──
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = settings.rate;
    const voices = speechSynthesis.getVoices().filter(v => /^en[-_]US/i.test(v.lang));
    u.voice = voices.find(v => /google/i.test(v.name)) || voices[0] || null;
    speechSynthesis.speak(u);
  }

  // ── 음성 인식 ──
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function listen(onText, onEnd) {
    if (!SR) { onEnd(null, 'unsupported'); return; }
    rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    let candidates = [], text = '', error = null;
    rec.onresult = e => {
      const rs = Array.from(e.results);
      text = rs.map(r => r[0].transcript).join(' ').trim();
      // 한 덩어리로 들은 경우 인식 후보 여러 개를 모두 채점에 쓴다
      candidates = rs.length === 1 ? Array.from(rs[0]).map(a => a.transcript.trim()) : [text];
      onText(text);
    };
    rec.onerror = e => { error = e.error; };
    rec.onend = () => { rec = null; onEnd(text ? { text, candidates } : null, error); };
    try { rec.start(); } catch (e) { rec = null; onEnd(null, 'start'); }
  }
  function stopListening() { if (rec) rec.stop(); }

  const MIC_ERRORS = {
    'not-allowed': '마이크 사용이 막혀 있어요. 주소창 옆 자물쇠 → 권한에서 마이크를 허용해 주세요.',
    'service-not-allowed': '마이크 사용이 막혀 있어요. 크롬으로 열었는지 확인해 주세요.',
    'no-speech': '소리가 안 들렸어요. 버튼을 누르고 바로 말해 보세요.',
    'audio-capture': '마이크를 찾지 못했어요.',
    'network': '음성 인식은 인터넷 연결이 필요해요.',
    'unsupported': '이 브라우저는 음성 인식을 지원하지 않아요. 크롬으로 열거나 아래 ⌨️ 입력하기를 써 주세요.'
  };

  // ── 연습 세션 ──
  // mode: 'drill' 한국어 보고 말하기 / 'memo' 단계별 외우기(보고 읽기 → 빈칸 늘리기 → 한국어만)
  let session = null; // { mode, title, back, items, i, card, results: [] }
  function startSession(title, items, back, mode = 'drill') {
    session = { mode, title, back, items, i: 0, results: [], card: newCard() };
    location.hash = '#drill';
    render();
  }
  function newCard(level = 0) { return { phase: 'ask', spoken: '', result: null, typing: false, msg: '', level, live: [] }; }
  const MEMO_STEPS = ['보고 읽기', '빈칸 조금', '빈칸 많이', '한국어만'];

  // ── 앱 설치 ──
  // 크롬은 설치할 수 있을 때 beforeinstallprompt를 보낸다. 받아 두었다가 버튼을 누르면 띄운다
  let installEvent = null;
  const installed = () => matchMedia('(display-mode: standalone)').matches;
  const UA = navigator.userAgent;
  const isAndroid = /Android/i.test(UA);
  // 카톡·네이버 등 앱 안 브라우저, 삼성 인터넷은 설치·음성 인식이 안 되거나 불안정하다
  const notChrome = /SamsungBrowser|KAKAOTALK|NAVER|Line\/|Instagram|FBAN|FBAV|Whale|EdgA|OPR|; wv\)/i.test(UA) || !/Chrome\//.test(UA);
  // 안드로이드에서 크롬으로 바로 여는 주소
  const chromeUrl = () => 'intent://' + location.host + location.pathname + '#Intent;scheme=https;package=com.android.chrome;end';
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installEvent = e;
    if (!location.hash) render();
  });
  window.addEventListener('appinstalled', () => { installEvent = null; render(); });

  function installBanner() {
    if (installed()) return '';
    if (isAndroid && notChrome) return `<a class="banner install" href="${chromeUrl()}">🌐 <span><b>크롬으로 열기</b><small>지금 브라우저에서는 설치와 음성 인식이 잘 안 돼요</small></span></a>`;
    if (installEvent) return `<button class="banner install" data-act="install">📲 <span><b>핸드폰에 앱으로 설치</b><small>홈 화면에서 바로 열 수 있어요</small></span></button>`;
    if (isAndroid) return `<div class="banner warn">📲 <b>앱으로 설치하기</b>: 오른쪽 위 <b>⋮</b> → <b>홈 화면에 추가</b> → <b>설치</b></div>`;
    return '';
  }

  // ── 화면들 ──
  function header(title, back) {
    return `<header class="top">
      ${back ? `<a class="back" href="${back}" aria-label="뒤로">‹</a>` : '<span class="brand">말문</span>'}
      <h1>${esc(title)}</h1>
      ${back ? '' : '<a class="icon-btn" href="#settings" aria-label="설정">⚙️</a>'}
    </header>`;
  }

  function viewHome() {
    const d = Core.daysUntil(settings.eventDate, today());
    const dday = d > 0 ? `D-${d}` : d === 0 ? 'D-DAY' : `D+${-d}`;
    const todayN = (progress.days || {})[today()] || 0;
    const st = Core.streak(progress.days || {}, today());
    const stuckN = stuckItems().length;
    return header('영어 말문 트기') + `
    <main>
      ${installBanner()}
      <section class="hero">
        <div class="dday">${dday}</div>
        <div class="hero-text"><b>${esc(settings.eventName)}</b><span>${esc(settings.eventDate.replace(/-/g, '.'))}</span></div>
      </section>
      <section class="stats">
        <div><b>${todayN}</b><span>오늘 말한 문장</span></div>
        <div><b>${st}</b><span>연속 연습일</span></div>
        <a href="#review" class="${stuckN ? 'has' : ''}"><b>${stuckN}</b><span>복습함 😅</span></a>
      </section>
      <h2 class="sec">상황별 말하기</h2>
      <section class="grid">
        ${SETS.map(s => {
          const total = s.items.length;
          const done = s.items.filter((_, i) => (progress.done || {})[s.id + ':' + i]).length;
          return `<a class="tile" href="#set/${s.id}">
            <span class="emoji">${s.emoji}</span>
            <b>${esc(s.title)}</b>
            <small>${esc(s.desc)}</small>
            <span class="bar"><i style="width:${Math.round(done / total * 100)}%"></i></span>
            <small class="count">${done}/${total}</small>
          </a>`;
        }).join('')}
        <a class="tile mine" href="#mine">
          <span class="emoji">✏️</span><b>내 문장</b><small>공개수업 대본 등 직접 추가</small>
          <small class="count">${mine.length}개</small>
        </a>
      </section>
      <p class="hint">한국어를 보고 <b>3초 안에</b> 영어로 말해 보세요. 완벽하지 않아도 뜻이 통하면 성공이에요.</p>
    </main>`;
  }

  function viewSet(id) {
    const set = SETS.find(s => s.id === id);
    if (!set) return viewHome();
    const items = setItems(set);
    return header(set.emoji + ' ' + set.title, '#') + `
    <main>
      <div class="actions">
        <button class="btn primary" data-act="start-set" data-id="${set.id}">🎤 순서대로 연습</button>
        <button class="btn" data-act="start-set" data-id="${set.id}" data-shuffle="1">🔀 섞어서</button>
      </div>
      <button class="btn memo-btn" data-act="start-memo" data-src="${set.id}">🧩 단계별 외우기 <small>보고 읽기 → 빈칸 채우기 → 한국어만</small></button>
      <ul class="list">${items.map(listRow).join('')}</ul>
    </main>`;
  }

  function listRow(it) {
    const mark = (progress.stuck || {})[it.key] ? '<span class="mark stuck">😅</span>' : (progress.done || {})[it.key] ? '<span class="mark ok">✓</span>' : '';
    return `<li>
      <div class="ko">${mark}${esc(it.ko)}</div>
      <div class="en"><button class="play" data-act="speak" data-text="${esc(it.en)}" aria-label="듣기">🔊</button>${esc(it.en)}</div>
    </li>`;
  }

  function viewReview() {
    const items = stuckItems();
    return header('😅 복습함', '#') + `
    <main>
      <p class="hint">막혔던 문장이 모여요. 두 번 말하면 빠져요.</p>
      ${items.length ? `<div class="actions"><button class="btn primary" data-act="start-review">🎤 복습 시작 (${items.length})</button></div>
        <ul class="list">${items.map(listRow).join('')}</ul>`
        : '<div class="empty">복습할 문장이 없어요 🎉</div>'}
    </main>`;
  }

  function viewMine() {
    return header('✏️ 내 문장', '#') + `
    <main>
      <p class="hint">공개수업 대본, 자기소개처럼 내가 꼭 말해야 할 문장을 넣어 두세요.</p>
      <form class="card form" data-form="mine">
        <label>한국어<input name="ko" required placeholder="예) 오늘은 한글에 대해 배울 거예요."></label>
        <label>영어<input name="en" required placeholder="예) Today we are going to learn about Hangeul." autocapitalize="sentences"></label>
        <label>도움말 (선택)<input name="tip" placeholder="막힐 때 볼 힌트"></label>
        <button class="btn primary">추가하기</button>
      </form>
      ${mine.length ? `<div class="actions"><button class="btn primary" data-act="start-mine">🎤 내 문장 연습 (${mine.length})</button></div>
      <button class="btn memo-btn" data-act="start-memo" data-src="mine">🧩 단계별 외우기 <small>보고 읽기 → 빈칸 채우기 → 한국어만</small></button>
      <ul class="list">${mineItems().map(it => listRow(it).replace('</li>', `<button class="del" data-act="del-mine" data-id="${esc(it.key.slice(5))}">삭제</button></li>`)).join('')}</ul>` : ''}
    </main>`;
  }

  function viewSettings() {
    const rates = [[0.75, '느리게'], [0.9, '보통'], [1.05, '빠르게']];
    return header('⚙️ 설정', '#') + `
    <main>
      <form class="card form" data-form="settings">
        <label>목표 행사 이름<input name="eventName" value="${esc(settings.eventName)}"></label>
        <label>날짜<input name="eventDate" type="date" value="${esc(settings.eventDate)}"></label>
        <button class="btn primary">저장</button>
      </form>
      <div class="card">
        <div class="label">읽어 주는 속도</div>
        <div class="seg">${rates.map(([r, n]) => `<button class="${settings.rate === r ? 'on' : ''}" data-act="rate" data-rate="${r}">${n}</button>`).join('')}</div>
        <button class="btn small" data-act="speak" data-text="Nice to meet you. Welcome to our school.">🔊 들어 보기</button>
      </div>
      <div class="card">
        <div class="label">연습 기록</div>
        <p class="hint">이 기기에만 저장돼요. 다른 기기와 공유되지 않아요.</p>
        <button class="btn danger" data-act="reset">연습 기록 지우기</button>
      </div>
      <p class="hint version">버전 ${esc(swVersion || '확인 중')}</p>
    </main>`;
  }

  function viewDrill() {
    if (!session) return viewHome();
    const s = session;
    if (s.i >= s.items.length) return viewSummary();
    const it = s.items[s.i], c = s.card;
    const pct = Math.round(s.i / s.items.length * 100);
    let body = '';
    if (c.phase === 'ask' || c.phase === 'listening') {
      body = `
        <button class="mic ${c.phase === 'listening' ? 'on' : ''}" data-act="mic" aria-label="말하기">🎤</button>
        <div class="mic-label">${c.phase === 'listening' ? '듣는 중이에요… 다 말하면 다시 누르세요' : '눌러서 영어로 말하기'}</div>
        <div class="spoken">${esc(c.spoken)}</div>
        ${c.msg ? `<div class="msg">${esc(c.msg)}</div>` : ''}
        ${c.typing ? `<form class="typing" data-form="type"><input name="t" autocomplete="off" autocapitalize="sentences" placeholder="영어로 입력" autofocus><button class="btn">확인</button></form>` : ''}
        <div class="row">
          <button class="btn ghost" data-act="reveal">정답 보기</button>
          ${c.typing ? '' : '<button class="btn ghost" data-act="type">⌨️ 입력하기</button>'}
        </div>`;
    } else {
      const r = c.result;
      const answers = [it.en, ...(it.alt || [])];
      const shown = r ? r.answer : it.en;
      const others = answers.filter(a => a !== shown);
      const v = r ? Core.verdict(r.score) : null;
      const label = { good: '👏 잘 말했어요!', close: '👍 거의 다 왔어요', retry: '💪 한 번 더 해 볼까요?' }[v];
      body = `
        ${c.spoken ? `<div class="said"><span>내가 한 말</span>${esc(c.spoken)}</div>` : ''}
        ${label ? `<div class="verdict ${v}">${label}</div>` : ''}
        <div class="answer">
          <button class="play" data-act="speak" data-text="${esc(shown)}" aria-label="듣기">🔊</button>
          <span>${r ? r.words.map(w => `<span class="${w.hit ? 'hit' : 'miss'}">${esc(w.w)}</span>`).join(' ') : esc(shown)}</span>
        </div>
        ${others.length ? `<div class="alts"><span>이렇게 말해도 돼요</span>${others.map(a => `<div><button class="play" data-act="speak" data-text="${esc(a)}">🔊</button>${esc(a)}</div>`).join('')}</div>` : ''}
        ${it.tip ? `<div class="tip">💡 ${esc(it.tip)}</div>` : ''}
        ${v && v !== 'good' ? '<p class="hint">다른 말로 뜻이 통했다면 그것도 성공이에요.</p>' : ''}
        <button class="btn ghost" data-act="again">🎤 다시 말하기</button>
        <div class="rate">
          <button class="btn ok" data-act="judge" data-ok="1">😊 말할 수 있어요</button>
          <button class="btn stuck" data-act="judge" data-ok="0">😅 막혔어요</button>
        </div>`;
    }
    return header(s.title, s.back) + `
    <main class="drill">
      <div class="progress"><span class="bar"><i style="width:${pct}%"></i></span><small>${s.i + 1} / ${s.items.length}</small></div>
      <section class="card prompt">
        <div class="ko big">${esc(it.ko)}</div>
        ${c.phase === 'ask' && it.tip && c.showTip ? `<div class="tip">💡 ${esc(it.tip)}</div>` : ''}
        ${c.phase === 'ask' && it.tip && !c.showTip ? '<button class="link" data-act="tip">💡 힌트</button>' : ''}
      </section>
      <section class="drill-body">${body}</section>
    </main>`;
  }

  // 빈칸 문장. hits: 말해서 맞힌 낱말(채점 순서와 같음)
  function clozeHtml(it, c) {
    const hits = c.result ? c.result.words.map(w => w.hit) : c.live;
    return Core.clozeMask(it.en, c.level).map((m, i) => {
      if (!m.hidden) return `<span class="${c.result && !hits[i] ? 'miss' : ''}">${esc(m.w)}</span>`;
      if (hits[i]) return `<span class="filled">${esc(m.w)}</span>`;
      if (c.peek || c.result) return `<span class="peek">${esc(m.w)}</span>`;
      const [, pre, word, post] = m.w.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
      return `${esc(pre)}<span class="blank" style="width:${Math.max(1.6, word.length * 0.62)}em"></span>${esc(post)}`;
    }).join(' ');
  }

  function viewMemo() {
    const s = session;
    if (s.i >= s.items.length) return viewSummary();
    const it = s.items[s.i], c = s.card, lv = c.level;
    const pct = Math.round(s.i / s.items.length * 100);
    const last = lv === Core.MEMO_LEVELS - 1;
    let body;
    if (c.phase !== 'result') {
      body = `
        <button class="mic ${c.phase === 'listening' ? 'on' : ''}" data-act="mic" aria-label="말하기">🎤</button>
        <div class="mic-label">${c.phase === 'listening' ? '듣는 중이에요… 다 말하면 다시 누르세요' : lv === 0 ? '눌러서 소리 내어 읽기' : '눌러서 문장 전체 말하기'}</div>
        <div class="spoken">${esc(c.spoken)}</div>
        ${c.msg ? `<div class="msg">${esc(c.msg)}</div>` : ''}
        ${c.typing ? `<form class="typing" data-form="type"><input name="t" autocomplete="off" autocapitalize="sentences" placeholder="영어로 입력" autofocus><button class="btn">확인</button></form>` : ''}
        <div class="row">
          ${lv > 0 && !c.peek ? '<button class="btn ghost" data-act="peek">👀 살짝 보기</button>' : ''}
          ${c.typing ? '' : '<button class="btn ghost" data-act="type">⌨️ 입력하기</button>'}
        </div>`;
    } else {
      const v = Core.verdict(c.result.score);
      const pass = v === 'good';
      const label = { good: '👏 잘 말했어요!', close: '👍 거의 다 왔어요', retry: '💪 한 번 더 해 볼까요?' }[v];
      const nextLabel = last ? '다음 문장 ▶' : `다음 단계: ${MEMO_STEPS[lv + 1]} ▶`;
      body = `
        <div class="said"><span>내가 한 말</span>${esc(c.spoken)}</div>
        <div class="verdict ${v}">${label}</div>
        ${it.tip ? `<div class="tip">💡 ${esc(it.tip)}</div>` : ''}
        ${pass
          ? `<button class="btn primary wide" data-act="memo-next">${nextLabel}</button>
             <button class="btn ghost" data-act="memo-again">🎤 한 번 더</button>`
          : `<button class="btn primary wide" data-act="memo-again">🎤 다시 말하기</button>
             <button class="btn ghost" data-act="memo-next">${last ? '넘어가기 (복습함에 넣기)' : '그래도 다음 단계로'}</button>`}`;
    }
    return header(s.title, s.back) + `
    <main class="drill">
      <div class="progress"><span class="bar"><i style="width:${pct}%"></i></span><small>${s.i + 1} / ${s.items.length}</small></div>
      <ol class="steps">${MEMO_STEPS.map((n, i) => `<li class="${i < lv ? 'done' : i === lv ? 'on' : ''}">${n}</li>`).join('')}</ol>
      <section class="card prompt memo">
        <div class="ko ${last ? 'big' : 'small'}">${esc(it.ko)}</div>
        <div class="cloze ${last ? 'small' : ''}">${clozeHtml(it, c)}</div>
        ${lv === 0 || c.phase === 'result' ? `<button class="play" data-act="speak" data-text="${esc(it.en)}" aria-label="듣기">🔊</button>` : ''}
      </section>
      <section class="drill-body">${body}</section>
    </main>`;
  }

  function viewSummary() {
    const s = session;
    const ok = s.results.filter(r => r.ok).length;
    const stuck = s.results.filter(r => !r.ok);
    return header(s.title, s.back) + `
    <main>
      <section class="card summary">
        <div class="big-emoji">${stuck.length ? '💪' : '🎉'}</div>
        <h2>${s.results.length}문장 연습 끝!</h2>
        <p>😊 말한 문장 <b>${ok}</b> · 😅 막힌 문장 <b>${stuck.length}</b></p>
        ${stuck.length ? '<p class="hint">막힌 문장은 복습함에 넣어 두었어요.</p>' : ''}
      </section>
      <div class="actions col">
        ${stuck.length ? '<button class="btn primary" data-act="retry-stuck">😅 막힌 문장만 다시</button>' : ''}
        <a class="btn" href="${s.back}">목록으로</a>
        <a class="btn ghost" href="#">처음 화면</a>
      </div>
    </main>`;
  }

  // ── 그리기 ──
  function render() {
    const h = location.hash.slice(1);
    const [route, arg] = h.split('/');
    let html;
    if (route === 'set') html = viewSet(arg);
    else if (route === 'review') html = viewReview();
    else if (route === 'mine') html = viewMine();
    else if (route === 'settings') html = viewSettings();
    else if (route === 'drill') html = session && session.mode === 'memo' ? viewMemo() : viewDrill();
    else html = viewHome();
    app.innerHTML = html;
    const auto = app.querySelector('[autofocus]');
    if (auto) auto.focus();
  }

  // ── 연습 동작 ──
  function showResult(spoken, candidates) {
    const it = session.items[session.i];
    // 단계별 외우기는 빈칸이 대표 답에 걸려 있어서 대표 답하고만 비교한다
    const answers = session.mode === 'memo' ? [it.en] : [it.en, ...(it.alt || [])];
    let best = null, bestText = spoken;
    for (const cand of candidates) {
      const r = Core.compare(cand, answers);
      if (!best || r.score > best.score) { best = r; bestText = cand; }
    }
    Object.assign(session.card, { phase: 'result', spoken: bestText, result: best });
    render();
  }

  function onMic() {
    const c = session.card;
    if (c.phase === 'listening') { stopListening(); return; }
    speechSynthesis && speechSynthesis.cancel();
    Object.assign(c, { phase: 'listening', spoken: '', msg: '' });
    render();
    listen(text => {
      c.spoken = text;
      const el = app.querySelector('.spoken');
      if (el) el.textContent = text;
      // 말하는 동안 맞힌 낱말이 빈칸에 바로 채워진다
      const cz = app.querySelector('.cloze');
      if (cz && session.mode === 'memo') {
        const it = session.items[session.i];
        c.live = Core.compareOne(text, it.en).words.map(w => w.hit);
        cz.innerHTML = clozeHtml(it, c);
      }
    }, (res, err) => {
      if (session.card !== c) return;
      if (res) { showResult(res.text, res.candidates); return; }
      c.phase = 'ask';
      c.msg = MIC_ERRORS[err] || (err ? '음성 인식이 멈췄어요. 다시 눌러 주세요.' : MIC_ERRORS['no-speech']);
      if (err === 'unsupported') c.typing = true;
      render();
    });
  }

  function judge(ok) {
    const it = session.items[session.i];
    Core.recordResult(progress, it.key, ok, today());
    saveProgress();
    session.results.push({ key: it.key, ok });
    session.i++;
    session.card = newCard();
    render();
    window.scrollTo(0, 0);
  }

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'speak') speak(b.dataset.text);
    else if (act === 'install' && installEvent) {
      installEvent.prompt();
      installEvent.userChoice.finally(() => { installEvent = null; render(); });
    }
    else if (act === 'start-set') {
      const set = SETS.find(s => s.id === b.dataset.id);
      let items = setItems(set);
      if (b.dataset.shuffle) items = Core.shuffle(items);
      startSession(set.emoji + ' ' + set.title, items, '#set/' + set.id);
    }
    else if (act === 'start-review') startSession('😅 복습', Core.shuffle(stuckItems()), '#review');
    else if (act === 'start-mine') startSession('✏️ 내 문장', mineItems(), '#mine');
    else if (act === 'start-memo') {
      const src = b.dataset.src;
      if (src === 'mine') startSession('🧩 내 문장 외우기', mineItems(), '#mine', 'memo');
      else {
        const set = SETS.find(s => s.id === src);
        startSession('🧩 ' + set.title, setItems(set), '#set/' + set.id, 'memo');
      }
    }
    else if (act === 'retry-stuck') {
      const items = session.results.filter(r => !r.ok).map(r => session.items.find(it => it.key === r.key));
      startSession(session.title, items, session.back, session.mode);
    }
    else if (act === 'peek') { session.card.peek = true; render(); }
    else if (act === 'memo-again') { session.card = newCard(session.card.level); render(); onMic(); }
    else if (act === 'memo-next') {
      const c = session.card;
      const pass = !!c.result && Core.verdict(c.result.score) === 'good';
      if (c.level < Core.MEMO_LEVELS - 1) { session.card = newCard(c.level + 1); render(); }
      else judge(pass);
    }
    else if (act === 'mic') onMic();
    else if (act === 'tip') { session.card.showTip = true; render(); }
    else if (act === 'type') { session.card.typing = true; render(); }
    else if (act === 'reveal') { stopListening(); Object.assign(session.card, { phase: 'result', result: null, spoken: '' }); render(); }
    else if (act === 'again') { session.card = newCard(); render(); onMic(); }
    else if (act === 'judge') judge(b.dataset.ok === '1');
    else if (act === 'rate') { settings.rate = +b.dataset.rate; store.set('settings', settings); render(); }
    else if (act === 'reset') {
      if (confirm('연습 기록(진도·복습함·연속일)을 지울까요? 내 문장은 남아요.')) {
        progress = { stuck: {}, done: {}, days: {} }; saveProgress(); render();
      }
    }
    else if (act === 'del-mine') {
      if (confirm('이 문장을 지울까요?')) {
        mine = mine.filter(m => m.id !== b.dataset.id); store.set('mine', mine);
        delete progress.stuck['mine:' + b.dataset.id]; saveProgress(); render();
      }
    }
  });

  app.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, kind = f.dataset.form, data = Object.fromEntries(new FormData(f));
    if (kind === 'type') {
      const t = (data.t || '').trim();
      if (t) showResult(t, [t]);
    } else if (kind === 'mine') {
      mine.push({ id: Date.now().toString(36), ko: data.ko.trim(), en: data.en.trim(), tip: (data.tip || '').trim() });
      store.set('mine', mine); render();
    } else if (kind === 'settings') {
      settings.eventName = data.eventName.trim() || DEFAULT_SETTINGS.eventName;
      settings.eventDate = data.eventDate || DEFAULT_SETTINGS.eventDate;
      store.set('settings', settings);
      location.hash = '';
    }
  });

  window.addEventListener('hashchange', () => { stopListening(); render(); window.scrollTo(0, 0); });
  // 크롬은 목소리 목록을 늦게 불러온다
  if ('speechSynthesis' in window) speechSynthesis.getVoices();

  if (location.hash === '#drill') location.hash = '';
  render();

  // 앱을 켤 때마다 새 버전을 확인하고, 새 서비스 워커가 자리 잡으면 한 번 새로 고친다
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => reg.update()).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded || session) return; // 연습 도중에는 끊지 않는다
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data && e.data.version) { swVersion = e.data.version; if (location.hash === '#settings') render(); }
    });
    navigator.serviceWorker.ready.then(reg => reg.active && reg.active.postMessage('version'));
  }
})();
