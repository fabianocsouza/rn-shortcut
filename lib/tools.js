'use strict';

// What the AI tools answer, shared by the native Copilot tools (extension.js)
// and the MCP server for Cursor / Claude Code (mcp/server.js).

const { loadSnippets, renderSnippet, tabStops, usesComponentName } = require('./snippets');

const snippets = loadSnippets();

const PREFIXES = snippets.map((s) => s.prefix);

function listSnippetsText() {
  return snippets
    .map((s) => {
      const parts = Object.entries(tabStops(s.body)).map(([n, d]) => `${n}=${d || '…'}`);
      if (usesComponentName(s.body)) parts.unshift('componentName');
      return `- ${s.prefix}: ${s.description}${parts.length ? ` (placeholders: ${parts.join(', ')})` : ''}`;
    })
    .join('\n');
}

class UnknownSnippetError extends Error {}

function getSnippetText({ prefix, componentName, values } = {}) {
  const s = snippets.find((x) => x.prefix === prefix);
  if (!s) throw new UnknownSnippetError(`Unknown snippet "${prefix}". Call list_snippets to see the available prefixes.`);
  return renderSnippet(s.body, { ...(values || {}), componentName });
}

const DESCRIPTIONS = {
  list:
    'Lists the React Native / Expo code templates this project uses (components, StyleSheet, styled-components, FlatList, Context, hooks). ' +
    'Call it when you are not sure which template fits, then call get_snippet.',
  get:
    'ALWAYS call this tool before writing a React Native or Expo component, screen, context/provider, FlatList or hook in this project. ' +
    'It returns the project template for that kind of code, filled in with the names you pass. Use the returned code as the base and keep its ' +
    'structure, names and exports; only add what the user explicitly asked for. ' +
    'Prefixes: rn (component), rn-props (component with typed Props), rn-s / rn-si / rn-sc (component with StyleSheet or styled-components), ' +
    'rn-fl (FlatList), rn-ctx (Context + Provider + hook), ust / uef (useState / useEffect).',
};

const GET_SCHEMA = {
  type: 'object',
  properties: {
    prefix: { type: 'string', description: 'Template prefix from list_snippets, e.g. "rn-ctx" or "rn-props".', enum: PREFIXES },
    componentName: { type: 'string', description: 'Component name for component templates (defaults to "ComponentName").' },
    values: {
      type: 'object',
      description: 'Placeholder values by number, e.g. {"1": "Auth", "2": "user"}. list_snippets shows what each number means.',
      additionalProperties: { type: 'string' },
    },
  },
  required: ['prefix'],
};

module.exports = { listSnippetsText, getSnippetText, UnknownSnippetError, DESCRIPTIONS, GET_SCHEMA, PREFIXES };
