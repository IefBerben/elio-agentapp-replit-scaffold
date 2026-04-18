#!/bin/bash
# health.sh - Check both servers are running

echo "=== Health Check ==="

if response=$(curl -s http://localhost:8000/ 2>/dev/null); then
    agents=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(', '.join(d.get('agents', [])))" 2>/dev/null || echo "unknown")
    echo "Backend  OK - agents: $agents"
else
    echo "Backend  FAIL - is uvicorn running on port 8000?"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Frontend OK - http://localhost:5173"
else
    echo "Frontend FAIL - is vite running on port 5173?"
fi
