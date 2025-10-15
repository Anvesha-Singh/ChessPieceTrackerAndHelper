// Copy stockfish engine assets from node_modules to public/engine
// This avoids dev-server URL quirks by serving static files under /engine/...

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'node_modules', 'stockfish', 'src');
const destDir = path.join(root, 'public', 'engine');

const files = [
  'stockfish-17.1-lite-single-03e3232.js',
  'stockfish-17.1-lite-single-03e3232.wasm',
  'stockfish-17.1-lite-51f59da.js',
  'stockfish-17.1-lite-51f59da.wasm',
  'stockfish-17.1-asm-341ff22.js',
];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const file of files) {
  const from = path.join(srcDir, file);
  const to = path.join(destDir, file);
  if (!fs.existsSync(from)) {
    console.error(`[copy-stockfish] Missing source file: ${from}`);
    process.exitCode = 1;
    continue;
  }
  fs.copyFileSync(from, to);
  console.log(`[copy-stockfish] Copied ${file} -> public/engine/`);
}
