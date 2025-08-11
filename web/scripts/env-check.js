#!/usr/bin/env node

/**
 * VeganFlemme Environment Configuration Utility
 * Helps diagnose and configure production environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
}

function checkEnvironmentVariables() {
  log('Checking Environment Variables...', 'info');
  
  const required = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'SOLVER_URL': process.env.SOLVER_URL,
    'SPOONACULAR_KEY': process.env.SPOONACULAR_KEY
  };
  
  const optional = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'OFF_BASE': process.env.OFF_BASE,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY
  };
  
  let allGood = true;
  
  // Check required variables
  Object.entries(required).forEach(([key, value]) => {
    if (value) {
      log(`${key}: Configured`, 'success');
    } else {
      log(`${key}: Missing (Required)`, 'error');
      allGood = false;
    }
  });
  
  // Check optional variables
  Object.entries(optional).forEach(([key, value]) => {
    if (value) {
      log(`${key}: Configured`, 'success');
    } else {
      log(`${key}: Missing (Optional)`, 'warning');
    }
  });
  
  return allGood;
}

async function testDatabaseConnectivity() {
  log('Testing Database Connectivity...', 'info');
  
  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL not configured', 'error');
    return false;
  }
  
  try {
    // Parse DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    const host = url.hostname;
    const port = url.port || 5432;
    
    log(`Testing connection to ${host}:${port}`, 'info');
    
    // Try to test with pg if available
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      
      await pool.query('SELECT 1');
      await pool.end();
      log('Database connection successful', 'success');
      return true;
    } catch (error) {
      log(`Database connection failed: ${error.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Invalid DATABASE_URL format: ${error.message}`, 'error');
    return false;
  }
}

function checkApplicationHealth() {
  log('Checking Application Health...', 'info');
  
  try {
    // Check if we can build the application
    log('Testing application build...', 'info');
    execSync('npm run build', { stdio: 'pipe' });
    log('Application builds successfully', 'success');
    return true;
  } catch (error) {
    log(`Application build failed: ${error.message}`, 'error');
    return false;
  }
}

function displayRecommendations(results) {
  log('Configuration Recommendations:', 'info');
  
  if (!results.envVars) {
    log('Configure missing required environment variables', 'warning');
  }
  
  if (!results.database) {
    log('Fix database connectivity issues', 'warning');
    log('1. Verify DATABASE_URL format', 'info');
    log('2. Check network access to Supabase', 'info');
    log('3. Verify credentials in Supabase dashboard', 'info');
  }
  
  if (results.envVars && results.app) {
    log('Environment is production-ready! 🎉', 'success');
    log('Deploy to Vercel and test full functionality', 'info');
  } else {
    log('Environment needs configuration before production deployment', 'warning');
  }
}

async function main() {
  console.log('\n🥗 VeganFlemme Environment Configuration Utility\n');
  
  const results = {
    envVars: checkEnvironmentVariables(),
    database: await testDatabaseConnectivity(),
    app: checkApplicationHealth()
  };
  
  console.log('\n📊 Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    log(`${test}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'error');
  });
  
  console.log('\n');
  displayRecommendations(results);
  
  const allPassed = Object.values(results).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main, checkEnvironmentVariables, testDatabaseConnectivity };