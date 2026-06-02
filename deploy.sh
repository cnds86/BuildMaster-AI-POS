#!/bin/bash
# ============================================================
# MHX-POS Deploy Script
# Usage: bash deploy.sh [--production] [--with-seed]
# ============================================================

set -e

PROJECT_DIR="/home/cnds86/projects/MHX-POS"
IMAGE_NAME="mhx-pos"
CONTAINER_NAME="mhx-pos-app"
PORT=3006

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# ============================================================
# Parse Arguments
# ============================================================
PRODUCTION=false
WITH_SEED=false

for arg in "$@"; do
  case $arg in
    --production) PRODUCTION=true ;;
    --with-seed) WITH_SEED=true ;;
    --help)
      echo "Usage: bash deploy.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --production   Enable production mode"
      echo "  --with-seed    Run seed data after deployment"
      echo "  --help         Show this help message"
      exit 0
      ;;
  esac
done

# ============================================================
# Pre-flight Checks
# ============================================================
log "MHX-POS Deploy Script v1.0.0"
echo "================================"

# Check Docker
if ! command -v docker &> /dev/null; then
  error "Docker is not installed. Please install Docker first."
  exit 1
fi

# Check Bun
if ! command -v bun &> /dev/null; then
  error "Bun is not installed. Please install Bun first."
  exit 1
fi

# Check project directory
if [ ! -d "$PROJECT_DIR" ]; then
  error "Project directory not found: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# ============================================================
# Step 1: Database Setup
# ============================================================
log "Step 1: Setting up database..."

# Start PostgreSQL and Redis containers
docker compose -f infra/docker-compose.yml up -d

# Wait for PostgreSQL to be ready
echo -n "Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker exec mhxpos-postgres pg_isready -U mhxpos -d mhxpos &> /dev/null; then
    echo " ready!"
    break
  fi
  echo -n "."
  sleep 1
done

log "Database containers started"
log "  - PostgreSQL: localhost:54330"
log "  - Redis:      localhost:16379"

# ============================================================
# Step 2: Environment Configuration
# ============================================================
log "Step 2: Environment configuration..."

if [ ! -f ".env" ]; then
  warn ".env not found. Creating from example..."
  cp .env.example .env 2>/dev/null || true
  
  # Generate JWT secret
  JWT_SECRET=$(openssl rand -base64 32)
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  
  warn "Please edit .env and add your GEMINI_API_KEY if using AI features"
fi

# ============================================================
# Step 3: Install Dependencies & Build
# ============================================================
log "Step 3: Installing dependencies..."

bun install --frozen-lockfile

log "Step 4: Building application..."
bun run build

# ============================================================
# Step 5: Database Migration
# ============================================================
log "Step 5: Running database migrations..."

if [ -f "server/seed.ts" ] && [ "$WITH_SEED" = true ]; then
  warn "Running seed data (--with-seed specified)..."
  bun run seed
fi

# ============================================================
# Step 6: Stop existing container (if any)
# ============================================================
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
  warn "Stopping existing container..."
  docker stop $CONTAINER_NAME 2>/dev/null || true
  docker rm $CONTAINER_NAME 2>/dev/null || true
fi

# ============================================================
# Step 7: Build Docker Image
# ============================================================
log "Step 6: Building Docker image..."

docker build -f infra/Dockerfile -t $IMAGE_NAME:latest .

# ============================================================
# Step 8: Run Container
# ============================================================
log "Step 7: Starting container..."

MODE_FLAGS=""
if [ "$PRODUCTION" = true ]; then
  MODE_FLAGS="-e NODE_ENV=production"
fi

docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  --env-file .env \
  $MODE_FLAGS \
  $IMAGE_NAME:latest

# ============================================================
# Step 9: Health Check
# ============================================================
log "Step 8: Health check..."

sleep 3
for i in {1..10}; do
  if curl -sf http://localhost:$PORT/api/health > /dev/null 2>&1; then
    log "Application is running!"
    echo ""
    echo "================================"
    log "MHX-POS Deployed Successfully!"
    echo "================================"
    echo ""
    echo "  URLs:"
    echo "    - App:      http://localhost:$PORT"
    echo "    - API:      http://localhost:$PORT/api/health"
    echo "    - Backend:  http://localhost:$PORT"
    echo ""
    echo "  Container:"
    echo "    - Name: $CONTAINER_NAME"
    echo "    - Port: $PORT"
    echo ""
    echo "  Useful commands:"
    echo "    - View logs:  docker logs -f $CONTAINER_NAME"
    echo "    - Stop:       docker stop $CONTAINER_NAME"
    echo "    - Restart:    docker restart $CONTAINER_NAME"
    echo ""
    exit 0
  fi
  echo -n "."
  sleep 1
done

error "Health check failed. Please check logs:"
echo "  docker logs $CONTAINER_NAME"
exit 1