#!/bin/bash
# Emerald DevDashboard - Quick Start Script
# ============================================================================

set -e

echo "🌿 Emerald DevDashboard - Quick Start Setup"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Check Prerequisites
# ============================================================================

echo -e "\n${BLUE}[1/5] Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Install with: brew install postgresql"
    exit 1
fi

echo -e "${GREEN}✓ Python and PostgreSQL found${NC}"

# ============================================================================
# 2. Database Setup
# ============================================================================

echo -e "\n${BLUE}[2/5] Setting up database...${NC}"

read -p "PostgreSQL Username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "PostgreSQL Password (default: postgres): " DB_PASS
DB_PASS=${DB_PASS:-postgres}

read -p "Database name (default: emerald_content): " DB_NAME
DB_NAME=${DB_NAME:-emerald_content}

read -p "PostgreSQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

# Create database
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE $DB_NAME"

echo -e "${GREEN}✓ Database created/exists${NC}"

# Run migrations
echo "Running migrations..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f backend/init_sql/002_devdash_migrations.sql > /dev/null 2>&1

echo -e "${GREEN}✓ Migrations completed${NC}"

# ============================================================================
# 3. Environment Setup
# ============================================================================

echo -e "\n${BLUE}[3/5] Setting up environment...${NC}"

# Copy .env file
if [ ! -f "backend/.env" ]; then
    cp backend/.env.devdash.example backend/.env
    echo -e "${GREEN}✓ .env created${NC}"
    
    # Prompt for important values
    read -p "Telegram Bot Token (BOT1_TOKEN): " BOT_TOKEN
    read -p "Bot Username (e.g. MyBotName): " BOT_USERNAME
    read -p "Secret Key (min 32 chars): " SECRET_KEY
    
    # Update .env
    sed -i.bak "s|your_telegram_bot_token_here|$BOT_TOKEN|g" backend/.env
    sed -i.bak "s|YourBotName|$BOT_USERNAME|g" backend/.env
    sed -i.bak "s|your_secret_key_min_32_characters_very_secure_key_here|$SECRET_KEY|g" backend/.env
    sed -i.bak "s|postgresql://postgres:postgres@localhost:5432/emerald_content|postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/$DB_NAME|g" backend/.env
    
    rm backend/.env.bak
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# ============================================================================
# 4. Python Dependencies
# ============================================================================

echo -e "\n${BLUE}[4/5] Installing Python dependencies...${NC}"

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -q aiohttp psycopg-pool python-dotenv pyjwt httpx

echo -e "${GREEN}✓ Dependencies installed${NC}"

# ============================================================================
# 5. Start Services
# ============================================================================

echo -e "\n${BLUE}[5/5] Starting services...${NC}"

echo -e "\n${GREEN}✓ Setup complete!${NC}"

echo -e "\n${BLUE}Quick commands:${NC}"
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"

echo "\n2. Start backend:"
echo "   cd backend"
echo "   python -m aiohttp.web devdash_api:app"

echo "\n3. Start frontend (new terminal):"
echo "   cd frontend"
echo "   python -m http.server 8000"

echo "\n4. Open in browser:"
echo "   http://localhost:8000/devdash.html"

echo -e "\n${GREEN}🌿 Emerald DevDashboard is ready!${NC}\n"
