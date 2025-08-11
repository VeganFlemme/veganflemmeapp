-- VeganFlemme Complete Database Schema
-- Phase 1: Nutritional Data Infrastructure (CIQUAL/CALNUT Integration)
-- This implements the roadmap Phase 1 requirements for real nutritional data

-- Drop existing schemas if they exist
DROP SCHEMA IF EXISTS ciqual CASCADE;
DROP SCHEMA IF EXISTS vf CASCADE;
DROP SCHEMA IF EXISTS off_link CASCADE;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ciqual;
CREATE SCHEMA IF NOT EXISTS vf;
CREATE SCHEMA IF NOT EXISTS off_link;

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- ==================================================================
-- CIQUAL SCHEMA - Official French nutritional database
-- ==================================================================

-- Raw CIQUAL food composition table
CREATE TABLE ciqual.food_composition (
    ciqual_code TEXT PRIMARY KEY,
    food_name_fr TEXT NOT NULL,
    food_group TEXT,
    food_subgroup TEXT,
    -- Macronutrients (per 100g)
    energy_kcal NUMERIC(8,2),
    energy_kj NUMERIC(8,2),
    water_g NUMERIC(8,2),
    protein_g NUMERIC(8,2),
    carbohydrates_g NUMERIC(8,2),
    fat_g NUMERIC(8,2),
    fiber_g NUMERIC(8,2),
    -- Micronutrients (per 100g)
    vitamin_b12_ug NUMERIC(8,3),
    vitamin_d_ug NUMERIC(8,3),
    calcium_mg NUMERIC(8,2),
    iron_mg NUMERIC(8,2),
    zinc_mg NUMERIC(8,2),
    iodine_ug NUMERIC(8,3),
    selenium_ug NUMERIC(8,3),
    -- Essential fatty acids
    alpha_linolenic_acid_g NUMERIC(8,3), -- ALA (omega-3)
    -- Additional nutrients
    folate_ug NUMERIC(8,3),
    vitamin_b6_mg NUMERIC(8,3),
    magnesium_mg NUMERIC(8,2),
    phosphorus_mg NUMERIC(8,2),
    potassium_mg NUMERIC(8,2),
    sodium_mg NUMERIC(8,2),
    -- Meta information
    data_source TEXT DEFAULT 'CIQUAL',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_quality_score INTEGER DEFAULT 100 -- 0-100 quality score
);

-- CALNUT complementary data (for nutrients missing in CIQUAL)
CREATE TABLE ciqual.calnut_supplements (
    ciqual_code TEXT REFERENCES ciqual.food_composition(ciqual_code),
    -- Additional micronutrients not in CIQUAL
    vitamin_b1_mg NUMERIC(8,3),
    vitamin_b2_mg NUMERIC(8,3),
    vitamin_b3_mg NUMERIC(8,3),
    vitamin_b5_mg NUMERIC(8,3),
    vitamin_c_mg NUMERIC(8,2),
    vitamin_e_mg NUMERIC(8,3),
    vitamin_k_ug NUMERIC(8,3),
    biotin_ug NUMERIC(8,3),
    choline_mg NUMERIC(8,2),
    -- Trace elements
    chromium_ug NUMERIC(8,3),
    copper_mg NUMERIC(8,3),
    fluoride_mg NUMERIC(8,3),
    manganese_mg NUMERIC(8,3),
    molybdenum_ug NUMERIC(8,3),
    -- Data provenance
    data_source TEXT DEFAULT 'CALNUT',
    confidence_level INTEGER DEFAULT 80, -- 0-100 confidence
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (ciqual_code)
);

-- Unified view combining CIQUAL and CALNUT data
CREATE VIEW ciqual.food_norm AS
SELECT 
    fc.ciqual_code,
    fc.food_name_fr,
    fc.food_group,
    fc.food_subgroup,
    -- Core nutrients (prefer CIQUAL values)
    fc.energy_kcal,
    fc.protein_g,
    fc.carbohydrates_g as carbs_g,
    fc.fat_g,
    fc.fiber_g,
    -- Critical nutrients for vegans
    COALESCE(fc.vitamin_b12_ug, 0) as b12_ug,
    COALESCE(fc.vitamin_d_ug, 0) as vitamin_d_ug,
    COALESCE(fc.calcium_mg, 0) as calcium_mg,
    COALESCE(fc.iron_mg, 0) as iron_mg,
    COALESCE(fc.zinc_mg, 0) as zinc_mg,
    COALESCE(fc.iodine_ug, 0) as iodine_ug,
    COALESCE(fc.selenium_ug, 0) as selenium_ug,
    COALESCE(fc.alpha_linolenic_acid_g, 0) as ala_g,
    -- Additional nutrients from CALNUT
    COALESCE(cs.vitamin_c_mg, 0) as vitamin_c_mg,
    COALESCE(cs.folate_ug, fc.folate_ug, 0) as folate_ug,
    COALESCE(cs.magnesium_mg, fc.magnesium_mg, 0) as magnesium_mg,
    -- Quality indicators
    GREATEST(fc.data_quality_score, COALESCE(cs.confidence_level, 0)) as quality_score,
    CASE 
        WHEN cs.ciqual_code IS NOT NULL THEN 'CIQUAL+CALNUT'
        ELSE 'CIQUAL'
    END as data_source
FROM ciqual.food_composition fc
LEFT JOIN ciqual.calnut_supplements cs ON fc.ciqual_code = cs.ciqual_code;

-- Best quality nutrition data view (for applications)
CREATE VIEW ciqual.food_best AS
SELECT *
FROM ciqual.food_norm
WHERE quality_score >= 70  -- Only include high-quality data
ORDER BY quality_score DESC, data_source DESC;

-- ==================================================================
-- VF SCHEMA - VeganFlemme application tables
-- ==================================================================

-- Canonical ingredients (curated list of vegan foods)
CREATE TABLE vf.canonical_ingredient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    name_normalized TEXT NOT NULL, -- For search optimization
    ciqual_code TEXT REFERENCES ciqual.food_composition(ciqual_code),
    off_barcode TEXT, -- OpenFoodFacts barcode link
    tags TEXT[] DEFAULT '{}', -- e.g., ['protein', 'legume', 'soy']
    category TEXT, -- 'protein', 'vegetable', 'grain', 'fruit', 'nut', 'supplement'
    prep_complexity INTEGER DEFAULT 0, -- 0=raw, 1=simple, 2=cooking, 3=complex
    is_vegan BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    -- Search optimization
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredient nutrients (normalized format for optimization solver)
CREATE TABLE vf.ingredient_nutrients (
    ingredient_id UUID REFERENCES vf.canonical_ingredient(id) ON DELETE CASCADE,
    nutrients JSONB NOT NULL, -- Standardized nutrient format
    -- Example: {"energy_kcal": 150, "protein_g": 8.5, "carbs_g": 12, ...}
    per_100g BOOLEAN DEFAULT true,
    data_source TEXT DEFAULT 'computed',
    confidence_score INTEGER DEFAULT 100,
    last_computed TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (ingredient_id)
);

-- Recipe definitions
CREATE TABLE vf.recipe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    prep_time_min INTEGER DEFAULT 20,
    cook_time_min INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 2,
    difficulty INTEGER DEFAULT 1, -- 1=easy, 2=medium, 3=hard
    cost_estimate_eur NUMERIC(5,2) DEFAULT 3.50,
    tags TEXT[] DEFAULT '{}', -- e.g., ['quick', 'one-pot', 'high-protein']
    meal_type TEXT[] DEFAULT '{}', -- 'breakfast', 'lunch', 'dinner', 'snack'
    cuisine_type TEXT DEFAULT 'international',
    is_active BOOLEAN DEFAULT true,
    spoonacular_id TEXT, -- Link to external recipe
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe ingredients (quantities)
CREATE TABLE vf.recipe_ingredient (
    recipe_id UUID REFERENCES vf.recipe(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES vf.canonical_ingredient(id),
    quantity_g NUMERIC(8,2) NOT NULL, -- Amount in grams per serving
    is_optional BOOLEAN DEFAULT false,
    preparation_note TEXT, -- e.g., "chopped", "cooked", "drained"
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- Materialized view for recipe nutrition (computed from ingredients)
CREATE MATERIALIZED VIEW vf.mv_recipe_nutrients AS
SELECT 
    r.id as recipe_id,
    r.name as recipe_name,
    r.servings,
    -- Aggregate nutrients from all ingredients
    jsonb_build_object(
        'energy_kcal', ROUND(SUM((rin.nutrients->>'energy_kcal')::numeric * ri.quantity_g / 100), 1),
        'protein_g', ROUND(SUM((rin.nutrients->>'protein_g')::numeric * ri.quantity_g / 100), 1),
        'carbs_g', ROUND(SUM((rin.nutrients->>'carbs_g')::numeric * ri.quantity_g / 100), 1),
        'fat_g', ROUND(SUM((rin.nutrients->>'fat_g')::numeric * ri.quantity_g / 100), 1),
        'fiber_g', ROUND(SUM((rin.nutrients->>'fiber_g')::numeric * ri.quantity_g / 100), 1),
        'b12_ug', ROUND(SUM((rin.nutrients->>'b12_ug')::numeric * ri.quantity_g / 100), 2),
        'vitamin_d_ug', ROUND(SUM((rin.nutrients->>'vitamin_d_ug')::numeric * ri.quantity_g / 100), 2),
        'calcium_mg', ROUND(SUM((rin.nutrients->>'calcium_mg')::numeric * ri.quantity_g / 100), 1),
        'iron_mg', ROUND(SUM((rin.nutrients->>'iron_mg')::numeric * ri.quantity_g / 100), 1),
        'zinc_mg', ROUND(SUM((rin.nutrients->>'zinc_mg')::numeric * ri.quantity_g / 100), 1),
        'iodine_ug', ROUND(SUM((rin.nutrients->>'iodine_ug')::numeric * ri.quantity_g / 100), 1),
        'selenium_ug', ROUND(SUM((rin.nutrients->>'selenium_ug')::numeric * ri.quantity_g / 100), 1),
        'ala_g', ROUND(SUM((rin.nutrients->>'ala_g')::numeric * ri.quantity_g / 100), 2)
    ) as nutrients,
    COUNT(ri.ingredient_id) as ingredient_count,
    AVG(rin.confidence_score) as avg_confidence,
    NOW() as computed_at
FROM vf.recipe r
JOIN vf.recipe_ingredient ri ON r.id = ri.recipe_id
JOIN vf.ingredient_nutrients rin ON ri.ingredient_id = rin.ingredient_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.servings;

-- User meal plans
CREATE TABLE vf.meal_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT, -- NULL for anonymous plans
    plan_name TEXT DEFAULT 'Mon plan',
    plan_data JSONB NOT NULL, -- 7-day plan with recipes and servings
    nutritional_targets JSONB, -- Target values used for optimization
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT false
);

-- User profiles (for personalized nutrition targets)
CREATE TABLE vf.user_profile (
    user_email TEXT PRIMARY KEY,
    age INTEGER,
    weight_kg NUMERIC(5,2),
    height_cm INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level NUMERIC(3,2), -- 1.2 to 2.0 multiplier
    goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')),
    dietary_restrictions TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}', -- Custom preferences
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================================
-- SEARCH AND OPTIMIZATION FUNCTIONS
-- ==================================================================

-- Create immutable unaccent function for indexing
CREATE OR REPLACE FUNCTION vf.unaccent_immutable(text)
RETURNS text AS
$$
SELECT unaccent($1);
$$
LANGUAGE sql IMMUTABLE;

-- Update trigger for search vector
CREATE OR REPLACE FUNCTION vf.update_ingredient_search_vector()
RETURNS trigger AS
$$
BEGIN
    NEW.name_normalized := vf.unaccent_immutable(lower(NEW.name));
    NEW.search_vector := to_tsvector('french', NEW.name || ' ' || COALESCE(array_to_string(NEW.tags, ' '), ''));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- RPC function for ingredient search (trigram + full-text)
CREATE OR REPLACE FUNCTION vf.search_ingredient(q TEXT, max_results INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    tags TEXT[],
    prep_complexity INTEGER,
    similarity REAL
) AS
$$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.name,
        ci.category,
        ci.tags,
        ci.prep_complexity,
        GREATEST(
            similarity(ci.name_normalized, vf.unaccent_immutable(lower(q))),
            ts_rank(ci.search_vector, plainto_tsquery('french', q)) * 0.5
        ) as sim
    FROM vf.canonical_ingredient ci
    WHERE ci.is_active = true
      AND (
          ci.name_normalized % vf.unaccent_immutable(lower(q))
          OR ci.search_vector @@ plainto_tsquery('french', q)
          OR ci.name ILIKE '%' || q || '%'
      )
    ORDER BY sim DESC, ci.name
    LIMIT max_results;
END;
$$
LANGUAGE plpgsql;

-- Function to compute TDEE (Total Daily Energy Expenditure)
CREATE OR REPLACE FUNCTION vf.calculate_tdee(
    age INTEGER,
    weight_kg NUMERIC,
    height_cm INTEGER,
    gender TEXT,
    activity_level NUMERIC
) RETURNS NUMERIC AS
$$
DECLARE
    bmr NUMERIC;
    tdee NUMERIC;
BEGIN
    -- Mifflin-St Jeor equation
    IF gender = 'male' THEN
        bmr := 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    ELSE
        bmr := 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    END IF;
    
    tdee := bmr * activity_level;
    RETURN ROUND(tdee, 0);
END;
$$
LANGUAGE plpgsql;

-- Function to generate nutritional targets based on TDEE
CREATE OR REPLACE FUNCTION vf.calculate_macro_targets(tdee_kcal INTEGER)
RETURNS JSONB AS
$$
DECLARE
    targets JSONB;
BEGIN
    targets := jsonb_build_object(
        'energy_kcal', tdee_kcal,
        'protein_g', ROUND(tdee_kcal * 0.15 / 4, 0), -- 15% protein (4 kcal/g)
        'carbs_g', ROUND(tdee_kcal * 0.55 / 4, 0),   -- 55% carbs (4 kcal/g)
        'fat_g', ROUND(tdee_kcal * 0.30 / 9, 0),     -- 30% fat (9 kcal/g)
        'fiber_g', GREATEST(25, ROUND(tdee_kcal / 80, 0)), -- ~30g minimum
        -- Essential micronutrients for vegans
        'b12_ug', 4.0,
        'vitamin_d_ug', 15.0,
        'calcium_mg', 1000,
        'iron_mg', 18, -- Higher for vegans
        'zinc_mg', 11,
        'iodine_ug', 150,
        'selenium_ug', 70,
        'ala_g', ROUND(tdee_kcal * 0.01 / 9, 1) -- ~1% of energy as ALA
    );
    
    RETURN targets;
END;
$$
LANGUAGE plpgsql;

-- ==================================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================================

-- Trigram indexes for fuzzy search
CREATE INDEX idx_ingredient_name_trgm ON vf.canonical_ingredient 
USING gin (name_normalized gin_trgm_ops);

-- Full-text search index
CREATE INDEX idx_ingredient_search_vector ON vf.canonical_ingredient 
USING gin (search_vector);

-- Standard indexes
CREATE INDEX idx_ingredient_category ON vf.canonical_ingredient (category);
CREATE INDEX idx_ingredient_tags ON vf.canonical_ingredient USING gin (tags);
CREATE INDEX idx_ingredient_ciqual ON vf.canonical_ingredient (ciqual_code);

CREATE INDEX idx_recipe_meal_type ON vf.recipe USING gin (meal_type);
CREATE INDEX idx_recipe_tags ON vf.recipe USING gin (tags);
CREATE INDEX idx_recipe_active ON vf.recipe (is_active) WHERE is_active = true;

CREATE INDEX idx_meal_plan_user ON vf.meal_plan (user_email);
CREATE INDEX idx_meal_plan_created ON vf.meal_plan (created_at DESC);

-- ==================================================================
-- TRIGGERS
-- ==================================================================

-- Trigger for search vector updates
CREATE TRIGGER tr_ingredient_search_update
    BEFORE INSERT OR UPDATE ON vf.canonical_ingredient
    FOR EACH ROW
    EXECUTE FUNCTION vf.update_ingredient_search_vector();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION vf.update_updated_at()
RETURNS trigger AS
$$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER tr_ingredient_updated_at
    BEFORE UPDATE ON vf.canonical_ingredient
    FOR EACH ROW
    EXECUTE FUNCTION vf.update_updated_at();

CREATE TRIGGER tr_recipe_updated_at
    BEFORE UPDATE ON vf.recipe
    FOR EACH ROW
    EXECUTE FUNCTION vf.update_updated_at();

-- ==================================================================
-- INITIAL SAMPLE DATA
-- ==================================================================

-- Sample canonical ingredients (to be populated with real CIQUAL data)
INSERT INTO vf.canonical_ingredient (name, category, tags, prep_complexity) VALUES
-- Proteins
('Tofu ferme', 'protein', '{"protein", "soy", "versatile"}', 1),
('Tempeh', 'protein', '{"protein", "fermented", "complete"}', 2),
('Lentilles corail', 'protein', '{"protein", "legume", "quick"}', 2),
('Pois chiches', 'protein', '{"protein", "legume", "fiber"}', 2),
('Haricots noirs', 'protein', '{"protein", "legume", "fiber"}', 2),
-- Grains
('Quinoa', 'grain', '{"grain", "complete", "gluten-free"}', 2),
('Avoine', 'grain', '{"grain", "fiber", "breakfast"}', 1),
('Riz complet', 'grain', '{"grain", "fiber", "staple"}', 2),
-- Vegetables
('Épinards frais', 'vegetable', '{"green", "iron", "folate"}', 1),
('Brocolis', 'vegetable', '{"green", "vitamin-c", "calcium"}', 2),
('Carottes', 'vegetable', '{"orange", "beta-carotene", "sweet"}', 1),
-- Nuts and seeds
('Graines de chia', 'seed', '{"omega-3", "fiber", "calcium"}', 0),
('Graines de tournesol', 'seed', '{"vitamin-e", "magnesium", "protein"}', 0),
('Amandes', 'nut', '{"protein", "vitamin-e", "calcium"}', 0),
('Noix', 'nut', '{"omega-3", "protein", "magnesium"}', 0),
-- Supplements
('Levure nutritionnelle', 'supplement', '{"b12", "protein", "umami"}', 0),
('Spiruline', 'supplement', '{"protein", "b12", "iron"}', 0);

-- Sample nutrient data (this would be populated from CIQUAL in production)
INSERT INTO vf.ingredient_nutrients (ingredient_id, nutrients) 
SELECT 
    id,
    CASE name
        WHEN 'Tofu ferme' THEN '{"energy_kcal": 145, "protein_g": 15.7, "carbs_g": 4.3, "fat_g": 8.7, "fiber_g": 2.3, "b12_ug": 0, "vitamin_d_ug": 0, "calcium_mg": 350, "iron_mg": 2.7, "zinc_mg": 1.6, "iodine_ug": 2, "selenium_ug": 17, "ala_g": 0.8}'::jsonb
        WHEN 'Lentilles corail' THEN '{"energy_kcal": 116, "protein_g": 9.0, "carbs_g": 20.1, "fat_g": 0.4, "fiber_g": 7.9, "b12_ug": 0, "vitamin_d_ug": 0, "calcium_mg": 19, "iron_mg": 3.3, "zinc_mg": 1.3, "iodine_ug": 1, "selenium_ug": 8, "ala_g": 0.05}'::jsonb
        WHEN 'Quinoa' THEN '{"energy_kcal": 368, "protein_g": 14.1, "carbs_g": 64.2, "fat_g": 6.1, "fiber_g": 7.0, "b12_ug": 0, "vitamin_d_ug": 0, "calcium_mg": 47, "iron_mg": 4.6, "zinc_mg": 3.1, "iodine_ug": 0, "selenium_ug": 5, "ala_g": 0.26}'::jsonb
        WHEN 'Épinards frais' THEN '{"energy_kcal": 23, "protein_g": 2.9, "carbs_g": 3.6, "fat_g": 0.4, "fiber_g": 2.2, "b12_ug": 0, "vitamin_d_ug": 0, "calcium_mg": 99, "iron_mg": 2.7, "zinc_mg": 0.5, "iodine_ug": 12, "selenium_ug": 1, "ala_g": 0.14}'::jsonb
        WHEN 'Graines de chia' THEN '{"energy_kcal": 486, "protein_g": 16.5, "carbs_g": 42.1, "fat_g": 30.7, "fiber_g": 34.4, "b12_ug": 0, "vitamin_d_ug": 0, "calcium_mg": 631, "iron_mg": 7.7, "zinc_mg": 4.6, "iodine_ug": 1, "selenium_ug": 55, "ala_g": 17.8}'::jsonb
        WHEN 'Levure nutritionnelle' THEN '{"energy_kcal": 325, "protein_g": 45.0, "carbs_g": 35.0, "fat_g": 5.0, "fiber_g": 20.0, "b12_ug": 130, "vitamin_d_ug": 0, "calcium_mg": 20, "iron_mg": 18.0, "zinc_mg": 7.8, "iodine_ug": 0, "selenium_ug": 34, "ala_g": 0.1}'::jsonb
        ELSE '{"energy_kcal": 100, "protein_g": 5, "carbs_g": 10, "fat_g": 2, "fiber_g": 3, "b12_ug": 0, "vitamin_d_ug": 0, "calcium_mg": 50, "iron_mg": 2, "zinc_mg": 1, "iodine_ug": 1, "selenium_ug": 5, "ala_g": 0.1}'::jsonb
    END
FROM vf.canonical_ingredient;

-- ==================================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================================

COMMENT ON SCHEMA ciqual IS 'ANSES CIQUAL nutritional database and CALNUT supplements';
COMMENT ON SCHEMA vf IS 'VeganFlemme application tables (ingredients, recipes, plans)';
COMMENT ON SCHEMA off_link IS 'OpenFoodFacts integration tables';

COMMENT ON TABLE vf.canonical_ingredient IS 'Curated list of vegan ingredients with nutritional data';
COMMENT ON TABLE vf.ingredient_nutrients IS 'Standardized nutrient profiles for optimization solver';
COMMENT ON TABLE vf.recipe IS 'Recipe definitions with metadata for meal planning';
COMMENT ON MATERIALIZED VIEW vf.mv_recipe_nutrients IS 'Pre-computed recipe nutrition for performance';

COMMENT ON FUNCTION vf.search_ingredient IS 'Fuzzy search for ingredients using trigram similarity and full-text search';
COMMENT ON FUNCTION vf.calculate_tdee IS 'Calculate Total Daily Energy Expenditure using Mifflin-St Jeor equation';
COMMENT ON FUNCTION vf.calculate_macro_targets IS 'Generate nutritional targets based on TDEE for vegan diet';