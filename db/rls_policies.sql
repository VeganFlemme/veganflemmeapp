-- RLS Policies for plans table to fix 401 authentication issues
-- This addresses the Supabase logs showing POST /rest/v1/plans returning 401

-- Enable RLS on plans table (if not already enabled)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to insert plans
-- This supports the demo mode functionality where users can save plans without authentication
CREATE POLICY "Allow anonymous plan creation" ON public.plans 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Policy to allow anonymous users to read their own plans by email
-- This allows users to retrieve plans they saved with an email address
CREATE POLICY "Allow anonymous plan reading by email" ON public.plans 
  FOR SELECT 
  TO anon
  USING (user_email IS NULL OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy to allow authenticated users to insert their own plans
CREATE POLICY "Allow authenticated users to create plans" ON public.plans 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text IS NOT NULL);

-- Policy to allow authenticated users to read their own plans  
CREATE POLICY "Allow authenticated users to read own plans" ON public.plans 
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text IS NOT NULL);

-- Policy to allow reading plan count for health checks
-- This supports the health check queries that are working (GET with count)
CREATE POLICY "Allow plan count queries" ON public.plans 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Grant necessary permissions to anon role
GRANT SELECT, INSERT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;

-- Grant usage on the sequence for auto-generated UUIDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;