#!/bin/bash

echo "========================================"
echo "    Budget Mate - Demo Mode"
echo "========================================"
echo

# Create .env file for frontend with demo mode
echo "Setting up demo mode..."
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
VITE_DEMO_MODE=true
VITE_API_URL=/api
VITE_APP_NAME=Budget Mate
EOF
else
    # Check if demo mode is already set
    if ! grep -q "VITE_DEMO_MODE=true" frontend/.env; then
        echo "VITE_DEMO_MODE=true" >> frontend/.env
    fi
fi

echo "✅ Demo mode configured"
echo

# Run the application
echo "Starting Budget Mate in demo mode..."
./run.sh