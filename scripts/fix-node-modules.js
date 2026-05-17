// Post-install fix for Node 18 + Windows ESM compatibility
// Patches metro-config/src/loadConfig.js to handle Windows paths in import()
const fs = require('fs');
const path = require('path');

const loadConfigPath = path.join(__dirname, '..', 'node_modules', 'metro-config', 'src', 'loadConfig.js');

if (!fs.existsSync(loadConfigPath)) {
  console.error('[fix] loadConfig.js not found at', loadConfigPath);
  process.exit(1);
}

let content = fs.readFileSync(loadConfigPath, 'utf8');
let modified = false;

// Fix 1: Windows file:// URL for ESM import()
const oldImport = `const configModule = await import(absolutePath);`;
const newImport = `const importPath = process.platform === 'win32'\n          ? 'file:///' + absolutePath.replace(/\\\\/g, '/')\n          : absolutePath;\n        const configModule = await import(importPath);`;

if (content.includes(oldImport) && !content.includes('file:///')) {
  content = content.replace(oldImport, newImport);
  modified = true;
  console.log('[fix] Applied Windows ESM import path fix');
}

// Fix 2: toReversed polyfill for Node 18
const oldReverse = `const reversedConfigs = configs.toReversed();`;
const newReverse = `const reversedConfigs = Array.prototype.toReversed ? configs.toReversed() : [...configs].reverse();`;

if (content.includes(oldReverse)) {
  content = content.replace(oldReverse, newReverse);
  modified = true;
  console.log('[fix] Applied toReversed polyfill');
}

if (modified) {
  fs.writeFileSync(loadConfigPath, content, 'utf8');
  console.log('[fix] loadConfig.js patched successfully');
} else {
  console.log('[fix] loadConfig.js already up-to-date or patches not needed');
}
