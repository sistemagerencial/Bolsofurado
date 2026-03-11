[Environment]::SetEnvironmentVariable('VERCEL_TOKEN',$null,'User')
$env:VERCEL_TOKEN = $null
Write-Output 'User env var removed and session var cleared'
npx vercel whoami
