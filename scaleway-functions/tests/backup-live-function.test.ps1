$ErrorActionPreference = 'Stop'
$testRoot = Join-Path (Join-Path $PSScriptRoot '../../tmp/scaleway-password-backup-test') ([Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
$fixtureZip = Join-Path $testRoot 'fixture.zip'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$stream = [IO.File]::Open($fixtureZip, [IO.FileMode]::Create)
$zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($name in @('handler.js', 'evaluation-core.js')) {
        $entry = $zip.CreateEntry($name)
        $writer = New-Object IO.StreamWriter($entry.Open())
        try { $writer.Write('nur synthetischer Testinhalt') } finally { $writer.Dispose() }
    }
} finally { $zip.Dispose(); $stream.Dispose() }

$testSecret = 'synthetischer-api-schluessel'
$testId = '26f7eaed-e1b0-4b1c-9f7e-27355b481959'
$authBackupTestCounters = @{ apiRequests = 0; downloadRequests = 0; mode = 'good' }
function Read-Host {
    param($Prompt, [switch]$AsSecureString)
    if ($authBackupTestCounters.mode -eq 'startup') { return (New-Object Security.SecureString) }
    ConvertTo-SecureString $testSecret -AsPlainText -Force
}
function Invoke-RestMethod {
    param($Method, $Uri, $Headers, $MaximumRedirection, $TimeoutSec)
    if ($Method -ne 'Get' -or $Headers['X-Auth-Token'] -ne $testSecret) { throw 'Falscher API-Aufruf.' }
    $authBackupTestCounters.apiRequests++
    if ($authBackupTestCounters.mode -eq 'error') { throw $testSecret }
    if ($Uri -like '*/download-url') {
        $url = if ($authBackupTestCounters.mode -eq 'hostile') { 'https://untrusted.example/code.zip' } else { 'https://s3.fr-par.scw.cloud/test/code.zip?temporary-secret=never-save' }
        return [PSCustomObject]@{ url = $url; headers = [PSCustomObject]@{ 'x-test' = @('download-only') } }
    }
    return [PSCustomObject]@{ id = $testId; name = 'ki-auswertung'; runtime = 'node22'; handler = 'handler.handle'; status = 'ready'; environment_variables = @{ sensitive = $testSecret } }
}
function Invoke-WebRequest {
    param($Method, $Uri, $Headers, $MaximumRedirection, $TimeoutSec, [switch]$UseBasicParsing, $OutFile)
    if ($Method -ne 'Get' -or $Headers.ContainsKey('X-Auth-Token') -or $Headers['x-test'] -ne 'download-only') { throw 'API-Schlüssel an Download weitergereicht oder Header verloren.' }
    $authBackupTestCounters.downloadRequests++
    Copy-Item -LiteralPath $fixtureZip -Destination $OutFile
}

$output = & (Join-Path $PSScriptRoot '../backup-live-function.ps1') -FunctionId $testId -BackupRoot (Join-Path $testRoot 'backups')
if ($authBackupTestCounters.apiRequests -ne 2 -or $authBackupTestCounters.downloadRequests -ne 1) { throw 'Unerwartete Anzahl von Zugriffen.' }
$metadataFile = Get-ChildItem -LiteralPath (Join-Path $testRoot 'backups') -Filter 'backup-info.json' -Recurse | Sort-Object LastWriteTime | Select-Object -Last 1
$metadataText = Get-Content -LiteralPath $metadataFile.FullName -Raw
if (($output -join "`n").Contains($testSecret) -or $metadataText.Contains($testSecret) -or $metadataText.Contains('temporary-secret')) { throw 'Secret oder signierte URL ausgegeben/gespeichert.' }
$savedZip = Join-Path $metadataFile.DirectoryName 'function-code.zip'
if ((Get-FileHash -LiteralPath $savedZip).Hash -ne (Get-FileHash -LiteralPath $fixtureZip).Hash) { throw 'Sicherung verändert.' }
foreach ($mode in @('hostile', 'error')) {
    $authBackupTestCounters.mode = $mode
    $rejected = $false
    try { & (Join-Path $PSScriptRoot '../backup-live-function.ps1') -FunctionId $testId -BackupRoot (Join-Path $testRoot 'backups') | Out-Null }
    catch {
        $rejected = $true
        if ($_.Exception.Message.Contains($testSecret)) { throw 'Originalfehler mit Secret durchgereicht.' }
    }
    if (-not $rejected -or $authBackupTestCounters.downloadRequests -ne 1) { throw 'Ungültiger Zugriff wurde nicht vor dem Download abgewiesen.' }
}
$authBackupTestCounters.mode = 'startup'
$startupRejected = $false
try { & (Join-Path $PSScriptRoot '../backup-live-function.ps1') -FunctionId $testId | Out-Null }
catch {
    $startupRejected = $true
    if ($_.Exception.Message -notlike 'Kein API-*') { throw 'Start ohne BackupRoot scheitert vor der sicheren Schluesselabfrage.' }
}
if (-not $startupRejected -or $authBackupTestCounters.downloadRequests -ne 1) { throw 'Leere Eingabe sollte ohne Download abbrechen.' }
Write-Output 'Lokale Sicherung geprüft: nur GET, vollständiges ZIP, Prüfsumme, keine Secrets in Metadaten oder Ausgabe, keine Live-Zugriffe.'
