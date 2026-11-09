param(
    [Parameter(Mandatory = $true)]
    [Guid] $FunctionId,
    [ValidateSet('fr-par', 'nl-ams', 'pl-waw')]
    [string] $Region = 'fr-par',
    [string] $BackupRoot = ''
)

$ErrorActionPreference = 'Stop'
# Windows PowerShell 5.1 stellt PSScriptRoot bei Parameter-Standardwerten
# nicht zuverlässig bereit. Den Standardpfad erst im Skriptkörper bilden.
if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
    $BackupRoot = Join-Path $PSScriptRoot 'dist/live-backups'
}
$apiHeaders = $null
$apiSecret = $null
$secureSecret = $null
$secretPointer = [IntPtr]::Zero
$requestStep = ''

try {
    Write-Host 'Nur Codesicherung: Dieses Skript ruft keine KI auf und verändert die Function nicht.'
    $secureSecret = Read-Host 'Scaleway Secret Key mit Leserechten auf diese Function (unsichtbar)' -AsSecureString
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
    $apiSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    if ([string]::IsNullOrWhiteSpace($apiSecret)) { throw 'API_SECRET_MISSING' }
    $apiHeaders = @{ 'X-Auth-Token' = $apiSecret; Accept = 'application/json' }
    $functionUri = "https://api.scaleway.com/functions/v1beta1/regions/$Region/functions/$FunctionId"

    $requestStep = 'Function-Details abrufen'
    $functionInfo = Invoke-RestMethod -Method Get -Uri $functionUri -Headers $apiHeaders -MaximumRedirection 0 -TimeoutSec 60
    if ($functionInfo.id -ne $FunctionId.ToString() -or $functionInfo.name -ne 'ki-auswertung') { throw 'FUNCTION_MISMATCH' }
    $requestStep = 'Download-URL abrufen'
    $download = Invoke-RestMethod -Method Get -Uri "$functionUri/download-url" -Headers $apiHeaders -MaximumRedirection 0 -TimeoutSec 60
    $downloadUri = [Uri] $download.url
    $trustedHost = $downloadUri.DnsSafeHost -match '(^|\.)(scw\.cloud|scaleway\.com)$'
    if ($downloadUri.Scheme -ne 'https' -or -not $trustedHost -or $downloadUri.UserInfo) { throw 'DOWNLOAD_URL_INVALID' }

    # Niemals den Konto-API-Key an den Download-Endpunkt weiterreichen.
    $downloadHeaders = @{}
    if ($download.headers) {
        foreach ($property in $download.headers.PSObject.Properties) {
            $value = @($property.Value) -join ','
            if ($property.Name -notmatch '^[A-Za-z0-9-]+$' -or $value -match '[\r\n]' -or $value.Contains($apiSecret)) { throw 'DOWNLOAD_HEADERS_INVALID' }
            $downloadHeaders[$property.Name] = $value
        }
    }

    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
    $suffix = [Guid]::NewGuid().ToString('N').Substring(0, 8)
    $destination = Join-Path ([IO.Path]::GetFullPath($BackupRoot)) "ki-auswertung-$stamp-$suffix"
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    $partialFile = Join-Path $destination 'function-code.partial.zip'
    $archiveFile = Join-Path $destination 'function-code.zip'
    $requestStep = 'ZIP herunterladen'
    Invoke-WebRequest -Method Get -Uri $downloadUri -Headers $downloadHeaders -MaximumRedirection 0 -TimeoutSec 180 -UseBasicParsing -OutFile $partialFile | Out-Null

    Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($partialFile)
    try {
        $entries = @($archive.Entries | ForEach-Object { $_.FullName })
        if ($entries.Count -eq 0 -or $entries -notcontains 'handler.js' -or $entries -notcontains 'evaluation-core.js') { throw 'ARCHIVE_INVALID' }
    } finally { $archive.Dispose() }
    Move-Item -LiteralPath $partialFile -Destination $archiveFile
    $sha256 = (Get-FileHash -LiteralPath $archiveFile -Algorithm SHA256).Hash
    Set-Content -LiteralPath (Join-Path $destination 'function-code.sha256.txt') -Value "$sha256  function-code.zip" -Encoding UTF8

    # Nur ausgewählte Betriebsdaten sichern, keine Umgebungsvariablen, Secrets,
    # API-Response-Header oder zeitlich gültigen Download-URLs.
    $metadata = [ordered]@{
        createdAt = [DateTime]::UtcNow.ToString('o')
        functionId = $functionInfo.id
        name = $functionInfo.name
        region = $Region
        runtime = $functionInfo.runtime
        handler = $functionInfo.handler
        status = $functionInfo.status
        sha256 = $sha256
        files = $entries
    }
    $metadata | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $destination 'backup-info.json') -Encoding UTF8
    Write-Output "Sicherung gespeichert: $archiveFile"
    Write-Output "SHA256: $sha256"
} catch {
    $status = $null
    if ($_.Exception.Response) { $status = [int] $_.Exception.Response.StatusCode }
    $message = switch ($_.Exception.Message) {
        'API_SECRET_MISSING' { 'Kein API-Schlüssel eingegeben.' }
        'FUNCTION_MISMATCH' { 'Die Function-ID gehört nicht zu ki-auswertung. Nichts verändert.' }
        'DOWNLOAD_URL_INVALID' { 'Die API hat keine erwartete Scaleway-Downloadadresse geliefert.' }
        'DOWNLOAD_HEADERS_INVALID' { 'Die Download-Header entsprechen nicht dem erwarteten Format.' }
        'ARCHIVE_INVALID' { 'Der Download enthält nicht die erwarteten Function-Dateien.' }
        default {
            if ($status -eq 401 -or $status -eq 403) { "Zugriff verweigert beim Schritt '$requestStep' (HTTP $status)." }
            elseif ($status -eq 404) { 'Function nicht gefunden. ID und Region prüfen.' }
            else { 'Sicherung fehlgeschlagen. Verbindung, Leserechte und Download prüfen; es wurde nichts bereitgestellt.' }
        }
    }
    # Keine Originalfehlermeldung mit Requestdaten oder signierter URL ausgeben.
    throw $message
} finally {
    if ($apiHeaders) { $apiHeaders.Clear() }
    $apiSecret = $null
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    if ($secureSecret) { $secureSecret.Dispose() }
}
