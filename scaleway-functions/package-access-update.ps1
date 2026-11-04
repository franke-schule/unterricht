$ErrorActionPreference = 'Stop'
$functionRoot = $PSScriptRoot
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $functionRoot '..')).Path

# Bestehende Paketierung übernimmt Build, feste Laufzeitdateien und ZIP-Prüfung.
& (Join-Path $functionRoot 'package.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Function-Paket konnte nicht erstellt werden.' }

$deploymentDirectory = Join-Path $functionRoot 'dist'
$functionArchive = Join-Path $deploymentDirectory 'ki-auswertung-passwortschutz.zip'
Copy-Item -LiteralPath (Join-Path $deploymentDirectory 'ki-auswertung-test.zip') -Destination $functionArchive -Force

# Gezielt nur die drei zentralen Laufzeitdateien veröffentlichen. Keine anderen
# uncommitteten Moduländerungen, Tests, Hilfsprogramme oder Secrets einpacken.
$clientRoot = 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui'
$websiteFiles = @("$clientRoot/semantic-answer.mjs", "$clientRoot/ai-access.mjs", "$clientRoot/ai-access.css")
$websiteArchive = Join-Path $deploymentDirectory 'website-passwortschutz.zip'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($websiteArchive, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($relativePath in $websiteFiles) {
        $sourcePath = Join-Path $repositoryRoot $relativePath
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $sourcePath, $relativePath) | Out-Null
    }
} finally {
    $archive.Dispose()
    $stream.Dispose()
}
$check = [System.IO.Compression.ZipFile]::OpenRead($websiteArchive)
try {
    $entries = @($check.Entries | ForEach-Object { $_.FullName })
    if ($entries.Count -ne $websiteFiles.Count) { throw 'Unerwarteter Website-Paketinhalt.' }
    foreach ($relativePath in $websiteFiles) {
        if ($entries -notcontains $relativePath) { throw "Website-Datei fehlt: $relativePath" }
    }
} finally { $check.Dispose() }

foreach ($artifact in @($functionArchive, $websiteArchive)) {
    $checksum = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash
    Set-Content -LiteralPath ($artifact + '.sha256.txt') -Value "$checksum  $([System.IO.Path]::GetFileName($artifact))" -Encoding UTF8
}
$manifest = [ordered]@{
    createdAt = [DateTime]::UtcNow.ToString('o')
    accessProtection = 'password-v1'
    taskCount = (Get-Content -LiteralPath (Join-Path $functionRoot 'source-manifest.json') -Raw | ConvertFrom-Json).taskCount
    functionArchive = [System.IO.Path]::GetFileName($functionArchive)
    functionSha256 = (Get-FileHash -LiteralPath $functionArchive -Algorithm SHA256).Hash
    websiteArchive = [System.IO.Path]::GetFileName($websiteArchive)
    websiteSha256 = (Get-FileHash -LiteralPath $websiteArchive -Algorithm SHA256).Hash
    websiteFiles = $websiteFiles
    liveDeploymentVerified = $false
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $deploymentDirectory 'passwortschutz-bereitstellung.json') -Encoding UTF8
Write-Output "Function: $functionArchive"
Write-Output "Website:  $websiteArchive"
Write-Output 'Nach Website-Upload Browser-/Hosting-Cache aktualisieren und mit Strg+F5 neu laden.'
