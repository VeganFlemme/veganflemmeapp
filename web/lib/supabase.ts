import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any = null

// Only create Supabase client if environment variables are available
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
} else {
  console.warn('Supabase environment variables not configured - auth features disabled')
}

export { supabase }

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
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signInWithMagicLink: async (email: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  signOut: async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getUser: async () => {
    if (!supabase) {
      return { user: null, error: { message: 'Supabase not configured' } }
    }
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getSession: async () => {
    if (!supabase) {
      return { session: null, error: { message: 'Supabase not configured' } }
    }
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

// Database helper functions
export const db = {
  // Plans
  savePlan: async (planData: any, userEmail?: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('plans')
      .insert({
        user_email: userEmail,
        plan_json: planData
      })
      .select()
      .single()
    
    return { data, error }
  },

  getUserPlans: async (userEmail: string) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Ingredients search
  searchIngredients: async (query: string, limit: number = 10) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .rpc('search_ingredient', { 
        q: query 
      })
      .limit(limit)
    
    return { data, error }
  },

  // Get ingredient nutrition data
  getIngredientNutrition: async (ingredientId: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('ingredient_nutrients')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .single()
    
    return { data, error }
  },

  // Health check
  healthCheck: async () => {
    if (!supabase) {
      return { ok: false, error: { message: 'Supabase not configured' } }
    }
    try {
      const { data, error } = await supabase
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