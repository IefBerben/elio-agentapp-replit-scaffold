# health.ps1 - Check both servers are running

Write-Host "=== Health Check ===" -ForegroundColor Cyan

try {
    $back = Invoke-RestMethod -Uri "http://localhost:8000/" -Method GET
    $agentList = $back.agents -join ", "
    Write-Host "Backend  OK - agents: $agentList" -ForegroundColor Green
} catch {
    Write-Host "Backend  FAIL - is uvicorn running on port 8000?" -ForegroundColor Red
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    Write-Host "Frontend OK - http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "Frontend FAIL - is vite running on port 5173?" -ForegroundColor Red
}
