# Drei fiktive Antworten; keine API-Schluessel oder echten Schuelerdaten.
# Dieses Skript fuehrt drei kostenpflichtige Modellaufrufe aus.
param(
    [ValidateSet('text', 'code')]
    [string]$Aufgabentyp = 'text'
)

$ErrorActionPreference = 'Stop'
$scwComparisonEndpoint = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/'

$scwComparisonHealth = Invoke-RestMethod -Method Get -Uri $scwComparisonEndpoint -TimeoutSec 130 -ErrorAction Stop
if ($scwComparisonHealth.ok -ne $true -or $scwComparisonHealth.provider -ne 'scaleway' -or
    $scwComparisonHealth.configured -ne $true -or $scwComparisonHealth.evaluationEnabled -ne $true) {
    throw 'Server noch nicht bereit: Healthcheck, Konfiguration und AI_EVALUATION_ENABLED=true pruefen.'
}

$scwComparisonTaskId = 'b'
$scwComparisonMaxPoints = 6
$scwComparisonMessageType = 'GEMINI_EVALUATION_RESULT'
$scwComparisonCases = @(
    @{
        Name = 'vollstaendig'
        MinPoints = 5
        MaxPoints = 6
        Answer = 'Zuerst erzeugt new Circle(200, 50, 50) ein neues Kreisobjekt und speichert es in der Variablen ball. Die Zahlen bestimmen die Position und die Groesse des Kreises. Danach verschiebt move(10, 10) diesen Kreis um die angegebenen Werte nach rechts und nach unten. setFillColor(Color.red) faerbt den Kreis rot. Abschliessend entfernt destroy() den Kreis wieder. Die Befehle werden nacheinander ausgefuehrt.'
    }
    @{
        Name = 'teilweise'
        MinPoints = 1
        MaxPoints = 3
        Answer = 'Es wird ein neues Kreisobjekt erzeugt und in der Variablen ball gespeichert.'
    }
    @{
        Name = 'falsch'
        MinPoints = 0
        MaxPoints = 0
        Answer = 'Das Programm liest die Noten einer Klasse ein und berechnet daraus den Durchschnitt. Das Ergebnis wird in einer Tabelle ausgegeben.'
    }
)

if ($Aufgabentyp -eq 'code') {
    $scwComparisonTaskId = '10-3a'
    $scwComparisonMaxPoints = 3
    $scwComparisonMessageType = 'GEMINI_CODE_EVALUATION_RESULT'
    $scwComparisonCases = @(
        @{
            Name = 'vollstaendig'
            MinPoints = 3
            MaxPoints = 3
            Code = 'Robot dudu = new Robot(1, 1, 12, 12);'
        }
        @{
            Name = 'teilweise'
            MinPoints = 2
            MaxPoints = 2
            Code = 'Robot dudu = new Robot(1, 1, 8, 8);'
        }
        @{
            Name = 'falsch'
            MinPoints = 0
            MaxPoints = 0
            Code = 'println("Das ist nur eine Textausgabe.");'
        }
    )
}

Write-Host "Test: drei Modellaufrufe mit fiktiven Eingaben zu Aufgabe $scwComparisonTaskId ($Aufgabentyp)."
foreach ($scwComparisonCase in $scwComparisonCases) {
    $scwComparisonRequestId = 'vergleich_' + [guid]::NewGuid().ToString('N')
    $scwComparisonPayload = @{
        requestId = $scwComparisonRequestId
        taskId = $scwComparisonTaskId
    }
    if ($Aufgabentyp -eq 'code') {
        $scwComparisonPayload.requestType = 'code'
        $scwComparisonPayload.code = $scwComparisonCase.Code
    } else {
        $scwComparisonPayload.answer = $scwComparisonCase.Answer
    }
    $scwComparisonPayload = $scwComparisonPayload | ConvertTo-Json

    $scwComparisonResponse = Invoke-RestMethod `
        -Method Post `
        -Uri $scwComparisonEndpoint `
        -ContentType 'application/json; charset=utf-8' `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($scwComparisonPayload)) `
        -TimeoutSec 130 `
        -ErrorAction Stop

    if ($scwComparisonResponse.requestId -ne $scwComparisonRequestId -or
        $scwComparisonResponse.type -ne $scwComparisonMessageType -or
        $scwComparisonResponse.result.ok -ne $true) {
        throw "Keine erfolgreich zugeordnete Bewertung fuer Fall $($scwComparisonCase.Name)."
    }

    $scwComparisonEvaluation = $scwComparisonResponse.result
    $scwComparisonMatches = $scwComparisonEvaluation.maxPoints -eq $scwComparisonMaxPoints -and
        $scwComparisonEvaluation.points -ge $scwComparisonCase.MinPoints -and
        $scwComparisonEvaluation.points -le $scwComparisonCase.MaxPoints

    [pscustomobject][ordered]@{
        Fall = $scwComparisonCase.Name
        TaskId = $scwComparisonTaskId
        Aufgabentyp = $Aufgabentyp
        ErwartetePunkte = "$($scwComparisonCase.MinPoints) bis $($scwComparisonCase.MaxPoints)"
        Punkte = $scwComparisonEvaluation.points
        MaxPoints = $scwComparisonEvaluation.maxPoints
        ErwartungErfuellt = $scwComparisonMatches
        Status = $scwComparisonEvaluation.status
        Strengths = $scwComparisonEvaluation.strengths
        Missing = $scwComparisonEvaluation.missing
        Feedback = $scwComparisonEvaluation.feedback
    } | ConvertTo-Json -Depth 6
}
