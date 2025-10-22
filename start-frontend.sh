#!/bin/bash

echo "========================================="
echo "Phone Remote Control - Frontend Starter"
echo "========================================="
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "Starting React development server..."
echo ""

# Start the React app
npm start
