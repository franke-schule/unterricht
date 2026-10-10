$ErrorActionPreference = 'Stop'
$functionRoot = $PSScriptRoot
& node (Join-Path $functionRoot 'build-core.js')
if ($LASTEXITCODE -ne 0) { throw 'Bewertungskern konnte nicht gebaut werden.' }

$deploymentDirectory = Join-Path $functionRoot 'dist'
New-Item -ItemType Directory -Path $deploymentDirectory -Force | Out-Null
$archivePath = Join-Path $deploymentDirectory 'ki-auswertung-test.zip'
$fileNames = @('handler.js', 'scaleway-client.js', 'evaluation-core.js', 'source-manifest.json', 'package.json')
$deploymentFiles = $fileNames | ForEach-Object { Join-Path $functionRoot $_ }
Compress-Archive -LiteralPath $deploymentFiles -DestinationPath $archivePath -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    $entries = @($archive.Entries | ForEach-Object { $_.FullName })
    foreach ($fileName in $fileNames) {
        if ($entries -notcontains $fileName) { throw "Datei fehlt im ZIP-Root: $fileName" }
    }
    if ($entries.Count -ne $fileNames.Count) { throw 'Unerwartete zusätzliche ZIP-Dateien.' }
} finally { $archive.Dispose() }

$sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
Set-Content -LiteralPath (Join-Path $deploymentDirectory 'ki-auswertung-test.sha256.txt') -Value "$sha256  ki-auswertung-test.zip" -Encoding UTF8
Write-Output "ZIP mit geprüfter Struktur: $archivePath"
Write-Output "SHA256: $sha256"

