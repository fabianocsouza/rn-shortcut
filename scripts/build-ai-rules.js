'use strict';
// Regenerates ai-rules/ from snippets/snippets.code-snippets.
// Run with `npm run build:ai-rules` after changing a snippet.
const fs = require('fs');
const path = require('path');
const { rulesBody, markedSection, cursorRule } = require('../lib/rules');

const dir = path.join(__dirname, '..', 'ai-rules');
const body = rulesBody();
const files = {
  'AGENTS.md': markedSection(body),
  'CLAUDE.md': markedSection(body),
  'copilot-instructions.md': markedSection(body),
  'react-native-snippets.mdc': cursorRule(body),
};
fs.mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content);
  console.log('wrote ai-rules/' + name);
}
