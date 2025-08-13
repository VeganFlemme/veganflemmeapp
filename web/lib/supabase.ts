import { createClient } from '@supabase/supabase-js';
import { env as clientEnv } from './env.client';
import { env as serverEnv } from './env.server';

// Client-side Supabase client (uses anon key, respects RLS)
export function createSupabaseClient() {
  if (!clientEnv.supabase.configured) {
    console.warn('Supabase client configuration missing - auth features disabled');
    return null;
  }

  return createClient(clientEnv.supabase.url!, clientEnv.supabase.anonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// Server-side Supabase admin client (uses service role key, bypasses RLS)
// This should ONLY be used in server-side code (API routes, server components)
export function createSupabaseAdminClient() {
  if (!clientEnv.supabase.url || !serverEnv.supabase.serviceRoleKey) {
    console.warn('Supabase admin configuration missing - admin operations disabled');
    return null;
  }

  return createClient(clientEnv.supabase.url, serverEnv.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Create client instances
const supabaseClient = createSupabaseClient();
const supabaseAdminClient = createSupabaseAdminClient();

export { supabaseClient as supabase, supabaseAdminClient as supabaseAdmin };

// Type definitions for our database schema
export interface UserProfile {
  id: string
  email: string
  age?: number
  weight?: number
  height?: number
  gender?: 'male' | 'female'
  activity_level?: number
  goal?: 'lose' | 'maintain' | 'gain'
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  user_email?: string
  plan_json: any
  created_at: string
}

export interface CanonicalIngredient {
  id: string
  name: string
  ciqual_code?: string
  off_barcode?: string
  tags?: string[]
  prep_complexity?: number
}

export interface IngredientNutrients {
  ingredient_id: string
  nutrients: {
    energy_kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
    b12_ug: number
    vitamin_d_ug: number
    calcium_mg: number
    iron_mg: number
    zinc_mg: number
    iodine_ug: number
    selenium_ug: number
    ala_g: number
  }
}

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, userData?: Partial<UserProfile>) => {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      ...(userData && {
        options: {
          data: userData
        }
      })
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signInWithMagicLink: async (email: string) => {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  signOut: async () => {
    if (!supabaseClient) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabaseClient.auth.signOut()
    return { error }
  },

  getUser: async () => {
    if (!supabaseClient) {
      return { user: null, error: { message: 'Supabase not configured' } }
    }
    const { data: { user }, error } = await supabaseClient.auth.getUser()
    return { user, error }
  },

  getSession: async () => {
    if (!supabaseClient) {
      return { session: null, error: { message: 'Supabase not configured' } }
    }
    const { data: { session }, error } = await supabaseClient.auth.getSession()
    return { session, error }
  }
}

// Database helper functions
export const db = {
  // Plans
  savePlan: async (planData: any, userEmail?: string) => {
    // Use admin client for server-side operations to bypass RLS
    const client = supabaseAdminClient || supabaseClient
    
    if (!client) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    
    try {
      // First attempt: try with select() to get the inserted data back
      const { data, error } = await client
        .from('plans')
        .insert({
          user_email: userEmail,
          plan_json: planData
        })
        .select()
        .single()
      
      if (!error && data) {
        return { data, error: null }
      }
      
      // If the above fails with RLS error, try without select()
      if (error && error.message?.includes('permission')) {
        const insertResult = await client
          .from('plans')
          .insert({
            user_email: userEmail,
            plan_json: planData
          })
        
        if (!insertResult.error) {
          // Return a mock successful response since we can't select the data back
          const mockData = {
            id: `inserted-${Date.now()}`,
            user_email: userEmail,
            plan_json: planData,
            created_at: new Date().toISOString()
          }
          return { data: mockData, error: null }
        }
        
        return { data: null, error: insertResult.error }
      }
      
      return { data, error }
    } catch (catchError) {
      return { data: null, error: catchError }
    }
  },

  getUserPlans: async (userEmail: string) => {
    if (!supabaseClient) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Ingredients search
  searchIngredients: async (query: string, limit: number = 10) => {
    if (!supabaseClient) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabaseClient
      .rpc('search_ingredient', { 
        q: query 
      })
      .limit(limit)
    
    return { data, error }
  },

  // Get ingredient nutrition data
  getIngredientNutrition: async (ingredientId: string) => {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabaseClient
      .from('ingredient_nutrients')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .single()
    
    return { data, error }
  },

  // Health check
  healthCheck: async () => {
    // Use admin client for health checks to bypass RLS
    const client = supabaseAdminClient || supabaseClient
    
    if (!client) {
      return { ok: false, error: { message: 'Supabase not configured' } }
    }
    try {
      const { data, error } = await client
        .from('plans')
        .select('count')
        .limit(1)
      
      return { ok: !error, error }
    } catch (error) {
      return { ok: false, error }
    }
  }
}

export default supabase