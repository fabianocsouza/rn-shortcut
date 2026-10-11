'use strict';

const path = require('path');
const vscode = require('vscode');
const { installRules, TARGETS } = require('./lib/install');

const DEFAULT_TARGETS = ['agents', 'cursor', 'copilot'];

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
  const summary = results.map((r) => `${r.file} (${r.action})`).join(', ');
  const choice = await vscode.window.showInformationMessage(
    changed.length ? `AI rules added: ${summary}` : 'AI rules are already up to date.',
    'Open file',
  );
  if (choice === 'Open file') {
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

function activate(context) {
  const log = vscode.window.createOutputChannel('React Native Snippets');
  context.subscriptions.push(log, vscode.commands.registerCommand('rnSnippets.addAiRules', addAiRules));
  try {
    registerMcpServer(context);
    log.appendLine('Activated: command and MCP server registered.');
  } catch (err) {
    // The command must keep working even if this editor's MCP API differs.
    log.appendLine(`Activated without MCP server: ${err && err.stack ? err.stack : err}`);
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
