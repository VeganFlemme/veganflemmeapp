#!/bin/bash
# VeganFlemme Database Setup Script
# This script sets up the complete database schema and imports CIQUAL data

set -e

DB_URL="${DATABASE_URL:-postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres}"

echo "🚀 VeganFlemme Database Setup"
echo "Database URL: ${DB_URL}"

# Function to execute SQL file
execute_sql() {
    local file=$1
    echo "📄 Executing $file..."
    if psql "$DB_URL" -f "$file"; then
        echo "✅ $file executed successfully"
    else
        echo "❌ Failed to execute $file"
        exit 1
    fi
}

# Function to check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        echo "❌ psql not found. Please install PostgreSQL client."
        echo "Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "macOS: brew install postgresql"
        exit 1
    fi
}

# Function to test database connection
test_connection() {
    echo "🔌 Testing database connection..."
    if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        echo "Please check your DATABASE_URL and network connectivity"
        exit 1
    fi
}

# Main setup process
main() {
    check_psql
    test_connection
    
    echo "📋 Setting up database schema..."
    
    # Execute schema files in order
    execute_sql "db/schema.sql"
    execute_sql "db/complete_schema.sql"
    execute_sql "db/rls_policies.sql"
    execute_sql "db/enhanced_rls_policies.sql"
    execute_sql "db/plans.sql"
    
    echo "🗂️ Database schema setup complete!"
    
    # Check if Python is available for CIQUAL import
    if command -v python3 &> /dev/null; then
        echo "🍽️ Setting up CIQUAL data import..."
        cd db
        
        # Install required Python packages if not already installed
        if ! python3 -c "import pandas, psycopg2" 2>/dev/null; then
            echo "📦 Installing required Python packages..."
            pip3 install pandas psycopg2-binary requests
        fi
        
        echo "⬇️ Running CIQUAL import script..."
        python3 import_ciqual.py --database-url "$DB_URL" --download
        
        cd ..
    else
        echo "⚠️ Python3 not found. Skipping CIQUAL data import."
        echo "To import CIQUAL data later, run:"
        echo "cd db && python3 import_ciqual.py --database-url '$DB_URL' --download"
    fi
    
    echo "🎉 Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Verify data import: psql '$DB_URL' -c 'SELECT count(*) FROM ciqual.food_composition;'"
    echo "2. Test search function: psql '$DB_URL' -c \"SELECT * FROM vf.search_ingredient('tofu') LIMIT 5;\""
    echo "3. Deploy solver service to Railway"
    echo "4. Deploy web app to Vercel with production environment variables"
}

main "$@"