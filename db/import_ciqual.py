#!/usr/bin/env python3
"""
CIQUAL Data Import Script for VeganFlemme
This script downloads and imports official French nutritional data from ANSES CIQUAL database.

Roadmap Phase 1: Real Nutritional Data Implementation
- Downloads CIQUAL 2020 dataset from official ANSES source
- Cleans and normalizes data for PostgreSQL import
- Filters for vegan-compatible foods only
- Populates canonical ingredients with real nutritional values

Usage:
    python import_ciqual.py --database-url "postgresql://..." --download
    
Dependencies:
    pip install requests pandas psycopg2-binary
"""

import os
import sys
import argparse
import requests
import zipfile
import csv
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

try:
    import pandas as pd
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Install with: pip install requests pandas psycopg2-binary")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CIQUALImporter:
    """Imports CIQUAL nutritional database into VeganFlemme schema"""
    
    # Official CIQUAL 2020 download URL
    CIQUAL_URL = "https://ciqual.anses.fr/cms/sites/default/files/inline-files/TableCiqual2020_Donneescsv.zip"
    
    # Nutrient mapping: CIQUAL column names to our standardized format
    NUTRIENT_MAPPING = {
        'Energie, Règlement UE N° 1169/2011 (kcal/100 g)': 'energy_kcal',
        'Energie, Règlement UE N° 1169/2011 (kJ/100 g)': 'energy_kj',
        'Eau (g/100 g)': 'water_g',
        'Protéines, N x facteur de Jones (g/100 g)': 'protein_g',
        'Glucides (g/100 g)': 'carbohydrates_g',
        'Lipides (g/100 g)': 'fat_g',
        'Fibres alimentaires (g/100 g)': 'fiber_g',
        'Vitamine B12 (µg/100 g)': 'vitamin_b12_ug',
        'Vitamine D (µg/100 g)': 'vitamin_d_ug',
        'Calcium (mg/100 g)': 'calcium_mg',
        'Fer (mg/100 g)': 'iron_mg',
        'Zinc (mg/100 g)': 'zinc_mg',
        'Iode (µg/100 g)': 'iodine_ug',
        'Sélénium (µg/100 g)': 'selenium_ug',
        'AG 18:3 c9,c12,c15 (n-3), alpha-linolénique (g/100 g)': 'alpha_linolenic_acid_g',
        'Folates totaux (µg/100 g)': 'folate_ug',
        'Vitamine B6 (mg/100 g)': 'vitamin_b6_mg',
        'Magnésium (mg/100 g)': 'magnesium_mg',
        'Phosphore (mg/100 g)': 'phosphorus_mg',
        'Potassium (mg/100 g)': 'potassium_mg',
        'Sodium (mg/100 g)': 'sodium_mg',
    }
    
    # Food groups to exclude (non-vegan)
    EXCLUDED_GROUPS = [
        'viandes', 'poissons', 'produits laitiers', 'œufs', 'charcuteries',
        'meat', 'fish', 'dairy', 'eggs', 'poultry', 'seafood'
    ]
    
    def __init__(self, database_url: str, data_dir: str = "./data"):
        self.database_url = database_url
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
    def download_ciqual_data(self) -> Path:
        """Download and extract CIQUAL dataset"""
        logger.info("Downloading CIQUAL 2020 dataset...")
        
        zip_path = self.data_dir / "ciqual_2020.zip"
        extract_path = self.data_dir / "ciqual_2020"
        
        # Download if not exists
        if not zip_path.exists():
            response = requests.get(self.CIQUAL_URL, stream=True)
            response.raise_for_status()
            
            with open(zip_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            logger.info(f"Downloaded to {zip_path}")
        
        # Extract if not exists
        if not extract_path.exists():
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            logger.info(f"Extracted to {extract_path}")
        
        # Find the main CSV file
        csv_files = list(extract_path.glob("**/*.csv"))
        if not csv_files:
            raise FileNotFoundError("No CSV files found in CIQUAL dataset")
        
        main_csv = max(csv_files, key=lambda p: p.stat().st_size)
        logger.info(f"Using main CSV file: {main_csv}")
        return main_csv
    
    def clean_numeric_value(self, value: str) -> Optional[float]:
        """Clean and convert numeric values from CIQUAL format"""
        if pd.isna(value) or value == '' or value == '-':
            return None
        
        # Handle French decimal separator and remove spaces
        if isinstance(value, str):
            value = value.replace(',', '.').replace(' ', '').strip()
            # Remove any trailing text like "traces"
            value = re.sub(r'[<>]', '', value)  # Remove < > symbols
            try:
                return float(value)
            except ValueError:
                return None
        
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def is_vegan_food(self, food_name: str, food_group: str, food_subgroup: str) -> bool:
        """Determine if a food item is vegan"""
        # Combine all text for analysis
        text = f"{food_name} {food_group} {food_subgroup}".lower()
        
        # Check for non-vegan keywords
        non_vegan_keywords = [
            'viande', 'porc', 'bœuf', 'veau', 'agneau', 'mouton', 'volaille', 'poulet', 'canard',
            'poisson', 'saumon', 'thon', 'crevette', 'moule', 'huître',
            'lait', 'fromage', 'yaourt', 'beurre', 'crème', 'lactose',
            'œuf', 'oeuf', 'mayonnaise',
            'miel', 'gelée royale', 'propolis',
            'gélatine', 'collagène'
        ]
        
        if any(keyword in text for keyword in non_vegan_keywords):
            return False
        
        # Check food groups
        if any(excluded in food_group.lower() for excluded in self.EXCLUDED_GROUPS):
            return False
            
        return True
    
    def process_ciqual_csv(self, csv_path: Path) -> List[Dict[str, Any]]:
        """Process CIQUAL CSV and extract vegan foods with clean data"""
        logger.info(f"Processing CSV file: {csv_path}")
        
        # Read CSV with proper encoding
        try:
            df = pd.read_csv(csv_path, encoding='utf-8', sep=';')
        except UnicodeDecodeError:
            df = pd.read_csv(csv_path, encoding='latin-1', sep=';')
        
        logger.info(f"Loaded {len(df)} food items")
        
        # Expected columns (may vary by CIQUAL version)
        if 'alim_code' in df.columns:
            code_col = 'alim_code'
        elif 'Code' in df.columns:
            code_col = 'Code'
        else:
            raise ValueError("Cannot find food code column in CSV")
        
        if 'alim_nom_fr' in df.columns:
            name_col = 'alim_nom_fr'
        elif 'Nom' in df.columns:
            name_col = 'Nom'
        else:
            raise ValueError("Cannot find food name column in CSV")
        
        processed_foods = []
        vegan_count = 0
        
        for _, row in df.iterrows():
            food_code = str(row.get(code_col, '')).strip()
            food_name = str(row.get(name_col, '')).strip()
            food_group = str(row.get('alim_grp_nom_fr', row.get('Groupe', ''))).strip()
            food_subgroup = str(row.get('alim_ssgrp_nom_fr', row.get('Sous-groupe', ''))).strip()
            
            if not food_code or not food_name:
                continue
            
            # Check if vegan
            if not self.is_vegan_food(food_name, food_group, food_subgroup):
                continue
            
            vegan_count += 1
            
            # Extract and clean nutrients
            nutrients = {}
            for ciqual_col, our_col in self.NUTRIENT_MAPPING.items():
                if ciqual_col in row:
                    cleaned_value = self.clean_numeric_value(row[ciqual_col])
                    nutrients[our_col] = cleaned_value
            
            # Calculate data quality score
            total_nutrients = len(self.NUTRIENT_MAPPING)
            available_nutrients = sum(1 for v in nutrients.values() if v is not None)
            quality_score = int((available_nutrients / total_nutrients) * 100)
            
            food_item = {
                'ciqual_code': food_code,
                'food_name_fr': food_name,
                'food_group': food_group,
                'food_subgroup': food_subgroup,
                'data_quality_score': quality_score,
                **nutrients
            }
            
            processed_foods.append(food_item)
        
        logger.info(f"Processed {vegan_count} vegan foods out of {len(df)} total")
        return processed_foods
    
    def connect_database(self):
        """Connect to PostgreSQL database"""
        return psycopg2.connect(self.database_url)
    
    def import_to_database(self, foods: List[Dict[str, Any]]) -> None:
        """Import processed foods to database"""
        logger.info(f"Importing {len(foods)} foods to database...")
        
        with self.connect_database() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Ensure schemas exist
                cur.execute("CREATE SCHEMA IF NOT EXISTS ciqual;")
                cur.execute("CREATE SCHEMA IF NOT EXISTS vf;")
                
                # Create tables if not exist (basic version)
                self.ensure_tables_exist(cur)
                
                # Clear existing data
                cur.execute("TRUNCATE TABLE ciqual.food_composition CASCADE;")
                
                # Prepare insert statement
                insert_sql = """
                INSERT INTO ciqual.food_composition (
                    ciqual_code, food_name_fr, food_group, food_subgroup,
                    energy_kcal, energy_kj, water_g, protein_g, carbohydrates_g, fat_g, fiber_g,
                    vitamin_b12_ug, vitamin_d_ug, calcium_mg, iron_mg, zinc_mg, iodine_ug, selenium_ug,
                    alpha_linolenic_acid_g, folate_ug, vitamin_b6_mg, magnesium_mg, phosphorus_mg,
                    potassium_mg, sodium_mg, data_quality_score
                ) VALUES (
                    %(ciqual_code)s, %(food_name_fr)s, %(food_group)s, %(food_subgroup)s,
                    %(energy_kcal)s, %(energy_kj)s, %(water_g)s, %(protein_g)s, %(carbohydrates_g)s, 
                    %(fat_g)s, %(fiber_g)s, %(vitamin_b12_ug)s, %(vitamin_d_ug)s, %(calcium_mg)s, 
                    %(iron_mg)s, %(zinc_mg)s, %(iodine_ug)s, %(selenium_ug)s, %(alpha_linolenic_acid_g)s,
                    %(folate_ug)s, %(vitamin_b6_mg)s, %(magnesium_mg)s, %(phosphorus_mg)s,
                    %(potassium_mg)s, %(sodium_mg)s, %(data_quality_score)s
                ) ON CONFLICT (ciqual_code) DO UPDATE SET
                    food_name_fr = EXCLUDED.food_name_fr,
                    food_group = EXCLUDED.food_group,
                    food_subgroup = EXCLUDED.food_subgroup,
                    energy_kcal = EXCLUDED.energy_kcal,
                    protein_g = EXCLUDED.protein_g,
                    carbohydrates_g = EXCLUDED.carbohydrates_g,
                    fat_g = EXCLUDED.fat_g,
                    fiber_g = EXCLUDED.fiber_g,
                    vitamin_b12_ug = EXCLUDED.vitamin_b12_ug,
                    vitamin_d_ug = EXCLUDED.vitamin_d_ug,
                    calcium_mg = EXCLUDED.calcium_mg,
                    iron_mg = EXCLUDED.iron_mg,
                    zinc_mg = EXCLUDED.zinc_mg,
                    iodine_ug = EXCLUDED.iodine_ug,
                    selenium_ug = EXCLUDED.selenium_ug,
                    alpha_linolenic_acid_g = EXCLUDED.alpha_linolenic_acid_g,
                    data_quality_score = EXCLUDED.data_quality_score,
                    last_updated = NOW();
                """
                
                # Insert in batches
                batch_size = 100
                for i in range(0, len(foods), batch_size):
                    batch = foods[i:i + batch_size]
                    cur.executemany(insert_sql, batch)
                    logger.info(f"Inserted batch {i//batch_size + 1}/{(len(foods) + batch_size - 1)//batch_size}")
                
                conn.commit()
                
                # Update canonical ingredients
                self.update_canonical_ingredients(cur)
                conn.commit()
                
        logger.info("Database import completed successfully!")
    
    def ensure_tables_exist(self, cursor):
        """Create basic table structure if it doesn't exist"""
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ciqual.food_composition (
            ciqual_code TEXT PRIMARY KEY,
            food_name_fr TEXT NOT NULL,
            food_group TEXT,
            food_subgroup TEXT,
            energy_kcal NUMERIC(8,2),
            energy_kj NUMERIC(8,2),
            water_g NUMERIC(8,2),
            protein_g NUMERIC(8,2),
            carbohydrates_g NUMERIC(8,2),
            fat_g NUMERIC(8,2),
            fiber_g NUMERIC(8,2),
            vitamin_b12_ug NUMERIC(8,3),
            vitamin_d_ug NUMERIC(8,3),
            calcium_mg NUMERIC(8,2),
            iron_mg NUMERIC(8,2),
            zinc_mg NUMERIC(8,2),
            iodine_ug NUMERIC(8,3),
            selenium_ug NUMERIC(8,3),
            alpha_linolenic_acid_g NUMERIC(8,3),
            folate_ug NUMERIC(8,3),
            vitamin_b6_mg NUMERIC(8,3),
            magnesium_mg NUMERIC(8,2),
            phosphorus_mg NUMERIC(8,2),
            potassium_mg NUMERIC(8,2),
            sodium_mg NUMERIC(8,2),
            data_source TEXT DEFAULT 'CIQUAL',
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            data_quality_score INTEGER DEFAULT 100
        );
        """)
    
    def update_canonical_ingredients(self, cursor):
        """Update canonical ingredients with CIQUAL data"""
        logger.info("Updating canonical ingredients with CIQUAL data...")
        
        # Link existing ingredients to CIQUAL data
        cursor.execute("""
        UPDATE vf.canonical_ingredient ci
        SET ciqual_code = fc.ciqual_code
        FROM ciqual.food_composition fc
        WHERE ci.ciqual_code IS NULL
          AND ci.is_vegan = true
          AND (
              LOWER(fc.food_name_fr) LIKE '%' || LOWER(ci.name) || '%'
              OR LOWER(ci.name) LIKE '%' || LOWER(fc.food_name_fr) || '%'
          );
        """)
        
        # Update ingredient nutrients from CIQUAL
        cursor.execute("""
        INSERT INTO vf.ingredient_nutrients (ingredient_id, nutrients, data_source, confidence_score)
        SELECT 
            ci.id,
            jsonb_build_object(
                'energy_kcal', COALESCE(fc.energy_kcal, 0),
                'protein_g', COALESCE(fc.protein_g, 0),
                'carbs_g', COALESCE(fc.carbohydrates_g, 0),
                'fat_g', COALESCE(fc.fat_g, 0),
                'fiber_g', COALESCE(fc.fiber_g, 0),
                'b12_ug', COALESCE(fc.vitamin_b12_ug, 0),
                'vitamin_d_ug', COALESCE(fc.vitamin_d_ug, 0),
                'calcium_mg', COALESCE(fc.calcium_mg, 0),
                'iron_mg', COALESCE(fc.iron_mg, 0),
                'zinc_mg', COALESCE(fc.zinc_mg, 0),
                'iodine_ug', COALESCE(fc.iodine_ug, 0),
                'selenium_ug', COALESCE(fc.selenium_ug, 0),
                'ala_g', COALESCE(fc.alpha_linolenic_acid_g, 0)
            ),
            'CIQUAL',
            fc.data_quality_score
        FROM vf.canonical_ingredient ci
        JOIN ciqual.food_composition fc ON ci.ciqual_code = fc.ciqual_code
        WHERE ci.is_vegan = true
        ON CONFLICT (ingredient_id) DO UPDATE SET
            nutrients = EXCLUDED.nutrients,
            data_source = EXCLUDED.data_source,
            confidence_score = EXCLUDED.confidence_score,
            last_computed = NOW();
        """)

def main():
    parser = argparse.ArgumentParser(description='Import CIQUAL nutritional data')
    parser.add_argument('--database-url', required=True, help='PostgreSQL database URL')
    parser.add_argument('--download', action='store_true', help='Download CIQUAL data')
    parser.add_argument('--data-dir', default='./data', help='Data directory')
    parser.add_argument('--skip-download', action='store_true', help='Skip download, use existing data')
    
    args = parser.parse_args()
    
    importer = CIQUALImporter(args.database_url, args.data_dir)
    
    try:
        if args.download and not args.skip_download:
            csv_path = importer.download_ciqual_data()
        else:
            # Look for existing CSV
            csv_files = list(Path(args.data_dir).glob("**/*.csv"))
            if not csv_files:
                logger.error("No CSV files found. Use --download to fetch CIQUAL data.")
                return 1
            csv_path = max(csv_files, key=lambda p: p.stat().st_size)
            logger.info(f"Using existing CSV: {csv_path}")
        
        foods = importer.process_ciqual_csv(csv_path)
        importer.import_to_database(foods)
        
        logger.info("✅ CIQUAL import completed successfully!")
        logger.info(f"   Imported {len(foods)} vegan food items")
        logger.info("   Next steps:")
        logger.info("   1. Run CALNUT supplement import")
        logger.info("   2. Test ingredient search functionality")
        logger.info("   3. Verify nutritional data accuracy")
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())