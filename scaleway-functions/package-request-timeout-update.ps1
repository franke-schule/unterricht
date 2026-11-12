$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$deploymentDirectory = Join-Path $PSScriptRoot 'dist'
New-Item -ItemType Directory -Path $deploymentDirectory -Force | Out-Null
$websiteFiles = @(
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/task6.mjs',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs',
    'faecher/physik/klasse-11/1-Kreisbewegungen/aufgabe8.html',
    'faecher/physik/klasse-11/1-Kreisbewegungen/gravitation.mjs',
    'faecher/physik/klasse-11/1-Kreisbewegungen/components/physics-semantic-task.mjs'
)
$websiteArchive = Join-Path $deploymentDirectory 'website-ki-ladeanzeige-20261111.zip'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($websiteArchive, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($relativePath in $websiteFiles) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, (Join-Path $repositoryRoot $relativePath), $relativePath) | Out-Null
    }
} finally { $archive.Dispose(); $stream.Dispose() }
$check = [System.IO.Compression.ZipFile]::OpenRead($websiteArchive)
try {
    $entries = @($check.Entries | ForEach-Object { $_.FullName })
    if ($entries.Count -ne $websiteFiles.Count) { throw 'Unerwarteter Website-Paketinhalt.' }
    foreach ($relativePath in $websiteFiles) {
        if ($entries -notcontains $relativePath) { throw "Website-Datei fehlt: $relativePath" }
    }
} finally { $check.Dispose() }
$checksum = (Get-FileHash -LiteralPath $websiteArchive -Algorithm SHA256).Hash
Set-Content -LiteralPath ($websiteArchive + '.sha256.txt') -Encoding UTF8 -Value "$checksum  $([System.IO.Path]::GetFileName($websiteArchive))"
Write-Output "Website: $websiteArchive"
Write-Output "SHA256:  $checksum"
Write-Output 'Website-Dateien mit ihren Verzeichnissen veröffentlichen; Hosting-Cache leeren und Seiten vollständig neu laden.'
