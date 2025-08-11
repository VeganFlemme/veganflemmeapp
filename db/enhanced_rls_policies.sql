-- Enhanced Row Level Security Policies for VeganFlemme
-- Implements secure multi-tenant architecture with anonymous support

-- Enable RLS on all user-facing tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf.meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf.user_profile ENABLE ROW LEVEL SECURITY;

-- ==================================================================
-- PLANS TABLE POLICIES (Legacy support)
-- ==================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous plan creation" ON public.plans;
DROP POLICY IF EXISTS "Allow anonymous plan reading by email" ON public.plans;
DROP POLICY IF EXISTS "Allow authenticated users to create plans" ON public.plans;
DROP POLICY IF EXISTS "Allow authenticated users to read own plans" ON public.plans;
DROP POLICY IF EXISTS "Allow plan count queries" ON public.plans;

-- Policy 1: Allow anonymous users to insert plans (demo mode)
CREATE POLICY "Anonymous plan creation" ON public.plans 
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert their own plans
CREATE POLICY "Authenticated plan creation" ON public.plans 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        user_email IS NULL OR 
        user_email = auth.jwt() ->> 'email'
    );

-- Policy 3: Allow users to read their own plans
CREATE POLICY "User plan access" ON public.plans 
    FOR SELECT 
    TO anon, authenticated
    USING (
        user_email IS NULL OR -- Anonymous plans visible to all
        user_email = COALESCE(auth.jwt() ->> 'email', '') OR -- Authenticated user's plans
        current_setting('request.jwt.claims', true)::json ->> 'email' = user_email -- Alternative auth method
    );

-- Policy 4: Allow users to update their own plans
CREATE POLICY "User plan updates" ON public.plans 
    FOR UPDATE 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email')
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Policy 5: Allow users to delete their own plans
CREATE POLICY "User plan deletion" ON public.plans 
    FOR DELETE 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email');

-- ==================================================================
-- MEAL PLAN TABLE POLICIES (New schema)
-- ==================================================================

-- Policy 1: Users can insert their own meal plans
CREATE POLICY "Meal plan creation" ON vf.meal_plan 
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (
        user_email IS NULL OR -- Anonymous plans
        user_email = COALESCE(auth.jwt() ->> 'email', '') -- User plans
    );

-- Policy 2: Users can read their own meal plans
CREATE POLICY "Meal plan access" ON vf.meal_plan 
    FOR SELECT 
    TO anon, authenticated
    USING (
        user_email IS NULL OR -- Anonymous plans
        user_email = COALESCE(auth.jwt() ->> 'email', '')
    );

-- Policy 3: Users can update their own meal plans
CREATE POLICY "Meal plan updates" ON vf.meal_plan 
    FOR UPDATE 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email')
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Policy 4: Users can delete their own meal plans
CREATE POLICY "Meal plan deletion" ON vf.meal_plan 
    FOR DELETE 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email');

-- ==================================================================
-- USER PROFILE POLICIES
-- ==================================================================

-- Policy 1: Users can create their own profile
CREATE POLICY "Profile creation" ON vf.user_profile 
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Policy 2: Users can read their own profile
CREATE POLICY "Profile access" ON vf.user_profile 
    FOR SELECT 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email');

-- Policy 3: Users can update their own profile
CREATE POLICY "Profile updates" ON vf.user_profile 
    FOR UPDATE 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email')
    WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Policy 4: Users can delete their own profile
CREATE POLICY "Profile deletion" ON vf.user_profile 
    FOR DELETE 
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email');

-- ==================================================================
-- PUBLIC READ ACCESS FOR REFERENCE DATA
-- ==================================================================

-- Grant read access to nutritional reference data
GRANT USAGE ON SCHEMA ciqual TO anon, authenticated;
GRANT USAGE ON SCHEMA vf TO anon, authenticated;
GRANT USAGE ON SCHEMA off_link TO anon, authenticated;

-- CIQUAL data (read-only for all)
GRANT SELECT ON ALL TABLES IN SCHEMA ciqual TO anon, authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA ciqual TO anon, authenticated;

-- VF reference data (ingredients, recipes, nutrients)
GRANT SELECT ON vf.canonical_ingredient TO anon, authenticated;
GRANT SELECT ON vf.ingredient_nutrients TO anon, authenticated;
GRANT SELECT ON vf.recipe TO anon, authenticated;
GRANT SELECT ON vf.recipe_ingredient TO anon, authenticated;
GRANT SELECT ON vf.mv_recipe_nutrients TO anon, authenticated;

-- User data tables (controlled by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON vf.meal_plan TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vf.user_profile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO anon, authenticated;

-- Functions
GRANT EXECUTE ON FUNCTION vf.search_ingredient(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION vf.calculate_tdee(INTEGER, NUMERIC, INTEGER, TEXT, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION vf.calculate_macro_targets(INTEGER) TO anon, authenticated;

-- Sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA vf TO anon, authenticated;

-- ==================================================================
-- ADMIN POLICIES (For service role)
-- ==================================================================

-- Service role gets full access for admin operations
GRANT ALL ON ALL TABLES IN SCHEMA ciqual TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA vf TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA off_link TO service_role;
GRANT ALL ON ALL VIEWS IN SCHEMA ciqual TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA vf TO service_role;

-- ==================================================================
-- SECURITY FUNCTIONS
-- ==================================================================

-- Function to safely get user email from JWT
CREATE OR REPLACE FUNCTION auth.get_user_email()
RETURNS TEXT AS
$$
BEGIN
    RETURN COALESCE(
        auth.jwt() ->> 'email',
        current_setting('request.jwt.claims', true)::json ->> 'email',
        ''
    );
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS
$$
BEGIN
    RETURN COALESCE(
        (auth.jwt() ->> 'role') = 'admin',
        (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin',
        false
    );
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- HELPER VIEWS FOR APPLICATION
-- ==================================================================

-- View for user's own plans with metadata
CREATE OR REPLACE VIEW vf.user_plans AS
SELECT 
    mp.*,
    up.age,
    up.weight_kg,
    up.height_cm,
    up.goal,
    CASE 
        WHEN mp.created_at > NOW() - INTERVAL '7 days' THEN 'recent'
        WHEN mp.created_at > NOW() - INTERVAL '30 days' THEN 'current'
        ELSE 'archive'
    END as plan_status
FROM vf.meal_plan mp
LEFT JOIN vf.user_profile up ON mp.user_email = up.user_email
WHERE mp.user_email = auth.get_user_email();

-- Grant access to the view
GRANT SELECT ON vf.user_plans TO authenticated;

-- ==================================================================
-- LOGGING AND AUDIT
-- ==================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS vf.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    user_email TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION vf.audit_trigger()
RETURNS TRIGGER AS
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO vf.audit_log (table_name, operation, user_email, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, auth.get_user_email(), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO vf.audit_log (table_name, operation, user_email, old_values, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, auth.get_user_email(), to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO vf.audit_log (table_name, operation, user_email, old_values)
        VALUES (TG_TABLE_NAME, TG_OP, auth.get_user_email(), to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Enable audit logging on sensitive tables
CREATE TRIGGER tr_meal_plan_audit
    AFTER INSERT OR UPDATE OR DELETE ON vf.meal_plan
    FOR EACH ROW EXECUTE FUNCTION vf.audit_trigger();

CREATE TRIGGER tr_user_profile_audit
    AFTER INSERT OR UPDATE OR DELETE ON vf.user_profile
    FOR EACH ROW EXECUTE FUNCTION vf.audit_trigger();

-- Grant access to audit log for admins only
GRANT SELECT ON vf.audit_log TO service_role;

-- ==================================================================
-- COMMENTS
-- ==================================================================

COMMENT ON POLICY "Anonymous plan creation" ON public.plans IS 'Allows demo users to save plans without authentication';
COMMENT ON POLICY "User plan access" ON public.plans IS 'Users can only see their own plans plus anonymous demo plans';
COMMENT ON FUNCTION auth.get_user_email() IS 'Safely extracts user email from JWT token with fallbacks';
COMMENT ON VIEW vf.user_plans IS 'Enriched view of user plans with profile data and status';
COMMENT ON TABLE vf.audit_log IS 'Audit trail for sensitive operations on user data';