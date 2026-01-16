#!/usr/bin/env node

/**
 * Development script to run both frontend and backend simultaneously
 * Usage: node dev.js
 */

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
};

function log(prefix, color, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Start backend
const backendDir = path.join(__dirname, 'backend-vps');
const backend = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (data) => {
  data.toString().split('\n').filter(Boolean).forEach(line => {
    log('BACKEND', colors.yellow, line);
  });
});

backend.stderr.on('data', (data) => {
  data.toString().split('\n').filter(Boolean).forEach(line => {
    log('BACKEND', colors.red, line);
  });
});

backend.on('error', (err) => {
  log('BACKEND', colors.red, `Failed to start: ${err.message}`);
});

backend.on('close', (code) => {
  log('BACKEND', colors.yellow, `Process exited with code ${code}`);
});

// Start frontend after a small delay to let backend initialize
setTimeout(() => {
  const frontend = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true,
  });

  frontend.stdout.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      log('FRONTEND', colors.cyan, line);
    });
  });

  frontend.stderr.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      log('FRONTEND', colors.red, line);
    });
  });

  frontend.on('error', (err) => {
    log('FRONTEND', colors.red, `Failed to start: ${err.message}`);
  });

  frontend.on('close', (code) => {
    log('FRONTEND', colors.cyan, `Process exited with code ${code}`);
    backend.kill();
    process.exit(code);
  });
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  log('DEV', colors.green, 'Shutting down...');
  backend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  process.exit(0);
});

console.log(`${colors.green}Starting development servers...${colors.reset}`);
console.log(`${colors.yellow}Backend:${colors.reset} http://localhost:3001`);
console.log(`${colors.cyan}Frontend:${colors.reset} http://localhost:8080`);
console.log('');
