// ════════════════════════════════════════════════════
//  말문 · 핵심 계산 — 말한 문장 비교, 복습함, 날짜 계산
//  화면·저장소와 무관한 순수 함수만 둔다 (node 테스트: tests/core.test.js)
// ════════════════════════════════════════════════════
(function (root) {
  const CONTRACTIONS = {
    "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
    "it's": 'it is', "that's": 'that is', "what's": 'what is', "here's": 'here is',
    "there's": 'there is', "let's": 'let us', "he's": 'he is', "she's": 'she is',
    "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not',
    "aren't": 'are not', "can't": 'can not', "cannot": 'can not', "won't": 'will not',
    "i'll": 'i will', "we'll": 'we will', "you'll": 'you will', "it'll": 'it will',
    "i'd": 'i would', "i've": 'i have', "we've": 'we have', "ok": 'okay'
  };
  const NUMBERS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50
  };

  // 한 단어(공백 없는 조각)를 비교용 낱말들로 바꾼다. "I'm" → ['i','am'], "Ten," → ['10']
  function wordTokens(word) {
    let w = String(word).toLowerCase().replace(/[‘’`]/g, "'").replace(/[^a-z0-9']/g, '');
    if (!w) return [];
    if (CONTRACTIONS[w]) return CONTRACTIONS[w].split(' ');
    w = w.replace(/'/g, '');
    if (!w) return [];
    if (w in NUMBERS) return [String(NUMBERS[w])];
    return [w];
  }

  function splitWords(text) {
    // 2:30, 3-4 같은 것도 낱말로 나눈다
    return String(text || '').replace(/[:\-–—/]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function tokenize(text) {
    return splitWords(text).flatMap(wordTokens);
  }

  // 말한 문장을 정답 하나와 비교. words: 화면에 보여 줄 정답 낱말과 맞췄는지
  function compareOne(spoken, answer) {
    const said = new Set(tokenize(spoken));
    let hit = 0, total = 0;
    const words = splitWords(answer).map(w => {
      const toks = wordTokens(w);
      if (!toks.length) return { w, hit: true };
      const ok = toks.every(t => said.has(t));
      total += toks.length;
      if (ok) hit += toks.length;
      return { w, hit: ok };
    });
    return { answer, score: total ? hit / total : 0, words };
  }

  // 대표 답과 다른 표현들 가운데 가장 가까운 것을 고른다
  function compare(spoken, answers) {
    let best = null;
    for (const a of answers) {
      const r = compareOne(spoken, a);
      if (!best || r.score > best.score) best = r;
    }
    return best;
  }

  function verdict(score) {
    if (score >= 0.8) return 'good';
    if (score >= 0.5) return 'close';
    return 'retry';
  }

  // 복습함: 막힌 문장은 2번 성공해야 빠진다
  const REVIEW_NEEDED = 2;
  function recordResult(progress, key, ok, today) {
    const p = progress;
    p.stuck = p.stuck || {};
    p.done = p.done || {};
    p.days = p.days || {};
    if (ok) {
      p.done[key] = (p.done[key] || 0) + 1;
      if (p.stuck[key]) {
        p.stuck[key] -= 1;
        if (p.stuck[key] <= 0) delete p.stuck[key];
      }
    } else {
      p.stuck[key] = REVIEW_NEEDED;
    }
    if (today) p.days[today] = (p.days[today] || 0) + 1;
    return p;
  }

  function dateKey(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseDate(s) {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function daysUntil(target, today) {
    const ms = parseDate(target) - parseDate(today);
    return Math.round(ms / 86400000);
  }

  // 오늘(또는 어제)까지 이어서 연습한 날 수
  function streak(days, today) {
    let d = parseDate(today);
    if (!days[dateKey(d)]) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days[dateKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // 단계별 외우기: 단계가 오를수록 빈칸이 늘어난다
  // 0 전체 보기 / 1 중요한 낱말 절반(긴 것부터) / 2 중요한 낱말 전부 / 3 전부 빈칸
  const SMALL = new Set(('a an the to of in on at for and or but with from by about as is are am be was were do does did not ' +
    'i you we they he she it me us them my your our their this that these those please let can will would could shall so').split(' '));
  const MEMO_LEVELS = 4;
  function clozeMask(answer, level) {
    const words = splitWords(answer);
    const toks = words.map(wordTokens);
    const content = words.map((_, i) => i).filter(i => toks[i].length && !toks[i].every(t => SMALL.has(t)));
    const hide = new Set();
    if (level === 1) {
      const len = i => words[i].replace(/[^A-Za-z0-9]/g, '').length;
      content.slice().sort((a, b) => len(b) - len(a) || a - b)
        .slice(0, Math.ceil(content.length / 2)).forEach(i => hide.add(i));
    } else if (level === 2) {
      content.forEach(i => hide.add(i));
    } else if (level >= 3) {
      words.forEach((_, i) => { if (toks[i].length) hide.add(i); });
    }
    return words.map((w, i) => ({ w, hidden: hide.has(i) }));
  }

  function shuffle(arr, rand = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const Core = { tokenize, compare, compareOne, verdict, recordResult, REVIEW_NEEDED, dateKey, daysUntil, streak, shuffle, clozeMask, MEMO_LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof window !== 'undefined' ? window : globalThis);
