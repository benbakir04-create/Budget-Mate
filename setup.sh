#!/bin/bash

echo "========================================"
echo "    Budget Mate - Setup Script"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    echo
    exit 1
fi

echo "✅ Node.js is installed"
echo

# Check if PostgreSQL is installed (optional for demo mode)
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed"
    echo "You can still run in DEMO mode without database"
    echo
else
    echo "✅ PostgreSQL is installed"
    echo
fi

echo "🔧 Setting up Backend..."
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
if ! npm install; then
    echo "❌ Failed to install backend dependencies"
    cd ..
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "Copying environment template..."
    cp env.example .env
    echo
    echo "⚠️  Please edit .env file with your database credentials"
    echo "You can run in DEMO mode without database setup"
fi

cd ..

echo
echo "🔧 Setting up Frontend..."
cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
if ! npm install; then
    echo "❌ Failed to install frontend dependencies"
    cd ..
    exit 1
fi

cd ..

echo
echo "========================================"
echo "✅ Setup completed successfully!"
echo "========================================"
echo
echo "🚀 To start the application:"
echo
echo "Option 1 - DEMO Mode (No database required):"
echo "  ./run.sh"
echo
echo "Option 2 - Full Mode (Requires PostgreSQL):"
echo "  1. Setup PostgreSQL database"
echo "  2. Edit backend/.env with your database credentials"
echo "  3. Run: ./run-backend.sh"
echo "  4. Run: ./run.sh"
echo
echo "📚 For detailed instructions, see README.md"
echo