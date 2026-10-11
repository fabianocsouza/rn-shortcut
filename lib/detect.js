'use strict';

const fs = require('fs');
const path = require('path');
const { START, TARGETS } = require('./rules');

/** True when the folder's package.json depends on react-native or expo. */
function isReactNativeProject(root) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    return Boolean(deps['react-native'] || deps.expo);
  } catch {
    return false;
  }
}

/** True when any of the AI rules files from this extension is already there. */
function hasAiRules(root) {
  return TARGETS.some((t) => {
    try {
      const text = fs.readFileSync(path.join(root, t.file), 'utf8');
      return t.kind === 'whole' || text.includes(START);
    } catch {
      return false;
    }
  });
}

module.exports = { isReactNativeProject, hasAiRules };
