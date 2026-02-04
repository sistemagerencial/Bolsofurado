# PowerShell helper to test Supabase REST endpoints (GET + POST examples)
# Usage: .\supabase_test.ps1 -GetOnly (or run without param to see examples)
param(
  [switch]$GetOnly
)

# extrai anon key e url de .env.local (procura apenas as linhas de atribuição)
$envFile = '.env.local'
if (-not (Test-Path $envFile)) { Write-Error "$envFile not found"; exit 2 }
$lines = Get-Content $envFile | Where-Object { $_ -match '^\s*VITE_SUPABASE_' }
$envMap = @{}
foreach ($l in $lines) {
  if ($l -match '^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*)$') {
    $k = $matches[1]
    $v = $matches[2] -replace '"',''
    $envMap[$k] = $v.Trim()
  }
}
if (-not $envMap.VITE_SUPABASE_URL -or -not $envMap.VITE_SUPABASE_ANON_KEY) {
  Write-Error 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env.local'
  exit 2
}
$anon = $envMap.VITE_SUPABASE_ANON_KEY
$url = $envMap.VITE_SUPABASE_URL
Write-Output "Using URL: $url"
Write-Output "ANON length: $($anon.Length)"

# GET example (reads receitas)
$h1 = "apikey: $anon"
$h2 = "Authorization: Bearer $anon"
Write-Output '--- GET /receitas ---'
& curl.exe -v "${url.TrimEnd('/')}/rest/v1/receitas?select=*" -H $h1 -H $h2 -H "Content-Type: application/json"

if ($GetOnly) { exit 0 }

# POST example (uncomment to run). Make sure payload is valid JSON array.
# $payload = '[{"description":"teste-ps","amount":123.45}]'
# & curl.exe -v "${url.TrimEnd('/')}/rest/v1/receitas" -H $h1 -H $h2 -H "Content-Type: application/json" --data-raw $payload

# Invoke-RestMethod POST example (reads body from file body.json)
# $body = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("body.json"))
# Invoke-RestMethod -Uri "${url.TrimEnd('/')}/rest/v1/receitas" -Method Post -Headers @{ apikey = $anon; Authorization = "Bearer $anon" } -ContentType "application/json" -Body $body -Verbose

Write-Output 'Finished.'
