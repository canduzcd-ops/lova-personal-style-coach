#!/usr/bin/env node

/**
 * Prebuild check: Ensures Firebase config files exist
 * Exit code 1 if any required file is missing
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const requiredFiles = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json'
];

let allPresent = true;

requiredFiles.forEach(file => {
  const filePath = join(projectRoot, file);
  if (!existsSync(filePath)) {
    console.error(`❌ Missing Firebase config: ${file}`);
    allPresent = false;
  }
});

if (!allPresent) {
  console.error('\n⚠️  Firebase configuration incomplete. Please ensure all files exist before building.');
  process.exit(1);
}

console.log('✅ Firebase configuration validated');
