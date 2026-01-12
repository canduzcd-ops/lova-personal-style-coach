#!/usr/bin/env node

/**
 * Patch iOS FileUtility.h from cordova-plugin-purchase
 * Adds Foundation import to prevent Xcode build errors
 * Run after: npm install or npx cap sync ios
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const FILES_TO_PATCH = [
  'ios/capacitor-cordova-ios-plugins/sources/CordovaPluginPurchase/FileUtility.h',
  'ios/capacitor-cordova-ios-plugins/sources/CordovaPluginPurchase/FileUtility.m',
];

const FOUNDATION_IMPORT = '#import <Foundation/Foundation.h>';

function patchFile(relativePath) {
  const filePath = join(rootDir, relativePath);
  
  if (!existsSync(filePath)) {
    console.log(`⚠️  Skip: ${relativePath} (not found)`);
    return false;
  }

  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Check if already patched
    if (content.includes(FOUNDATION_IMPORT)) {
      console.log(`✅ Already patched: ${relativePath}`);
      return true;
    }

    // Add Foundation import at the top (after any comments)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Skip header comments
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('/*') || line === '') {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    lines.splice(insertIndex, 0, FOUNDATION_IMPORT);
    content = lines.join('\n');

    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error patching ${relativePath}:`, error.message);
    return false;
  }
}

console.log('\n🔧 Patching iOS FileUtility files...\n');

let successCount = 0;
for (const file of FILES_TO_PATCH) {
  if (patchFile(file)) {
    successCount++;
  }
}

console.log(`\n✨ Patched ${successCount}/${FILES_TO_PATCH.length} files\n`);

if (successCount === 0) {
  console.log('💡 Run "npm run cap:sync:ios" first to generate iOS plugin files.\n');
}

process.exit(0);
