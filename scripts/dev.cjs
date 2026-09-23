const { spawn } = require('child_process');

console.log('Starting klyd Music Backend (port 8787) & Frontend (port 5173)...');

const isWin = process.platform === 'win32';
const backendCmd = isWin ? 'cmd.exe' : 'npm';
const backendArgs = isWin ? ['/c', 'npm', '--prefix', 'backend', 'run', 'dev'] : ['--prefix', 'backend', 'run', 'dev'];

const frontendCmd = isWin ? 'cmd.exe' : 'npm';
const frontendArgs = isWin ? ['/c', 'npm', '--prefix', 'frontend', 'run', 'dev'] : ['--prefix', 'frontend', 'run', 'dev'];

const backend = spawn(backendCmd, backendArgs, {
  stdio: 'inherit',
});

const frontend = spawn(frontendCmd, frontendArgs, {
  stdio: 'inherit',
});

function cleanup() {
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
