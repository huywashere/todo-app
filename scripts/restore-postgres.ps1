param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [string]$ComposeFile = "docker-compose.yml",
  [switch]$ConfirmRestore
)

$ErrorActionPreference = 'Stop'
if (-not $ConfirmRestore) { throw "Restore replaces all local todoapp data. Re-run with -ConfirmRestore after verifying the backup path." }
if (-not (Test-Path -LiteralPath $BackupFile)) { throw "Backup file not found: $BackupFile" }

Get-Content -LiteralPath $BackupFile -AsByteStream | gzip -d | docker compose -f $ComposeFile exec -T postgres psql -U todoapp -d todoapp
Write-Host "Restore completed from: $BackupFile"
