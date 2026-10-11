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
    'List the React Native / Expo code templates used in this project (components, StyleSheet, styled-components, FlatList, Context, hooks). ' +
    'Call this before creating React Native code to see which template fits.',
  get:
    'Return the code for one React Native template, filled in with your names. Use it as the starting point when creating a component, ' +
    'context, FlatList or hook so the code follows the project conventions.',
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
