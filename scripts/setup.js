#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Budget Mate - Automated Setup');
console.log('==================================');

function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major < 18) {
    console.error('❌ Node.js 18+ is required');
    console.error(`Current version: ${version}`);
    process.exit(1);
  }
  console.log(`✅ Node.js ${version} detected`);
}

function createEnvFile(templatePath, envPath) {
  if (!fs.existsSync(envPath)) {
    console.log(`📋 Creating ${path.basename(envPath)}...`);
    fs.copyFileSync(templatePath, envPath);
    console.log(`✅ ${path.basename(envPath)} created`);
  } else {
    console.log(`⚠️  ${path.basename(envPath)} already exists`);
  }
}

function main() {
  // Check Node.js version
  checkNodeVersion();

  // Install root dependencies
  runCommand('npm install', 'Installing root dependencies');

  // Setup backend
  console.log('🔧 Setting up Backend...');
  process.chdir('backend');

  runCommand('npm install', 'Installing backend dependencies');

  // Create backend .env
  const backendEnvTemplate = path.join(__dirname, '..', 'backend', 'env.example');
  const backendEnv = path.join(__dirname, '..', 'backend', '.env');
  createEnvFile(backendEnvTemplate, backendEnv);

  process.chdir('..');

  // Setup frontend
  console.log('🔧 Setting up Frontend...');
  process.chdir('frontend');

  runCommand('npm install', 'Installing frontend dependencies');

  // Create frontend .env
  const frontendEnvTemplate = path.join(__dirname, '..', 'frontend', '.env.example');
  const frontendEnv = path.join(__dirname, '..', 'frontend', '.env');
  createEnvFile(frontendEnvTemplate, frontendEnv);

  process.chdir('..');

  console.log('====================================');
  console.log('✅ Setup completed successfully!');
  console.log('====================================');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('');
  console.log('1. For DEMO mode (no database needed):');
  console.log('   npm run dev:demo');
  console.log('');
  console.log('2. For FULL mode (requires PostgreSQL):');
  console.log('   - Setup PostgreSQL database');
  console.log('   - Edit backend/.env with your database credentials');
  console.log('   - Run: npm run db:migrate');
  console.log('   - Run: npm run db:seed');
  console.log('   - Run: npm run dev');
  console.log('');
  console.log('3. Using Docker (easiest):');
  console.log('   docker-compose up --build');
  console.log('');
  console.log('📚 See README.md for detailed instructions');
}

// Run setup
main();