import { z } from 'zod';

// Server-side environment schema - these should NEVER be exposed to the client
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // Supabase service role (admin operations only, bypasses RLS)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // External APIs
  SOLVER_URL: z.string().url().optional(),
  SPOONACULAR_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate server environment variables
let serverEnv: z.infer<typeof serverEnvSchema>;

try {
  serverEnv = serverEnvSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid server environment variables:', error);
  throw new Error('Invalid server environment configuration');
}

export const env = {
  database: {
    url: serverEnv.DATABASE_URL,
    configured: !!serverEnv.DATABASE_URL,
  },
  supabase: {
    serviceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    adminConfigured: !!serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  },
  solver: {
    url: serverEnv.SOLVER_URL,
    configured: !!serverEnv.SOLVER_URL,
  },
  spoonacular: {
    key: serverEnv.SPOONACULAR_KEY,
    configured: !!serverEnv.SPOONACULAR_KEY,
  },
  openai: {
    key: serverEnv.OPENAI_API_KEY,
    model: serverEnv.OPENAI_MODEL,
    configured: !!serverEnv.OPENAI_API_KEY,
  },
  nodeEnv: serverEnv.NODE_ENV,
  isProduction: serverEnv.NODE_ENV === 'production',
  isDevelopment: serverEnv.NODE_ENV === 'development',
  isTest: serverEnv.NODE_ENV === 'test',
};

// Validation helper for production readiness
export function validateServerEnv(): {
  valid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (env.isProduction) {
    if (!env.database.configured) {
      issues.push('DATABASE_URL is required in production');
      recommendations.push('Configure PostgreSQL/Supabase database connection');
    }

    if (!env.supabase.adminConfigured) {
      issues.push('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
      recommendations.push('Configure Supabase service role key for server-side operations');
    }

    if (!env.solver.configured) {
      issues.push('SOLVER_URL is required for meal planning functionality');
      recommendations.push('Deploy and configure FastAPI solver service');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}

export default env;