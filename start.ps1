# Starts the backend (port 8000) and the frontend (port 5500), each in its own window.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File .\start.ps1

$root = $PSScriptRoot
$python = Join-Path $root "venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Could not find venv\Scripts\python.exe. Create the virtual environment first." -ForegroundColor Red
    exit 1
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root'; & '$python' -m uvicorn app.main:app --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root'; & '$python' -m http.server 5500 --directory frontend"

Start-Sleep -Seconds 4
Start-Process "http://127.0.0.1:5500"
Write-Host "Backend:  http://127.0.0.1:8000/docs"
Write-Host "Site:     http://127.0.0.1:5500"
Write-Host "Admin:    http://127.0.0.1:5500/admin.html"
Write-Host "Close the two new windows to stop the servers."
