'use strict';

const fs = require('fs');
const path = require('path');

const SNIPPETS_FILE = path.join(__dirname, '..', 'snippets', 'snippets.code-snippets');

// The snippets file is JSON with comments-free trailing commas (VS Code JSONC).
function parseJsonc(text) {
  return JSON.parse(text.replace(/,(\s*[}\]])/g, '$1'));
}

function loadSnippets(file = SNIPPETS_FILE) {
  const raw = parseJsonc(fs.readFileSync(file, 'utf8'));
  return Object.entries(raw).map(([name, s]) => ({
    name,
    prefix: s.prefix,
    description: s.description,
    body: Array.isArray(s.body) ? s.body.join('\n') : s.body,
  }));
}

const CASE = {
  capitalize: (s) => s.charAt(0).toUpperCase() + s.slice(1),
  upcase: (s) => s.toUpperCase(),
  downcase: (s) => s.toLowerCase(),
};

/**
 * Expands a snippet body into plain code.
 * values: { componentName?: string, [tabstop: number]: string }
 * Tab stops without a value use their default text (or become empty).
 */
function renderSnippet(body, values = {}) {
  const defaults = {};
  for (const m of body.matchAll(/\$\{(\d+):([^}]*)\}/g)) {
    if (!(m[1] in defaults)) defaults[m[1]] = m[2];
  }
  const valueOf = (n) => (values[n] !== undefined ? String(values[n]) : defaults[n] ?? '');

  return body
    .replace(/\$\{TM_DIRECTORY\/.*?\/\}/g, () => values.componentName || 'ComponentName')
    .replace(/\$\{(\d+)\/\(\.\*\)\/\$\{1:\/(\w+)\}\/\}/g, (_, n, fn) => (CASE[fn] || ((s) => s))(valueOf(n)))
    .replace(/\$\{(\d+):[^}]*\}/g, (_, n) => valueOf(n))
    .replace(/\$\{(\d+)\}|\$(\d+)/g, (_, a, b) => valueOf(a ?? b))
    .replace(/\n+$/, '');
}

/** Lists the tab stops of a snippet with their default text, for tools/docs. */
function tabStops(body) {
  const stops = {};
  for (const m of body.matchAll(/\$\{(\d+)(?::([^}]*))?\}|\$(\d+)/g)) {
    const n = m[1] ?? m[3];
    if (n === '0') continue;
    if (!(n in stops) || (m[2] && !stops[n])) stops[n] = m[2] || '';
  }
  return stops;
}

module.exports = { loadSnippets, renderSnippet, tabStops, SNIPPETS_FILE };
