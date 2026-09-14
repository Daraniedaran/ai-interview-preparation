#!/bin/sh
set -e

echo "=== Starting AI Interview Preparation Portal ==="
echo "Target PORT: ${PORT:-8000}"

# Ensure database tables and initial sample data are seeded if not already present
echo "Verifying database status and running initial seed..."
python seed.py || echo "Notice: Seeding completed or skipped."

# Launch Uvicorn server bound to 0.0.0.0 on the dynamic PORT assigned by host (e.g. Render)
echo "Launching Uvicorn server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
