/**
 * Production Environment Configuration and Validation
 * Handles graceful fallback when services are unavailable
 */

export interface EnvironmentConfig {
  production: boolean
  services: {
    supabase: {
      url?: string
      anonKey?: string
      configured: boolean
    }
    database: {
      url?: string
      configured: boolean
    }
    solver: {
      url?: string
      configured: boolean
    }
    spoonacular: {
      key?: string
      configured: boolean
    }
    openai: {
      key?: string
      model?: string
      configured: boolean
    }
  }
  mode: 'production' | 'development' | 'demo'
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    production: process.env.NODE_ENV === 'production',
    services: {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      },
      database: {
        url: process.env.DATABASE_URL,
        configured: !!process.env.DATABASE_URL
      },
      solver: {
        url: process.env.SOLVER_URL,
        configured: !!process.env.SOLVER_URL
      },
      spoonacular: {
        key: process.env.SPOONACULAR_KEY,
        configured: !!process.env.SPOONACULAR_KEY
      },
      openai: {
        key: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        configured: !!process.env.OPENAI_API_KEY
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
  const config = getEnvironmentConfig()
  const issues: string[] = []
  const recommendations: string[] = []

  // Critical services for production
  if (config.production) {
    if (!config.services.supabase.configured) {
      issues.push('Supabase configuration missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
      recommendations.push('Configure Supabase environment variables for authentication')
    }

    if (!config.services.database.configured) {
      issues.push('Database configuration missing (DATABASE_URL)')
      recommendations.push('Configure PostgreSQL/Supabase database connection')
    }

    if (!config.services.solver.configured) {
      issues.push('Solver service configuration missing (SOLVER_URL)')
      recommendations.push('Deploy FastAPI solver service and configure endpoint')
    }

    if (!config.services.spoonacular.configured) {
      issues.push('Spoonacular API configuration missing (SPOONACULAR_KEY)')
      recommendations.push('Get Spoonacular API key for recipe data')
    }
  }

  // Development recommendations
  if (config.mode === 'demo') {
    recommendations.push('Application running in demo mode - configure services for full functionality')
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations
  }
}

// Runtime environment info for debugging
export function getEnvironmentInfo() {
  const config = getEnvironmentConfig()
  const validation = validateEnvironment()

  return {
    config,
    validation,
    runtime: {
      nodeEnv: process.env.NODE_ENV,
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