'use strict';

const { loadSnippets, renderSnippet } = require('./snippets');

const START = '<!-- rn-snippets:start -->';
const END = '<!-- rn-snippets:end -->';

// Snippets grouped the way an AI should think about them.
const GROUPS = [
  ['Components', ['rn', 'rn-s', 'rn-si', 'rn-sc', 'rn-props']],
  ['Style files', ['rn-style', 'rn-styled']],
  ['Lists and state', ['rn-fl', 'rn-ctx']],
  ['Hooks and helpers', ['ust', 'uef', 'od', 'fn', 'fn-async', 'cl']],
];

/** Markdown body shared by every AI rules file. */
function rulesBody(snippets = loadSnippets()) {
  const byPrefix = Object.fromEntries(snippets.map((s) => [s.prefix, s]));
  const out = [
    '# React Native code templates',
    '',
    'This project uses the React Native Snippets extension (fabianocs.rn-shortcut).',
    'When you write React Native / Expo code here, follow these templates so generated code matches what developers get from the snippets:',
    '',
    '- Use named exports: `export function ComponentName()`, never default exports.',
    '- Name a component after its folder (`Home/index.tsx` exports `Home`).',
    '- Replace placeholder names (`ComponentName`, `Name`, `value`, `data`…) with names that fit the task.',
    '- Keep the structure: imports first, then types, then the component, then styles.',
    '- Use TypeScript types when the file is `.ts`/`.tsx`; drop them in `.js`/`.jsx` files.',
    '',
  ];
  for (const [title, prefixes] of GROUPS) {
    out.push(`## ${title}`, '');
    for (const p of prefixes) {
      const s = byPrefix[p];
      if (!s) continue;
      out.push(`### ${s.description.replace(/\.$/, '')} (snippet \`${s.prefix}\`)`, '', '```tsx', renderSnippet(s.body), '```', '');
    }
  }
  return out.join('\n').trimEnd() + '\n';
}

/** Section to merge into AGENTS.md / CLAUDE.md / copilot-instructions.md. */
function markedSection(body = rulesBody()) {
  return `${START}\n${body}${END}\n`;
}

function cursorRule(body = rulesBody()) {
  return [
    '---',
    'description: React Native / Expo code templates from the React Native Snippets extension',
    'globs: "**/*.{ts,tsx,js,jsx}"',
    'alwaysApply: false',
    '---',
    '',
    body,
  ].join('\n');
}

/**
 * Inserts the marked section into existing file content, replacing a previous
 * copy if there is one, so running the command twice doesn't duplicate it.
 */
function mergeSection(existing, section = markedSection()) {
  if (!existing) return section;
  const i = existing.indexOf(START);
  const j = existing.indexOf(END);
  if (i !== -1 && j > i) {
    return existing.slice(0, i) + section.trimEnd() + existing.slice(j + END.length);
  }
  return existing.replace(/\s*$/, '\n\n') + section;
}

// Where each AI reads its instructions, relative to the project root.
const TARGETS = [
  { id: 'agents', label: 'AGENTS.md', detail: 'Codex, Claude Code, Cursor, Copilot agent and others', file: 'AGENTS.md', kind: 'section' },
  { id: 'claude', label: 'CLAUDE.md', detail: 'Claude Code', file: 'CLAUDE.md', kind: 'section' },
  { id: 'cursor', label: 'Cursor rule', detail: 'Cursor', file: '.cursor/rules/react-native-snippets.mdc', kind: 'whole' },
  { id: 'copilot', label: 'GitHub Copilot', detail: 'GitHub Copilot in VS Code', file: '.github/copilot-instructions.md', kind: 'section' },
];

module.exports = { rulesBody, markedSection, cursorRule, mergeSection, TARGETS, START, END };
