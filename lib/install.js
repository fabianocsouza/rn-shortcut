'use strict';

const fs = require('fs');
const path = require('path');
const { rulesBody, markedSection, cursorRule, mergeSection, TARGETS } = require('./rules');

/**
 * Writes the AI rules for the chosen targets into a project folder.
 * Files with a marked section get it inserted or replaced; the Cursor rule is
 * its own file and is overwritten. Returns what happened to each file.
 */
function installRules(root, targetIds) {
  const body = rulesBody();
  const results = [];
  for (const t of TARGETS.filter((x) => targetIds.includes(x.id))) {
    const file = path.join(root, t.file);
    const existed = fs.existsSync(file);
    const before = existed ? fs.readFileSync(file, 'utf8') : '';
    const after = t.kind === 'whole' ? cursorRule(body) : mergeSection(before, markedSection(body));
    let action = existed ? 'updated' : 'created';
    if (before === after) {
      action = 'unchanged';
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, after);
    }
    results.push({ id: t.id, file: t.file, path: file, action });
  }
  return results;
}

module.exports = { installRules, TARGETS };
