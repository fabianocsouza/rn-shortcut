#!/usr/bin/env node
'use strict';

// Minimal MCP server (stdio, newline-delimited JSON-RPC 2.0) that exposes the
// React Native snippets to AI assistants. No dependencies on purpose.

const readline = require('readline');
const { loadSnippets, renderSnippet, tabStops, usesComponentName } = require('../lib/snippets');
const { version } = require('../package.json');

const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const snippets = loadSnippets();

const TOOLS = [
  {
    name: 'list_snippets',
    description:
      'List the React Native / Expo code templates used in this project (components, StyleSheet, styled-components, FlatList, Context, hooks). ' +
      'Call this before creating React Native code to see which template fits.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_snippet',
    description:
      'Return the code for one React Native template, filled in with your names. Use it as the starting point when creating a component, ' +
      'context, FlatList or hook so the code follows the project conventions.',
    inputSchema: {
      type: 'object',
      properties: {
        prefix: { type: 'string', description: 'Template prefix from list_snippets, e.g. "rn-ctx" or "rn-props".', enum: snippets.map((s) => s.prefix) },
        componentName: { type: 'string', description: 'Component name for component templates (defaults to "ComponentName").' },
        values: {
          type: 'object',
          description: 'Placeholder values by number, e.g. {"1": "Auth", "2": "user"}. list_snippets shows what each number means.',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['prefix'],
    },
  },
];

function listSnippets() {
  return snippets
    .map((s) => {
      const parts = Object.entries(tabStops(s.body)).map(([n, d]) => `${n}=${d || '…'}`);
      if (usesComponentName(s.body)) parts.unshift('componentName');
      return `- ${s.prefix}: ${s.description}${parts.length ? ` (placeholders: ${parts.join(', ')})` : ''}`;
    })
    .join('\n');
}

function callTool(name, args = {}) {
  if (name === 'list_snippets') return listSnippets();
  if (name === 'get_snippet') {
    const s = snippets.find((x) => x.prefix === args.prefix);
    if (!s) throw new RpcError(-32602, `Unknown snippet "${args.prefix}". Call list_snippets to see the available prefixes.`);
    return renderSnippet(s.body, { ...(args.values || {}), componentName: args.componentName });
  }
  throw new RpcError(-32602, `Unknown tool "${name}"`);
}

class RpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function handle(method, params = {}) {
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'react-native-snippets', version },
        instructions: 'Use list_snippets and get_snippet when writing React Native or Expo code so it matches the project templates.',
      };
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: TOOLS };
    case 'tools/call':
      try {
        return { content: [{ type: 'text', text: callTool(params.name, params.arguments) }] };
      } catch (err) {
        if (err instanceof RpcError && err.code === -32602 && params.name !== undefined && TOOLS.some((t) => t.name === params.name)) {
          return { content: [{ type: 'text', text: err.message }], isError: true };
        }
        throw err;
      }
    default:
      throw new RpcError(-32601, `Method not found: ${method}`);
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  if (msg.id === undefined || msg.id === null) return; // notification, e.g. notifications/initialized
  try {
    send({ jsonrpc: '2.0', id: msg.id, result: handle(msg.method, msg.params) });
  } catch (err) {
    send({ jsonrpc: '2.0', id: msg.id, error: { code: err.code || -32603, message: err.message } });
  }
});
