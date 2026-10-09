'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const DOCS = path.join(__dirname, '../docs');
const KEY = 'ml4t-exam1-v2';
const files = ['exam-logic.js', 'exam-data.js', 'calendar-data.js', 'study-planner.js'];
const source = name => fs.readFileSync(path.join(DOCS, name), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function loadContent(context = {window: {}}) {
  vm.createContext(context);
  for (const file of files) vm.runInContext(source(file), context, {filename: file});
  return context;
}

const content = loadContent();
const E = content.window.EXAM;
const P = content.window.StudyPlanner;
const days = P.buildDays(E);
const byId = Object.fromEntries(E.questions.map(q => [q.id, q]));
const expectedDates = Array.from({length: 10}, (_, i) => `2026-10-${String(i + 9).padStart(2, '0')}`);
assert.deepEqual(plain(days.map(d => d.date)), expectedDates);
assert.equal(P.START, expectedDates[0]);
assert.equal(P.DEADLINE, expectedDates.at(-1));
assert.equal(P.daysBetween(P.START, P.DEADLINE), 9);
assert.equal(P.currentDate('2026-10-01'), P.START);
assert.equal(P.currentDate('2026-10-12'), '2026-10-12');
assert.equal(P.currentDate('2026-11-01'), P.DEADLINE);

// The seven learning days must cover every domain and every group exactly once.
const learn = days.slice(0, 7);
const domainIds = learn.flatMap(d => d.domains);
assert.equal(domainIds.length, 20);
assert.equal(new Set(domainIds).size, 20);
assert.deepEqual([...domainIds].sort(), Array.from(E.domains, d => d.id).sort());
const assignedIds = learn.flatMap(d => d.representativeQuestionIds);
assert.equal(assignedIds.length, 135);
assert.equal(new Set(assignedIds).size, 135);
const expectedGroups = new Set(E.domains.flatMap(d => d.groups.map(g => `${d.id}:G${g.number}`)));
const actualGroups = [];
for (const day of learn) {
  assert.equal(day.groups.length, day.topicGroupCount, day.date);
  assert.equal(day.representativeQuestionIds.length, day.topicGroupCount, day.date);
  assert.deepEqual(plain(day.tasks.find(t => t.type === 'practice').ids), plain(day.representativeQuestionIds));
  for (const group of day.groups) {
    const q = byId[group.questionId];
    assert(q, `Unknown assigned question: ${group.questionId}`);
    assert.equal(q.domainId, group.domainId);
    assert.equal(q.group, group.group);
    assert(day.domains.includes(q.domainId));
    assert(day.representativeQuestionIds.includes(q.id));
    actualGroups.push(`${q.domainId}:G${q.group}`);
  }
}
assert.equal(actualGroups.length, 135);
assert.equal(new Set(actualGroups).size, 135);
assert.deepEqual(new Set(actualGroups), expectedGroups);
const mixed = days[7].tasks.find(t => t.type === 'practice');
assert.equal(mixed.ids.length, 20);
assert.equal(new Set(mixed.ids).size, 20);
assert.equal(new Set(mixed.ids.map(id => byId[id].domainId)).size, 20);
for (const id of mixed.ids) assert(!assignedIds.includes(id), `Mixed review repeats first-pass question ${id}`);
assert(days.slice(7).every(d => !d.domains.length));
assert.equal(new Set(days.flatMap(d => d.tasks.map(t => t.id))).size, 39);

// Calendar positions use date components; locale and DST cannot move a day.
const cells = P.calendarCells(days);
assert.equal(cells.length, 35);
assert(cells.slice(0, 4).every(cell => cell === null));
assert.equal(cells[4].date, '2026-10-01');
assert.equal(cells[12].date, '2026-10-09');
assert.equal(cells[21].date, '2026-10-18');
assert.equal(cells.filter(cell => cell?.day).length, 10);
const tzProgram = `
  const fs=require('node:fs'),vm=require('node:vm');
  vm.runInThisContext(fs.readFileSync(process.argv[1],'utf8'));
  const P=globalThis.StudyPlanner;
  process.stdout.write(JSON.stringify({
    nearStart:P.localDate(new Date('2026-10-09T02:00:00Z')),
    nearEnd:P.localDate(new Date('2026-10-18T02:00:00Z')),
    spring:P.daysBetween('2026-03-07','2026-03-09'),
    autumn:P.daysBetween('2026-10-31','2026-11-02'),
    southernSpring:P.daysBetween('2026-10-03','2026-10-05'),
    formatted:P.formatDate('2026-10-18',{day:'numeric'})
  }));
`;
for (const [tz, start, end] of [
  ['UTC', '2026-10-09', '2026-10-18'],
  ['America/New_York', '2026-10-08', '2026-10-17'],
  ['America/Los_Angeles', '2026-10-08', '2026-10-17'],
  ['Asia/Tokyo', '2026-10-09', '2026-10-18'],
  ['Australia/Sydney', '2026-10-09', '2026-10-18'],
]) {
  const result = JSON.parse(execFileSync(process.execPath, ['-e', tzProgram, path.join(DOCS, 'study-planner.js')], {env: {...process.env, TZ: tz}, encoding: 'utf8'}));
  assert.equal(result.nearStart, start, tz);
  assert.equal(result.nearEnd, end, tz);
  assert.equal(result.spring, 2, tz);
  assert.equal(result.autumn, 2, tz);
  assert.equal(result.southernSpring, 2, tz);
  assert.equal(result.formatted, '18', tz);
}

// A checked answer counts as attempted, while manual completion is explicit.
const first = days[0];
const practice = first.tasks.find(t => t.type === 'practice');
const manual = first.tasks.find(t => t.type === 'manual');
const state = {records: {}, planner: {checks: {}}};
assert.deepEqual(plain(P.taskProgress(practice, state)), {n: 0, total: 12, done: false});
state.planner.checks[practice.id] = true;
assert.equal(P.taskProgress(practice, state).done, false, 'Practice cannot be checked off manually');
state.records[practice.ids[0]] = {exact: false};
assert.equal(P.taskProgress(practice, state).n, 1, 'A checked miss is still an attempt');
for (const id of practice.ids) state.records[id] = {exact: false};
assert.equal(P.taskProgress(practice, state).done, true);
assert.equal(P.taskProgress(manual, state).done, false, 'Quiz records cannot check off reading');
state.planner.checks[manual.id] = true;
assert.equal(P.dayProgress(first, state).n, 2);
const cleanPlanner = P.validateState({checks: {...state.planner.checks, bad: true, [first.tasks[2].id]: 'true'}}, days);
assert.deepEqual(plain(cleanPlanner), {checks: {[manual.id]: true}});
assert.deepEqual(plain(P.validateState(undefined, days)), {checks: {}});
assert.equal(P.summarize(days, state, '2026-10-09').overdue.length, 0);
assert.equal(P.summarize(days, state, '2026-10-10').overdue.length, 1);
for (const task of first.tasks.filter(t => t.type === 'manual')) state.planner.checks[task.id] = true;
assert.equal(P.dayProgress(first, state).done, true);
assert.equal(P.summarize(days, state, '2026-10-10').overdue.length, 0);
assert.equal(P.summarize(days, state, '2026-10-18').remainingDays, 0);

// Minimal DOM/event harness runs the unmodified app closure and user handlers.
// Layout and real browser accessibility remain separate manual checks.
function makeApp(initialState, hash = '#calendar/2026-10-09') {
  const storage = new Map(initialState ? [[KEY, JSON.stringify(initialState)]] : []);
  const documentEvents = {}, windowEvents = {}, elements = new Map(), downloads = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, {innerHTML: '', textContent: '', style: {}, focus() {}, scrollIntoView() {}, click() {}, showModal() {}, close() {}});
    return elements.get(id);
  };
  let currentHash = hash;
  const location = {};
  Object.defineProperty(location, 'hash', {get: () => currentHash, set(value) {currentHash = value.startsWith('#') ? value : '#' + value;}});
  const document = {
    getElementById: element,
    querySelector: () => ({focus() {}}),
    addEventListener: (type, handler) => {documentEvents[type] = handler;},
    createElement: () => {const anchor = {click() {downloads.push({href: anchor.href, filename: anchor.download});}}; return anchor;},
  };
  let exportedBlob;
  const ctx = loadContent({
    window: {addEventListener: (type, handler) => {windowEvents[type] = handler;}, scrollTo() {}, innerWidth: 1440},
    document, location,
    history: {replaceState(_state, _title, value) {currentHash = value;}},
    localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)},
    Blob,
    URL: {createObjectURL: blob => {exportedBlob = blob; return 'blob:test';}, revokeObjectURL() {}},
    setTimeout: () => 1, clearTimeout() {},
  });
  vm.runInContext(source('app.js'), ctx, {filename: 'app.js'});
  const flushRoute = () => windowEvents.hashchange();
  return {
    storage, downloads, html: () => element('app').innerHTML, elementHtml: id => element(id).innerHTML,
    snapshot: () => JSON.parse(storage.get(KEY)),
    exported: async () => JSON.parse(await exportedBlob.text()),
    navigate(value) {location.hash = value; flushRoute();},
    click(action, data = {}) {documentEvents.click({target: {closest: () => ({dataset: {action, ...data}})}}); flushRoute();},
    change(target) {documentEvents.change({target: {dataset: {}, ...target}});},
    async import(raw) {
      documentEvents.change({target: {id: 'import-file', dataset: {}, files: [{size: JSON.stringify(raw).length, text: () => Promise.resolve(JSON.stringify(raw))}]}});
      await new Promise(resolve => setImmediate(resolve));
    },
  };
}

async function integration() {
  const q = byId[practice.ids[0]];
  const picks = Object.fromEntries(Object.entries(q.key).map(([letter, key]) => [letter, key.selected]));
  const oldState = {
    version: 2,
    records: {[q.id]: {picks, exact: true, correct: 5, attempts: 4, time: 12345}},
    bookmarks: {[q.id]: true},
    session: null,
    filters: {subject: 'QF', domain: 'QF-D2', status: 'saved', query: 'Sharpe', group: 0},
    size: 10, shuffle: false,
  };
  const app = makeApp(oldState);
  assert.match(app.html(), /1 \/ 12 assigned questions checked/);
  app.change({dataset: {planCheck: manual.id}, checked: true});
  let current = app.snapshot();
  assert.deepEqual(current.records, oldState.records, 'Existing attempts survive planner migration');
  assert.deepEqual(current.bookmarks, oldState.bookmarks);
  assert.deepEqual(current.filters, oldState.filters);
  assert.equal(current.planner.checks[manual.id], true);
  assert.equal(current.size, 10);
  assert.equal(current.shuffle, false);
  app.change({dataset: {planCheck: practice.id}, checked: true});
  assert.equal(app.snapshot().planner.checks[practice.id], undefined);
  app.change({dataset: {planCheck: 'unknown-task'}, checked: true});
  assert.equal(app.snapshot().planner.checks['unknown-task'], undefined);

  // The assigned set ignores unrelated filters and only includes unchecked IDs.
  app.click('plan-practice', {task: practice.id});
  current = app.snapshot();
  assert.deepEqual(current.session.ids, plain(practice.ids.filter(id => id !== q.id)));
  assert.equal(current.session.ids.length, 11);
  assert.deepEqual(current.filters, {subject: 'all', domain: 'all', status: 'all', query: '', group: 0});
  assert.equal(current.session.calendarDate, '2026-10-09');
  const nextId = current.session.ids[0];
  app.click('check');
  assert(app.snapshot().records[nextId]);
  app.navigate('#calendar/2026-10-09');
  assert.match(app.html(), /2 \/ 12 assigned questions checked/);
  assert.match(app.html(), new RegExp(`data-plan-check="${manual.id}" checked`));

  app.click('plan-day', {date: '2026-10-16'});
  assert.match(app.html(), /Complete a 20-domain mixed round/);
  app.click('plan-practice', {task: mixed.id});
  assert.deepEqual(app.snapshot().session.ids, plain(mixed.ids));
  assert.equal(app.snapshot().session.calendarDate, '2026-10-16');
  app.click('plan-lab', {lab: 'sharpe'});
  assert.match(app.elementHtml('lab-output'), /Annualized Sharpe/);
  app.navigate('#home');
  app.click('export');
  const exported = await app.exported();
  assert.equal(app.downloads[0].filename, 'ml4t-exam1-progress.json');
  assert.equal(exported.planner.checks[manual.id], true);

  const reloaded = makeApp(exported);
  assert.match(reloaded.html(), /2 \/ 12 assigned questions checked/);
  assert.match(reloaded.html(), new RegExp(`data-plan-check="${manual.id}" checked`));
  const reloadedPractice = makeApp(exported, '#practice');
  assert.match(reloadedPractice.html(), /href="#calendar\/2026-10-16"/, 'Practice reload returns to its assigned study day');
  const friend = makeApp();
  assert.match(friend.html(), /0 \/ 12 assigned questions checked/, 'Separate browser starts independently');
  await friend.import(exported);
  assert.deepEqual(friend.snapshot().records, exported.records);
  assert.deepEqual(friend.snapshot().bookmarks, exported.bookmarks);
  assert.deepEqual(friend.snapshot().planner, exported.planner);
  const importedSession = friend.snapshot().session;
  for (const field of ['ids', 'index', 'done', 'orders', 'answers', 'calendarDate']) assert.deepEqual(importedSession[field], exported.session[field]);
  for (const id of importedSession.ids) for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    assert.equal(importedSession.picks[id][letter], exported.session.picks[id]?.[letter] === true);
  }
  friend.change({dataset: {planCheck: manual.id}, checked: false});
  assert.equal(friend.snapshot().planner.checks[manual.id], false);
  assert.equal(app.snapshot().planner.checks[manual.id], true, 'Another browser cannot change local progress');

  // Legacy progress imports remain valid after this calendar release.
  await friend.import(oldState);
  assert.deepEqual(friend.snapshot().planner, {checks: {}});
  assert.deepEqual(friend.snapshot().records, oldState.records);
  assert.deepEqual(friend.snapshot().bookmarks, oldState.bookmarks);
  friend.click('confirm-reset');
  assert.deepEqual(friend.snapshot().records, {});
  assert.deepEqual(friend.snapshot().bookmarks, {});
  assert.deepEqual(friend.snapshot().planner, {checks: {}});
}

integration().then(() => console.log('PASS: 10 dates, all 20 domains/135 groups, distinct 20-domain review, five timezones/DST, automatic/manual goals, legacy migration, quiz handlers, reload/export/import, independent local progress.')).catch(error => {console.error(error); process.exitCode = 1;});
