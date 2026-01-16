#!/usr/bin/env node

/**
 * Development script to run both frontend and backend simultaneously
 * Usage: node dev.js
 * 
 * Prerequisites:
 * 1. Create backend-vps/.env file with your configuration
 * 2. Run: npm install && cd backend-vps && npm install && cd ..
 * 3. Run: node dev.js
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(prefix, color, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${prefix}]${colors.reset} ${message}`);
}

// Check if backend .env exists
const backendEnvPath = path.join(__dirname, 'backend-vps', '.env');
if (!fs.existsSync(backendEnvPath)) {
  console.log(`${colors.red}❌ Missing backend-vps/.env file!${colors.reset}`);
  console.log(`${colors.yellow}Please create it based on backend-vps/.env.example${colors.reset}`);
  console.log('');
  console.log('Required variables:');
  console.log('  - GOOGLE_SERVICE_ACCOUNT_KEY (JSON string of your service account)');
  console.log('  - JWT_SECRET (any random string for token signing)');
  console.log('');
  process.exit(1);
}

// Check if backend node_modules exists
const backendNodeModules = path.join(__dirname, 'backend-vps', 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log(`${colors.yellow}📦 Installing backend dependencies...${colors.reset}`);
  try {
    execSync('npm install', { 
      cwd: path.join(__dirname, 'backend-vps'), 
      stdio: 'inherit' 
    });
    console.log(`${colors.green}✅ Backend dependencies installed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Failed to install backend dependencies${colors.reset}`);
    process.exit(1);
  }
}

console.log('');
console.log(`${colors.green}╔════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.green}║       🚀 Starting Development Servers                  ║${colors.reset}`);
console.log(`${colors.green}╠════════════════════════════════════════════════════════╣${colors.reset}`);
console.log(`${colors.green}║  ${colors.yellow}Backend:${colors.reset}  http://localhost:3001                     ${colors.green}║${colors.reset}`);
console.log(`${colors.green}║  ${colors.cyan}Frontend:${colors.reset} http://localhost:8080                     ${colors.green}║${colors.reset}`);
console.log(`${colors.green}╚════════════════════════════════════════════════════════╝${colors.reset}`);
console.log('');

let backendReady = false;
let frontendProcess = null;

// Start backend
const backendDir = path.join(__dirname, 'backend-vps');
const backend = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(Boolean);
  lines.forEach(line => {
    log('BACKEND', colors.yellow, line);
    
    // Start frontend when backend is ready
    if (!backendReady && (line.includes('Server running') || line.includes('listening'))) {
      backendReady = true;
      startFrontend();
    }
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().split('\n').filter(Boolean);
  lines.forEach(line => {
    // nodemon restart messages go to stderr but aren't errors
    if (line.includes('nodemon') || line.includes('restarting') || line.includes('watching')) {
      log('BACKEND', colors.magenta, line);
    } else {
      log('BACKEND', colors.red, line);
    }
  });
});

backend.on('error', (err) => {
  log('BACKEND', colors.red, `Failed to start: ${err.message}`);
});

backend.on('close', (code) => {
  log('BACKEND', colors.yellow, `Process exited with code ${code}`);
  if (frontendProcess) {
    frontendProcess.kill();
  }
  process.exit(code);
});

// Start frontend
function startFrontend() {
  log('FRONTEND', colors.cyan, 'Starting Vite dev server...');
  
  frontendProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  frontendProcess.stdout.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      log('FRONTEND', colors.cyan, line);
    });
  });

  frontendProcess.stderr.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      log('FRONTEND', colors.red, line);
    });
  });

  frontendProcess.on('error', (err) => {
    log('FRONTEND', colors.red, `Failed to start: ${err.message}`);
  });

  frontendProcess.on('close', (code) => {
    log('FRONTEND', colors.cyan, `Process exited with code ${code}`);
    backend.kill();
    process.exit(code);
  });
}

// Fallback: Start frontend after timeout if backend doesn't emit ready signal
setTimeout(() => {
  if (!backendReady) {
    log('DEV', colors.yellow, 'Starting frontend (timeout)...');
    backendReady = true;
    startFrontend();
  }
}, 5000);

// Handle process termination
function cleanup() {
  log('DEV', colors.green, 'Shutting down servers...');
  backend.kill();
  if (frontendProcess) {
    frontendProcess.kill();
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  backend.kill();
  if (frontendProcess) {
    frontendProcess.kill();
  }
});
