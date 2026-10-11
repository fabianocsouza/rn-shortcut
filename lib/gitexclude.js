'use strict';

const fs = require('fs');
const path = require('path');

const HEADER = '# React Native Snippets: AI rules kept on this machine only';

/** Finds the .git directory for a project root, following worktree/submodule .git files. */
function findGitDir(root) {
  const dotGit = path.join(root, '.git');
  let stat;
  try {
    stat = fs.statSync(dotGit);
  } catch {
    return null;
  }
  if (stat.isDirectory()) return dotGit;
  const m = /^gitdir:\s*(.+)\s*$/m.exec(fs.readFileSync(dotGit, 'utf8'));
  return m ? path.resolve(root, m[1].trim()) : null;
}

/**
 * Hides files from Git locally via .git/info/exclude (never committed, unlike
 * .gitignore). Returns the paths that were added; already-listed ones are skipped.
 */
function excludeLocally(root, relPaths) {
  const gitDir = findGitDir(root);
  if (!gitDir) return null;
  const file = path.join(gitDir, 'info', 'exclude');
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const lines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
  const toAdd = relPaths.map((p) => '/' + p.split(path.sep).join('/')).filter((p) => !lines.has(p));
  if (toAdd.length === 0) return [];
  let out = existing.replace(/\s*$/, existing ? '\n' : '');
  if (!lines.has(HEADER)) out += (out ? '\n' : '') + HEADER + '\n';
  out += toAdd.join('\n') + '\n';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  return toAdd;
}

module.exports = { findGitDir, excludeLocally };
