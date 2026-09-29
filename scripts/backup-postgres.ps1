param(
  [string]$OutputDirectory = "backups",
  [string]$ComposeFile = "docker-compose.yml"
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path $OutputDirectory "todoapp-$timestamp.sql.gz"

docker compose -f $ComposeFile exec -T postgres pg_dump -U todoapp todoapp | gzip -c | Set-Content -LiteralPath $target -AsByteStream
if ((Get-Item -LiteralPath $target).Length -eq 0) { throw "Backup failed: generated file is empty." }
Write-Host "Backup created: $target"
