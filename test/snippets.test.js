'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadSnippets, renderSnippet, tabStops } = require('../lib/snippets');
const { rulesBody, mergeSection, markedSection, START, END } = require('../lib/rules');

const snippets = loadSnippets();
const get = (p) => snippets.find((s) => s.prefix === p);

test('loads every snippet with a unique prefix', () => {
  const prefixes = snippets.map((s) => s.prefix);
  assert.ok(prefixes.length >= 15);
  assert.strictEqual(new Set(prefixes).size, prefixes.length);
});

test('every snippet renders without leftover placeholders', () => {
  for (const s of snippets) {
    assert.doesNotMatch(renderSnippet(s.body), /\$\{|\$\d/, s.prefix);
  }
});

test('rn-ctx mirrors the name and capitalizes the setter', () => {
  const code = renderSnippet(get('rn-ctx').body, { 1: 'Auth', 2: 'user', 3: 'User | null', 4: 'null' });
  assert.match(code, /type AuthContextData = \{/);
  assert.match(code, /const \[user, setUser\] = useState<User \| null>\(null\);/);
  assert.match(code, /export function useAuth\(\)/);
});

test('component name comes from componentName', () => {
  assert.match(renderSnippet(get('rn').body, { componentName: 'Home' }), /export function Home\(\)/);
  assert.match(renderSnippet(get('rn').body), /export function ComponentName\(\)/);
});

test('tabStops lists defaults', () => {
  assert.deepStrictEqual(tabStops(get('ust').body), { 1: 'state', 2: 'setState', 3: '' });
});

test('rules cover every snippet', () => {
  const body = rulesBody();
  for (const s of snippets) assert.ok(body.includes('`' + s.prefix + '`'), s.prefix);
});

test('mergeSection appends once and replaces on re-run', () => {
  const first = mergeSection('# My project\n', markedSection('old\n'));
  assert.ok(first.startsWith('# My project\n\n' + START));
  const second = mergeSection(first, markedSection('new\n'));
  assert.strictEqual(second.split(START).length, 2);
  assert.match(second, /new/);
  assert.doesNotMatch(second, /old/);
  assert.ok(second.trimEnd().endsWith(END));
});
