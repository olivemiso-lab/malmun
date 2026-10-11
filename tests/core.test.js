// 실행: node tests/core.test.js
const assert = require('assert');
const Core = require('../js/core.js');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { console.error('✗ ' + name + '\n  ' + e.message); process.exitCode = 1; }
}

test('축약형을 풀어서 비교', () => {
  assert.deepStrictEqual(Core.tokenize("I'm fine, let's go!"), ['i', 'am', 'fine', 'let', 'us', 'go']);
  assert.deepStrictEqual(Core.tokenize("Don't worry"), ['do', 'not', 'worry']);
  assert.deepStrictEqual(Core.tokenize("I can't"), Core.tokenize('I cannot'));
});

test('숫자는 글자·숫자 같게', () => {
  assert.strictEqual(Core.compare('we will start in ten minutes', ['We will start in 10 minutes.']).score, 1);
  assert.deepStrictEqual(Core.tokenize('around 2:30'), ['around', '2', '30']);
});

test('소유격 어포스트로피 무시', () => {
  assert.strictEqual(Core.compare("this is the teachers office", ["This is the teachers' office."]).score, 1);
  assert.strictEqual(Core.compare("let me tell you about todays schedule", ["Let me tell you about today's schedule."]).score, 1);
});

test('가장 가까운 다른 표현을 고름', () => {
  const r = Core.compare('well done', ['Great job!', 'Well done!']);
  assert.strictEqual(r.answer, 'Well done!');
  assert.strictEqual(r.score, 1);
});

test('일부만 맞으면 낱말별 표시', () => {
  const r = Core.compareOne('welcome to school', 'Welcome to our school.');
  assert.strictEqual(r.score, 0.75);
  assert.deepStrictEqual(r.words.map(w => w.hit), [true, true, false, true]);
  assert.strictEqual(Core.verdict(r.score), 'close');
  assert.strictEqual(Core.verdict(1), 'good');
  assert.strictEqual(Core.verdict(0.2), 'retry');
});

test('아무 말도 안 하면 0점', () => {
  assert.strictEqual(Core.compare('', ['Nice to meet you.']).score, 0);
});

test('복습함: 막히면 들어가고 두 번 성공하면 빠짐', () => {
  const p = {};
  Core.recordResult(p, 'a:1', false, '2026-10-11');
  assert.strictEqual(p.stuck['a:1'], 2);
  Core.recordResult(p, 'a:1', true, '2026-10-11');
  assert.strictEqual(p.stuck['a:1'], 1);
  Core.recordResult(p, 'a:1', true, '2026-10-12');
  assert.ok(!('a:1' in p.stuck));
  assert.strictEqual(p.done['a:1'], 2);
  assert.strictEqual(p.days['2026-10-11'], 2);
});

test('D-day 계산', () => {
  assert.strictEqual(Core.daysUntil('2026-10-23', '2026-10-11'), 12);
  assert.strictEqual(Core.daysUntil('2026-10-23', '2026-10-23'), 0);
  assert.strictEqual(Core.daysUntil('2026-11-02', '2026-10-30'), 3);
});

test('연속 연습일', () => {
  const days = { '2026-10-09': 3, '2026-10-10': 1, '2026-10-11': 5 };
  assert.strictEqual(Core.streak(days, '2026-10-11'), 3);
  assert.strictEqual(Core.streak(days, '2026-10-12'), 3); // 오늘 아직 안 했어도 어제까지 이어짐
  assert.strictEqual(Core.streak(days, '2026-10-14'), 0);
});

test('연습 문장: 빈 칸 없고, 대표 답을 그대로 말하면 만점', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const SETS = new Function(src + '; return SETS;')();
  const ids = new Set();
  for (const s of SETS) {
    assert.ok(!ids.has(s.id), '세트 id 중복: ' + s.id);
    ids.add(s.id);
    assert.ok(s.items.length > 0, s.id);
    for (const it of s.items) {
      assert.ok(it.ko && it.en, JSON.stringify(it));
      for (const a of [it.en, ...(it.alt || [])]) assert.strictEqual(Core.compare(a, [a]).score, 1, a);
    }
  }
});

console.log(`${passed}개 통과` + (process.exitCode ? ' (실패 있음)' : ''));
