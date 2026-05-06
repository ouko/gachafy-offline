#!/usr/bin/env node
/**
 * Fail the build if any JS chunk exceeds the configured threshold.
 * Run after `npm run build`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST_DIR = path.join(__dirname, '..', 'dist', 'assets');
const THRESHOLD_KB = 350; // Maximum allowed chunk size in KB

function formatSize(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ dist/assets not found. Run 'npm run build' first.`);
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.js') && !f.endsWith('.map'));
  let failed = false;

  console.log('📦 Bundle size check\n');

  for (const file of files.sort()) {
    const stat = fs.statSync(path.join(DIST_DIR, file));
    const sizeKb = stat.size / 1024;
    const status = sizeKb > THRESHOLD_KB ? '❌' : '✅';
    console.log(`  ${status} ${file.padEnd(40)} ${formatSize(stat.size).padStart(10)}`);
    if (sizeKb > THRESHOLD_KB) {
      failed = true;
    }
  }

  console.log(`\n  Threshold: ${THRESHOLD_KB} KB`);

  if (failed) {
    console.error('\n❌ Bundle size check failed. One or more chunks exceed the threshold.');
    console.error('   Consider code splitting, lazy loading, or trimming dependencies.');
    process.exit(1);
  }

  console.log('\n✅ Bundle size check passed.');
}

main();
