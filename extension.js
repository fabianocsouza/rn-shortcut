'use strict';

const path = require('path');
const vscode = require('vscode');
const { installRules, TARGETS } = require('./lib/install');
const { isReactNativeProject, hasAiRules } = require('./lib/detect');
const { findGitDir, excludeLocally } = require('./lib/gitexclude');

const DEFAULT_TARGETS = ['agents', 'cursor', 'copilot'];

// "Created: A. Updated: B. Already up to date: C." so a re-run with a
// different selection still makes clear which files were left alone.
function summarize(results, pt = isPt()) {
  const L = pt
    ? { created: 'Criados', updated: 'Atualizados', unchanged: 'Já estavam em dia', title: 'Regras de IA do React Native', none: 'As regras de IA já estão em dia.' }
    : { created: 'Created', updated: 'Updated', unchanged: 'Already up to date', title: 'React Native AI rules', none: 'AI rules are already up to date.' };
  const groups = ['created', 'updated', 'unchanged']
    .map((action) => [action, results.filter((r) => r.action === action).map((r) => r.file)])
    .filter(([, files]) => files.length);
  if (groups.length === 1 && groups[0][0] === 'unchanged') return L.none;
  return `${L.title}: ` + groups.map(([action, files]) => `${L[action]}: ${files.join(', ')}`).join('. ') + '.';
}

async function addAiRules() {
  const folder = (vscode.workspace.workspaceFolders || []).length > 1
    ? await vscode.window.showWorkspaceFolderPick({ placeHolder: 'Add the AI rules to which folder?' })
    : (vscode.workspace.workspaceFolders || [])[0];
  if (!folder) {
    vscode.window.showWarningMessage('Open a project folder first to add the React Native AI rules.');
    return;
  }

  const picked = await vscode.window.showQuickPick(
    TARGETS.map((t) => ({ label: t.label, description: t.file, detail: t.detail, id: t.id, picked: DEFAULT_TARGETS.includes(t.id) })),
    { canPickMany: true, title: 'React Native Snippets: Add AI rules', placeHolder: 'Which AI tools do you use?' },
  );
  if (!picked || picked.length === 0) return;

  let results;
  try {
    results = installRules(folder.uri.fsPath, picked.map((p) => p.id));
  } catch (err) {
    vscode.window.showErrorMessage(`Couldn't write the AI rules: ${err.message}`);
    return;
  }

  const changed = results.filter((r) => r.action !== 'unchanged');
  const created = results.filter((r) => r.action === 'created');
  const root = folder.uri.fsPath;
  const pt = isPt();
  const open = pt ? 'Abrir arquivo' : 'Open file';

  // Files we just created can be kept out of Git locally. Files that already
  // existed are the user's own and are never hidden.
  if (created.length && findGitDir(root)) {
    const share = pt ? 'Compartilhar com o projeto' : 'Share with project';
    const local = pt ? 'Manter só nesta máquina' : 'Keep on this machine only';
    const choice = await vscode.window.showInformationMessage(
      summarize(results) + (pt
        ? ' Recomendado: faça commit para a equipe e os agentes na nuvem usarem as regras.'
        : ' Recommended: commit them so your team and cloud agents get the rules too.'),
      share,
      local,
      open,
    );
    if (choice === local) {
      try {
        excludeLocally(root, created.map((r) => r.file));
        vscode.window.showInformationMessage(pt
          ? 'Pronto: os arquivos criados ficam fora do Git só nesta máquina (.git/info/exclude). Nada muda para a equipe.'
          : 'Done: the new files are hidden from Git on this machine only (.git/info/exclude). Nothing changes for your team.');
      } catch (err) {
        vscode.window.showErrorMessage(`Couldn't update .git/info/exclude: ${err.message}`);
      }
    } else if (choice === open) {
      await vscode.window.showTextDocument(vscode.Uri.file(created[0].path));
    }
    return;
  }

  const choice = await vscode.window.showInformationMessage(summarize(results), open);
  if (choice === open) {
    await vscode.window.showTextDocument(vscode.Uri.file((changed[0] || results[0]).path));
  }
}

// Lets Copilot (agent mode) in VS Code use the snippets through MCP without any
// setup. The server runs on VS Code's own runtime (ELECTRON_RUN_AS_NODE), so
// Node.js doesn't need to be installed. Editors without this API skip it.
function registerMcpServer(context) {
  if (!vscode.lm || typeof vscode.lm.registerMcpServerDefinitionProvider !== 'function' || !vscode.McpStdioServerDefinition) return;
  const server = path.join(context.extensionPath, 'mcp', 'server.js');
  const version = context.extension && context.extension.packageJSON ? context.extension.packageJSON.version : undefined;
  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider('rnSnippets.mcp', {
      provideMcpServerDefinitions: () => [
        new vscode.McpStdioServerDefinition('React Native Snippets', process.execPath, [server], { ELECTRON_RUN_AS_NODE: '1' }, version),
      ],
    }),
  );
}

const WALKTHROUGH = 'fabianocs.rn-shortcut#rnSnippets.gettingStarted';

const isPt = () => (vscode.env.language || '').toLowerCase().startsWith('pt');

const PLAYGROUND = {
  en: [
    '// React Native Snippets — playground (this file is not saved anywhere)',
    '// 1. Put the cursor on the empty line below.',
    '// 2. Type rn-ctx and press Tab, then type a name like Auth and press Tab to move on.',
    '// Also try: rn, rn-props, rn-fl, ust, uef',
    '',
    '',
  ],
  pt: [
    '// React Native Snippets — área de testes (este arquivo não é salvo)',
    '// 1. Coloque o cursor na linha vazia abaixo.',
    '// 2. Digite rn-ctx e aperte Tab; depois digite um nome, como Auth, e aperte Tab para avançar.',
    '// Experimente também: rn, rn-props, rn-fl, ust, uef',
    '',
    '',
  ],
};

async function tryIt() {
  const lines = PLAYGROUND[isPt() ? 'pt' : 'en'];
  const doc = await vscode.workspace.openTextDocument({ language: 'typescriptreact', content: lines.join('\n') });
  const editor = await vscode.window.showTextDocument(doc);
  const end = new vscode.Position(lines.length - 1, 0);
  editor.selection = new vscode.Selection(end, end);
}

const MCP_SETUP = {
  json: JSON.stringify({ mcpServers: { 'rn-snippets': { command: 'npx', args: ['-y', 'github:fabianocsouza/rn-shortcut'] } } }, null, 2),
  claude: 'claude mcp add rn-snippets -- npx -y github:fabianocsouza/rn-shortcut',
};

async function copyMcpConfig() {
  const pt = isPt();
  const pick = await vscode.window.showQuickPick(
    [
      { label: 'Cursor', detail: pt ? 'JSON para .cursor/mcp.json (também serve para outros clientes MCP)' : 'JSON for .cursor/mcp.json (works for other MCP clients too)', value: 'json' },
      { label: 'Claude Code', detail: pt ? 'Comando para colar no terminal' : 'Command to paste in your terminal', value: 'claude' },
    ],
    { title: pt ? 'Copiar configuração do MCP' : 'Copy MCP setup', placeHolder: pt ? 'Qual ferramenta você usa?' : 'Which tool do you use?' },
  );
  if (!pick) return;
  await vscode.env.clipboard.writeText(MCP_SETUP[pick.value]);
  vscode.window.showInformationMessage(
    pick.value === 'json'
      ? (pt ? 'Copiado! Cole em .cursor/mcp.json (Node.js 18+ necessário).' : 'Copied! Paste it into .cursor/mcp.json (requires Node.js 18+).')
      : (pt ? 'Copiado! Cole no terminal (Node.js 18+ necessário).' : 'Copied! Paste it in your terminal (requires Node.js 18+).'),
  );
}

function openGetStarted() {
  return vscode.commands.executeCommand('workbench.action.openWalkthrough', WALKTHROUGH, false);
}

// Offers the AI rules once per React Native project that doesn't have them,
// so users find the feature without reading the README.
async function suggestAiRules(context) {
  if (context.globalState.get('rnSnippets.neverSuggestAiRules')) return;
  // First run after install: show the walkthrough instead, it covers the same thing.
  if (!context.globalState.get('rnSnippets.walkthroughShown')) {
    await context.globalState.update('rnSnippets.walkthroughShown', true);
    await openGetStarted();
    return;
  }
  const folder = (vscode.workspace.workspaceFolders || [])[0];
  if (!folder || vscode.workspace.workspaceFolders.length > 1) return;
  const root = folder.uri.fsPath;
  if (context.workspaceState.get('rnSnippets.aiRulesSuggested') || !isReactNativeProject(root) || hasAiRules(root)) return;

  await context.workspaceState.update('rnSnippets.aiRulesSuggested', true);
  const pt = isPt();
  const add = pt ? 'Adicionar regras de IA' : 'Add AI rules';
  const more = pt ? 'Saiba mais' : 'Learn more';
  const never = pt ? 'Não perguntar de novo' : "Don't ask again";
  const choice = await vscode.window.showInformationMessage(
    pt
      ? 'React Native Snippets: fazer o Copilot, o Cursor e o Claude seguirem os mesmos modelos dos seus snippets?'
      : 'React Native Snippets: make Copilot, Cursor and Claude follow the same templates as your snippets?',
    add,
    more,
    never,
  );
  if (choice === add) await vscode.commands.executeCommand('rnSnippets.addAiRules');
  else if (choice === more) await openGetStarted();
  else if (choice === never) await context.globalState.update('rnSnippets.neverSuggestAiRules', true);
}

function activate(context) {
  const log = vscode.window.createOutputChannel('React Native Snippets');
  context.subscriptions.push(
    log,
    vscode.commands.registerCommand('rnSnippets.addAiRules', addAiRules),
    vscode.commands.registerCommand('rnSnippets.getStarted', openGetStarted),
    vscode.commands.registerCommand('rnSnippets.tryIt', tryIt),
    vscode.commands.registerCommand('rnSnippets.copyMcpConfig', copyMcpConfig),
  );
  try {
    registerMcpServer(context);
    log.appendLine('Activated: command and MCP server registered.');
  } catch (err) {
    // The command must keep working even if this editor's MCP API differs.
    log.appendLine(`Activated without MCP server: ${err && err.stack ? err.stack : err}`);
  }
  suggestAiRules(context).catch((err) => log.appendLine(`AI rules suggestion failed: ${err && err.stack ? err.stack : err}`));
}

function deactivate() {}

module.exports = { activate, deactivate, summarize };
