'use strict';

// Synthetische fachliche Einzelbelege für Server- und Browsertests.
// Modellurteile werden separat simuliert; keine semantische KI-Auswertung.
module.exports = {
  P2: [
    'Ausgegeben werden Benutzername und Fotobeschreibung.',
    'Das Foto wird dem Mitglied zugeordnet, das es hochgeladen hat.',
    'Die Mitglieder wohnen in Hamburg.',
    'Für jedes passende Foto erscheint eine eigene Ergebniszeile.',
    'Sortiert wird nach Benutzername von A bis Z, bei gleichem Benutzernamen nach Foto-ID aufsteigend.'
  ],
  P5: [
    'Ausgegeben werden Benutzername und Kommentartext.',
    'Der Kommentar gehört zu der Person, die ihn geschrieben hat.',
    'Die verfassende Person wohnt in Hamburg.',
    'Der Kommentartext enthält die Zeichenfolge Foto.',
    'Sortiert wird nach Benutzername von A bis Z, bei gleichem Benutzernamen nach Kommentar-ID aufsteigend.'
  ],
  P8: [
    'Ausgegeben werden Benutzername und Fotobeschreibung.',
    'likes.user_id kennzeichnet die Person, der das Foto gefällt.',
    'likes.photo_id verweist auf das gelikte Foto.',
    'Ausgewählt ist das Foto mit der Kennung 10.',
    'Die Benutzernamen werden von A bis Z sortiert.'
  ],
  P11: [
    'Für jedes Mitglied werden Benutzername und seine Kommentaranzahl ausgegeben.',
    'Die Kommentare werden ihrer verfassenden Person zugeordnet.',
    'Es erscheinen nur Leipziger Mitglieder mit mindestens einem geschriebenen Kommentar.',
    'Für jede Person wird eine eigene Gruppe gebildet und ihre Kommentare werden einzeln gezählt.',
    'Zuerst stehen die Mitglieder mit den meisten Kommentaren; bei gleicher Anzahl werden die Benutzernamen von A bis Z sortiert.'
  ]
};
