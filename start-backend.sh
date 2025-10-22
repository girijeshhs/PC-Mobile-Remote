#!/bin/bash

echo "========================================"
echo "Phone Remote Control - Backend Starter"
echo "========================================"
echo ""

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Starting Flask backend..."
echo ""

# Run the Flask app
python app.py
