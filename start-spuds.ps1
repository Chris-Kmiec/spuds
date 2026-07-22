# Starts everything Spuds needs after a reboot:
#   1. a keep-alive session so the WSL VM (and Docker inside it) stays up
#   2. the Supabase stack inside WSL
#   3. the Next.js dev server on Windows
# Usage: right-click > Run with PowerShell, or `powershell -File start-spuds.ps1`

$ErrorActionPreference = "Continue"

Write-Host "Starting WSL keep-alive..." -ForegroundColor Cyan
Start-Process wsl -ArgumentList "-d Ubuntu -u root -- sleep infinity" -WindowStyle Hidden

Write-Host "Starting Supabase inside WSL (first response may take ~30s)..." -ForegroundColor Cyan
wsl -d Ubuntu -u root -- sh -c "cd /mnt/c/Users/chris/spuds && (supabase start >/dev/null 2>&1 || (supabase stop >/dev/null 2>&1; supabase start >/dev/null 2>&1)); curl -s -o /dev/null -w 'Supabase API: %{http_code}\n' http://127.0.0.1:44321/rest/v1/ --max-time 10"

Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
Start-Process "C:\Program Files\nodejs\node.exe" -ArgumentList "`"C:\Users\chris\spuds\node_modules\next\dist\bin\next`" dev" -WorkingDirectory "C:\Users\chris\spuds" -WindowStyle Minimized

Write-Host ""
Write-Host "Spuds is starting: http://localhost:3000" -ForegroundColor Green
Write-Host "Supabase Studio:   http://localhost:44323" -ForegroundColor Green
