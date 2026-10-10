param([string]$ManifestPath = (Join-Path $PSScriptRoot 'migration-manifest.json'))
$ErrorActionPreference = 'Stop'
function Get-ScwRestoreHash([string]$Path) {
    $scwRestoreStream = [IO.File]::OpenRead($Path)
    $scwRestoreHasher = [Security.Cryptography.SHA256]::Create()
    try {
        return ([BitConverter]::ToString($scwRestoreHasher.ComputeHash($scwRestoreStream))).Replace('-', '')
    } finally {
        $scwRestoreHasher.Dispose()
        $scwRestoreStream.Dispose()
    }
}
$scwRestoreManifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$scwRestoreRoot = (Resolve-Path -LiteralPath $scwRestoreManifest.repoRoot).Path
$scwRestoreBackup = (Resolve-Path -LiteralPath $scwRestoreManifest.backupRoot).Path
$scwRestoreCopies = @()
foreach ($scwRestoreEntry in @($scwRestoreManifest.files) + @($scwRestoreManifest.testFiles)) {
    if ($null -eq $scwRestoreEntry) { continue }
    $scwRestoreSection = if ($scwRestoreEntry.category -eq 'test') { 'original-tests' } else { 'original' }
    $scwRestoreTarget = [IO.Path]::GetFullPath((Join-Path $scwRestoreRoot $scwRestoreEntry.file))
    $scwRestoreSource = [IO.Path]::GetFullPath((Join-Path (Join-Path $scwRestoreBackup $scwRestoreSection) $scwRestoreEntry.file))
    if (-not $scwRestoreTarget.StartsWith($scwRestoreRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
        -not $scwRestoreSource.StartsWith($scwRestoreBackup + '\' + $scwRestoreSection + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Unerwarteter Pfad im Rücksicherungsmanifest.'
    }
    if ((Get-ScwRestoreHash $scwRestoreSource) -ne $scwRestoreEntry.beforeSha256) {
        throw ('Sicherung beschädigt: ' + $scwRestoreEntry.file)
    }
    $scwRestoreCurrentHash = Get-ScwRestoreHash $scwRestoreTarget
    if ($scwRestoreCurrentHash -ne $scwRestoreEntry.afterSha256 -and $scwRestoreCurrentHash -ne $scwRestoreEntry.beforeSha256) {
        throw ('Spaetere Aenderung erkannt; nicht ueberschrieben: ' + $scwRestoreEntry.file)
    }
    $scwRestoreCopies += @{ Source = $scwRestoreSource; Target = $scwRestoreTarget }
}
foreach ($scwRestoreCopy in $scwRestoreCopies) {
    Copy-Item -LiteralPath $scwRestoreCopy.Source -Destination $scwRestoreCopy.Target -Force
}
Write-Output 'Website-Dateien und zugehörige Tests auf den gesicherten Google-Stand zurückgesetzt. Bei Veröffentlichung auch diesen Stand hochladen.'
