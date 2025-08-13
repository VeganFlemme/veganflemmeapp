/**
 * Production Environment Configuration and Validation
 * Handles graceful fallback when services are unavailable
 * 
 * @deprecated - Use lib/env.server.ts and lib/env.client.ts instead
 * This file is kept for backward compatibility but should be phased out
 */

import { env as serverEnv, validateServerEnv } from './env.server';
import { env as clientEnv, validateClientEnv } from './env.client';

export interface EnvironmentConfig {
  production: boolean
  services: {
    supabase: {
      url: string | undefined
      anonKey: string | undefined
      serviceRoleKey: string | undefined
      configured: boolean
      adminConfigured: boolean
    }
    database: {
      url: string | undefined
      configured: boolean
    }
    solver: {
      url: string | undefined
      configured: boolean
    }
    spoonacular: {
      key: string | undefined
      configured: boolean
    }
    openai: {
      key: string | undefined
      model: string | undefined
      configured: boolean
    }
  }
  mode: 'production' | 'development' | 'demo'
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    production: serverEnv.isProduction,
    services: {
      supabase: {
        url: clientEnv.supabase.url,
        anonKey: clientEnv.supabase.anonKey,
        serviceRoleKey: serverEnv.supabase.serviceRoleKey,
        configured: clientEnv.supabase.configured,
        adminConfigured: serverEnv.supabase.adminConfigured
      },
      database: {
        url: serverEnv.database.url,
        configured: serverEnv.database.configured
      },
      solver: {
        url: serverEnv.solver.url,
        configured: serverEnv.solver.configured
      },
      spoonacular: {
        key: serverEnv.spoonacular.key,
        configured: serverEnv.spoonacular.configured
      },
      openai: {
        key: serverEnv.openai.key,
        model: serverEnv.openai.model,
        configured: serverEnv.openai.configured
      }
    },
    mode: 'demo'
  }

  // Determine operating mode
  if (config.services.supabase.configured && config.services.database.configured && config.services.solver.configured) {
    config.mode = config.production ? 'production' : 'development'
  } else if (config.services.database.configured || config.services.solver.configured) {
    config.mode = 'development'
  } else {
    config.mode = 'demo'
  }

  return config
}

export function validateEnvironment(): {
  valid: boolean
  issues: string[]
  recommendations: string[]
} {
  const serverValidation = validateServerEnv();
  const clientValidation = validateClientEnv();
  
  return {
    valid: serverValidation.valid && clientValidation.valid,
    issues: [...serverValidation.issues, ...clientValidation.issues],
    recommendations: [...serverValidation.recommendations, ...clientValidation.recommendations]
  };
}

// Runtime environment info for debugging
export function getEnvironmentInfo() {
  const config = getEnvironmentConfig()
  const validation = validateEnvironment()

  return {
    config,
    validation,
    runtime: {
      nodeEnv: serverEnv.nodeEnv,
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    }
  }
}

// Safe URL validation
export function isValidUrl(url?: string): boolean {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Service health check configuration
export function getServiceEndpoints() {
  const config = getEnvironmentConfig()
  
  return {
    solver: config.services.solver.url ? `${config.services.solver.url}/health` : null,
    supabase: config.services.supabase.url ? `${config.services.supabase.url}/rest/v1/` : null,
    spoonacular: config.services.spoonacular.configured ? 'https://api.spoonacular.com/recipes/random' : null,
    openfoodfacts: 'https://world.openfoodfacts.org/api/v0/product/test.json'
  }
}

export default getEnvironmentConfig