const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Installing Frontend Dependencies ---');
execSync('npm --prefix frontend install', { stdio: 'inherit' });

console.log('--- Building Frontend ---');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

// Ensure dist exists at root as well for any platform looking at ./dist
const srcDir = path.join(__dirname, '..', 'frontend', 'dist');
const destDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('--- Copied frontend/dist to root ./dist ---');
}
