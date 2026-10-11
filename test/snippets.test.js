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

test('rn-ctx mirrors the name and the setter', () => {
  const code = renderSnippet(get('rn-ctx').body, { 1: 'Auth', 2: 'user', 3: 'User | null', 4: 'setUser', 5: 'null' });
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

test('installRules creates, merges and is idempotent', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { installRules } = require('../lib/install');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-rules-'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Team rules\n\nBe nice.\n');

  const first = installRules(root, ['agents', 'cursor', 'copilot']);
  assert.deepStrictEqual(first.map((r) => r.action), ['updated', 'created', 'created']);
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /^# Team rules\n\nBe nice\.\n\n<!-- rn-snippets:start -->/);
  assert.ok(fs.existsSync(path.join(root, '.cursor/rules/react-native-snippets.mdc')));
  assert.ok(fs.existsSync(path.join(root, '.github/copilot-instructions.md')));

  const second = installRules(root, ['agents', 'cursor', 'copilot']);
  assert.deepStrictEqual(second.map((r) => r.action), ['unchanged', 'unchanged', 'unchanged']);
  fs.rmSync(root, { recursive: true });
});

test('tabStops ignores folder-name and mirrored transforms', () => {
  assert.deepStrictEqual(tabStops(get('rn').body), {});
  assert.deepStrictEqual(tabStops(get('rn-ctx').body), { 1: 'Name', 2: 'value', 3: 'string', 4: 'setValue', 5: "''" });
});

test('MCP server answers initialize, tools/list and tools/call', async () => {
  const { spawn } = require('child_process');
  const path = require('path');
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'mcp', 'server.js')]);
  const lines = [];
  child.stdout.on('data', (d) => lines.push(...d.toString().split('\n').filter(Boolean)));
  const send = (m) => child.stdin.write(JSON.stringify(m) + '\n');
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_snippet', arguments: { prefix: 'rn-props', componentName: 'Header' } } });
  send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_snippet', arguments: { prefix: 'missing' } } });
  child.stdin.end();
  await new Promise((r) => child.on('close', r));

  const res = Object.fromEntries(lines.map((l) => JSON.parse(l)).map((m) => [m.id, m]));
  assert.strictEqual(Object.keys(res).length, 4, 'notifications get no reply');
  assert.strictEqual(res[1].result.protocolVersion, '2025-06-18');
  assert.deepStrictEqual(res[2].result.tools.map((t) => t.name), ['list_snippets', 'get_snippet']);
  assert.match(res[3].result.content[0].text, /export function Header\(\{ title \}: Props\)/);
  assert.strictEqual(res[4].result.isError, true);
});

test('detects React Native projects and existing AI rules', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { isReactNativeProject, hasAiRules } = require('../lib/detect');
  const { installRules } = require('../lib/install');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-detect-'));
  assert.strictEqual(isReactNativeProject(root), false, 'no package.json');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { react: '19' } }));
  assert.strictEqual(isReactNativeProject(root), false);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { expo: '~55.0.0' } }));
  assert.strictEqual(isReactNativeProject(root), true);
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Team rules\n');
  assert.strictEqual(hasAiRules(root), false, 'AGENTS.md without our section');
  installRules(root, ['agents']);
  assert.strictEqual(hasAiRules(root), true);
  fs.rmSync(root, { recursive: true });
});

test('excludeLocally hides only the given files, once, and follows .git files', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { excludeLocally, findGitDir } = require('../lib/gitexclude');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-git-'));
  assert.strictEqual(excludeLocally(root, ['AGENTS.md']), null, 'not a git repo');

  fs.mkdirSync(path.join(root, '.git', 'info'), { recursive: true });
  fs.writeFileSync(path.join(root, '.git', 'info', 'exclude'), '# git ls-files --others --exclude-from=.git/info/exclude\n');
  assert.deepStrictEqual(excludeLocally(root, ['CLAUDE.md', path.join('.cursor', 'rules', 'react-native-snippets.mdc')]),
    ['/CLAUDE.md', '/.cursor/rules/react-native-snippets.mdc']);
  assert.deepStrictEqual(excludeLocally(root, ['CLAUDE.md']), [], 'idempotent');
  const text = fs.readFileSync(path.join(root, '.git', 'info', 'exclude'), 'utf8');
  assert.match(text, /^# git ls-files/);
  assert.strictEqual(text.split('React Native Snippets').length, 2, 'header written once');

  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-wt-'));
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${path.join(root, '.git')}\n`);
  assert.strictEqual(findGitDir(wt), path.join(root, '.git'));
  fs.rmSync(root, { recursive: true });
  fs.rmSync(wt, { recursive: true });
});

test('native Copilot tools are declared in package.json and match the shared answers', () => {
  const pkg = require('../package.json');
  const { getSnippetText, listSnippetsText, GET_SCHEMA } = require('../lib/tools');
  const names = pkg.contributes.languageModelTools.map((t) => t.name);
  assert.deepStrictEqual(names, ['rnSnippets_listSnippets', 'rnSnippets_getSnippet']);
  assert.deepStrictEqual(pkg.contributes.languageModelTools[1].inputSchema, GET_SCHEMA, 'schema in package.json is up to date');
  const { DESCRIPTIONS } = require('../lib/tools');
  assert.strictEqual(pkg.contributes.languageModelTools[0].modelDescription, DESCRIPTIONS.list);
  assert.strictEqual(pkg.contributes.languageModelTools[1].modelDescription, DESCRIPTIONS.get);
  assert.strictEqual(pkg.contributes.mcpServerDefinitionProviders, undefined, 'no duplicate MCP tools in VS Code');
  assert.match(listSnippetsText(), /- rn-ctx: /);
  assert.match(getSnippetText({ prefix: 'rn-ctx', values: { 1: 'Auth' } }), /export function useAuth\(\)/);
  assert.match(getSnippetText({ prefix: 'rn-ctx' }), /const \[value, setValue\] = useState<string>\(''\);/, 'defaults never produce "setvalue"');
});

test('extension activates and every command runs against a stubbed VS Code', async () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const Module = require('module');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-ext-'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { expo: '55' } }));
  const commands = {};
  const executed = [];
  const tools = {};
  class Part { constructor(v) { this.value = v; } }
  class Result { constructor(c) { this.content = c; } }
  const vscode = {
    env: { language: 'pt-br', clipboard: { writeText: async () => {} } },
    Position: class {}, Selection: class {}, LanguageModelTextPart: Part, LanguageModelToolResult: Result,
    lm: { registerTool: (name, impl) => { tools[name] = impl; return { dispose() {} }; } },
    workspace: { workspaceFolders: [{ uri: { fsPath: root } }], openTextDocument: async (o) => o },
    window: {
      createOutputChannel: () => ({ appendLine() {}, dispose() {} }),
      showInformationMessage: async () => undefined, showWarningMessage: async () => undefined,
      showErrorMessage: async (m) => { throw new Error(m); },
      showQuickPick: async (items) => items.filter ? items.filter((i) => i.picked) : undefined,
      showTextDocument: async () => ({}), showWorkspaceFolderPick: async () => undefined,
    },
    commands: {
      registerCommand: (id, fn) => { commands[id] = fn; return { dispose() {} }; },
      executeCommand: async (id) => { executed.push(id); },
    },
    Uri: { file: (f) => f },
  };
  const store = () => { const m = {}; return { get: (k) => m[k], update: async (k, v) => { m[k] = v; } }; };
  const load = Module._load;
  Module._load = function (request, ...rest) { return request === 'vscode' ? vscode : load.call(this, request, ...rest); };
  try {
    delete require.cache[require.resolve('../extension.js')];
    const ext = require('../extension.js');
    ext.activate({ subscriptions: [], extensionPath: path.join(__dirname, '..'), globalState: store(), workspaceState: store() });
    await new Promise((r) => setTimeout(r, 20));
    const pkg = require('../package.json');
    for (const { command } of pkg.contributes.commands) {
      assert.ok(commands[command], `${command} is registered`);
      await commands[command]();
    }
    assert.ok(executed.includes('workbench.action.openWalkthrough'));
    assert.ok(fs.existsSync(path.join(root, 'AGENTS.md')), 'Add AI rules wrote files');
    for (const t of pkg.contributes.languageModelTools) assert.ok(tools[t.name], `${t.name} is registered`);
  } finally {
    Module._load = load;
    fs.rmSync(root, { recursive: true });
  }
});
