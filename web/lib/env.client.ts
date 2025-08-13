import { z } from 'zod';

// Client-side environment schema - only NEXT_PUBLIC_ variables are available in the browser
const clientEnvSchema = z.object({
  // Supabase public configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  
  // External APIs base URLs (if needed client-side)
  OFF_BASE: z.string().url().default('https://world.openfoodfacts.org'),
  
  // Node environment (available in both client and server)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate client environment variables
let clientEnv: z.infer<typeof clientEnvSchema> | null = null;

try {
  clientEnv = clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    OFF_BASE: process.env.OFF_BASE,
    NODE_ENV: process.env.NODE_ENV,
  });
} catch (error) {
  console.error('❌ Invalid client environment variables:', error);
  // In client environment, we should not throw but handle gracefully
  if (typeof window === 'undefined') {
    throw new Error('Invalid client environment configuration');
  }
}

export const env = {
  supabase: {
    url: clientEnv?.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: clientEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    configured: !!(clientEnv?.NEXT_PUBLIC_SUPABASE_URL && clientEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  openfoodfacts: {
    baseUrl: clientEnv?.OFF_BASE || 'https://world.openfoodfacts.org',
  },
  nodeEnv: clientEnv?.NODE_ENV || 'development',
  isProduction: clientEnv?.NODE_ENV === 'production',
  isDevelopment: clientEnv?.NODE_ENV === 'development',
  isTest: clientEnv?.NODE_ENV === 'test',
};

// Validation helper for client environment
export function validateClientEnv(): {
  valid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (env.isProduction && !env.supabase.configured) {
    issues.push('Supabase client configuration missing');
    recommendations.push('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}

export default env;