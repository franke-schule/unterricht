// Aufgabe 3 – Datensätze filtern mit WHERE (Informatik 9).
import { classifyDescriptionResult, compareRelations, isValidScriptServerUrl, missingTextQuote, normalizeRelation, parseDelimited, sqlTokens, validateSelectStatement } from '../../klasse-10/1-Datenbanken/sql-lab-core.mjs?v=20260929b';
import { evaluateSemanticAnswer, renderCompactEvaluation } from '../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs?v=20261029-criteria-v1';
import { appendSolutionDownloadFromTemplate, enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from '../../klasse-10/1-Datenbanken/tab-navigation.mjs?v=20260906a';
const STORAGE_KEY = 'informatik9-datenbanken-aufgabe3-where-v1';
const NEUTRAL_SQL_PLACEHOLDER = 'SELECT ...\nFROM ...';
const SCRIPT_SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';

// nach USERS_TABLE_SCHEMAS in klasse-10/1-Datenbanken/sql-lab.js, wortgleich
const USERS_TABLE_SCHEMAS = Object.freeze([
  Object.freeze({ table: 'users', columns: Object.freeze([
    ['id', 'int'], ['name', 'varchar(255)'], ['username', 'varchar(255)'], ['email', 'varchar(255)'],
    ['email_verified_at', 'date'], ['password', 'varchar(255)'], ['bio', 'varchar(255)'], ['gender', 'varchar(255)'],
    ['birthday', 'date'], ['city', 'varchar(255)'], ['country', 'varchar(255)'], ['centimeters', 'int'],
    ['avatar', 'varchar(255)'], ['role', 'varchar(255)'], ['is_active', 'int'], ['remember_token', 'varchar(255)'],
    ['created_at', 'date'], ['updated_at', 'date']
  ]) })
]);
const USER_COLUMN_NAMES = USERS_TABLE_SCHEMAS[0].columns.map(([name]) => name);


const TABS = [
  ['intro', 'Einführung: Wie filtert WHERE?', 'Entdecken', 'Wie filtert WHERE?'],
  ['simple', 'Einfache Bedingungen', 'Verstehen und anwenden', 'Einfache Bedingungen'],
  ['compare', 'Vergleichen mit WHERE', 'Anwenden', 'Vergleichen mit WHERE'],
  ['like', 'Muster suchen mit LIKE', 'Anwenden', 'Muster suchen mit LIKE'],
  ['combine', 'Bedingungen verknüpfen', 'Anwenden', 'Bedingungen verknüpfen'],
  ['fast', 'Für die Schnellen', 'Übertragen', 'Für die Schnellen'],
  ['quiz', 'Abschlussquiz', 'Sichern', 'Abschlussquiz und Zusammenfassung']
];
const FEEDBACK_LEVELS = ['success', 'partial', 'hint', 'error'];
const DESCRIPTION_LEVELS = ['high', 'medium', 'low', 'error'];
const DESCRIPTION_STATUSES = ['korrekt', 'teilweise korrekt', 'noch nicht korrekt'];
const DESCRIPTION_TASK = {
  id: 'd-where', tab: 'simple', tabLabel: 'Reiter 2', serverTaskId: 'inf9-db3-beschreibe-where',
  title: 'Einstieg – Anweisung beschreiben', prompt: '**Beschreibe** in eigenen Worten, welche Daten diese SQL-Anweisung ausgibt.',
  sql: "SELECT username, city\nFROM users\nWHERE city = 'München'",
  hints: ['Lies zuerst FROM: Aus welcher Tabelle kommen die Daten?', 'Welche beiden Spalten nennt SELECT? Welche Bedingung steht hinter WHERE?', "Die Spalten heißen username und city. Überlege, welche Mitglieder die Bedingung city = 'München' erfüllen."],
  model: 'Die Abfrage liest aus der Tabelle users nur die Mitglieder mit Wohnort München aus und zeigt deren Benutzernamen und Wohnort.',
  fallbacks: {
    korrekt: 'Korrekt: Du hast die Tabelle, beide Ausgabespalten und den Wohnort München richtig beschrieben.',
    partial: 'Teilweise korrekt: Ein Teil deiner Beschreibung stimmt. Prüfe noch Tabelle, Ausgabespalten und die Bedingung für München.',
    incorrect: 'Noch nicht korrekt: Lies FROM, SELECT und WHERE einzeln und beschreibe ihre Wirkung.'
  }
};
const DESCRIPTION_BY_ID = new Map([[DESCRIPTION_TASK.id, DESCRIPTION_TASK]]);
const TASKS = 
[
  {
    "id": "t1",
    "number": 1,
    "block": "A",
    "prompt": "**Liste** die Daten aller weiblichen Mitglieder auf.",
    "sql": "SELECT * FROM users WHERE gender = 'female'",
    "select": "*",
    "tail": "FROM users\nWHERE gender = 'female'",
    "hints": [
      "Achte auf die Spalte mit dem Geschlecht.",
      "Das gesuchte Geschlecht steht als Textwert in gender.",
      "Ergänze eine Bedingung der Form `WHERE gender = '…'`. Für alle Daten brauchst du hinter SELECT den Stern."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst alle Spalten der weiblichen Mitglieder.",
      "partial": "Teilweise korrekt: Einige passende Daten erscheinen. Prüfe, ob du alle Spalten und alle weiblichen Mitglieder ausgibst.",
      "wrong": "Noch nicht korrekt: Prüfe die Spalte gender und den Textwert für weiblich."
    },
    "whereColumn": "gender",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t2",
    "number": 2,
    "block": "A",
    "prompt": "**Gib** alle Mitglieder aus Deutschland aus.",
    "sql": "SELECT * FROM users WHERE country = 'Deutschland'",
    "select": "*",
    "tail": "FROM users\nWHERE country = 'Deutschland'",
    "hints": [
      "Suche im Schema die Spalte für das Land.",
      "Der gespeicherte Landeswert ist ein Textwert.",
      "Nutze `WHERE country = 'Deutschland'` und wähle alle Spalten."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst alle Daten der Mitglieder aus Deutschland.",
      "partial": "Teilweise korrekt: Prüfe, ob nur Mitglieder aus Deutschland erscheinen und ob alle Spalten vorhanden sind.",
      "wrong": "Noch nicht korrekt: Das Land steht in country; der Textwert braucht einfache Anführungszeichen."
    },
    "whereColumn": "country",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t3",
    "number": 3,
    "block": "A",
    "prompt": "**Zeige** den vollständigen Datensatz von Mia Sonntag an.",
    "sql": "SELECT * FROM users WHERE name = 'Mia Sonntag'",
    "select": "*",
    "tail": "FROM users\nWHERE name = 'Mia Sonntag'",
    "hints": [
      "Der vollständige Name steht in einer Spalte.",
      "Prüfe name, nicht username.",
      "Die Bedingung lautet `WHERE name = 'Mia Sonntag'`; für den vollständigen Datensatz fehlen dir noch alle Ausgabespalten."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst den vollständigen Datensatz von Mia Sonntag.",
      "partial": "Teilweise korrekt: Du findest Mia Sonntag, aber prüfe, ob wirklich alle Spalten des Datensatzes erscheinen.",
      "wrong": "Noch nicht korrekt: Vergleiche den vollständigen Namen in name mit dem gesuchten Textwert."
    },
    "whereColumn": "name",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t4",
    "number": 4,
    "block": "B",
    "prompt": "**Gib** alle Mitglieder aus, die kleiner als 1,80 m sind.",
    "sql": "SELECT * FROM users WHERE centimeters < 180",
    "select": "*",
    "tail": "FROM users\nWHERE centimeters < 180",
    "hints": [
      "Die Größen stehen als Zentimeterzahlen in der Tabelle.",
      "1,80 m sind 180 cm; genau 180 cm zählt bei ‚kleiner als‘ nicht mit.",
      "Verwende `WHERE centimeters < 180` und gib den vollständigen Datensatz aus."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst die vollständigen Datensätze der Mitglieder unter 180 cm.",
      "partial": "Teilweise korrekt: Prüfe die Grenze: Genau 180 cm gehört nicht dazu, und alle Spalten sollen erscheinen.",
      "wrong": "Noch nicht korrekt: Vergleiche centimeters mit 180, nicht mit 1,80."
    },
    "whereColumn": "centimeters",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t5",
    "number": 5,
    "block": "B",
    "prompt": "**Finde** das Mitglied, das am 17.09.2007 geboren wurde. Gib den vollständigen Datensatz aus.",
    "sql": "SELECT * FROM users WHERE birthday = '2007-09-17'",
    "select": "*",
    "tail": "FROM users\nWHERE birthday = '2007-09-17'",
    "hints": [
      "In der Tabelle stehen Geburtstage im Format Jahr-Monat-Tag.",
      "17.09.2007 wird zu `2007-09-17`.",
      "Prüfe `WHERE birthday = '2007-09-17'`; hinter SELECT brauchst du alle Spalten."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst den vollständigen Datensatz des Mitglieds mit diesem Geburtstag.",
      "partial": "Teilweise korrekt: Der Geburtstag passt; prüfe noch Datumsschreibweise und vollständige Spaltenausgabe.",
      "wrong": "Noch nicht korrekt: Prüfe birthday und schreibe das Datum als Text im Format `'JJJJ-MM-TT'`."
    },
    "whereColumn": "birthday",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t6",
    "number": 6,
    "block": "B",
    "prompt": "**Gib** die Namen aller Mitglieder aus, die nicht in Leipzig wohnen.",
    "sql": "SELECT name FROM users WHERE city != 'Leipzig'",
    "select": "name",
    "tail": "FROM users\nWHERE city != 'Leipzig'",
    "hints": [
      "Gesucht sind nur Namen, nicht vollständige Datensätze.",
      "Für ‚nicht Leipzig‘ brauchst du einen Ungleichheitsoperator.",
      "Beginne mit `SELECT name FROM users`; hinter WHERE vergleichst du city mit `'Leipzig'` auf ungleich."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst die Namen aller Mitglieder mit einem eingetragenen anderen Wohnort als Leipzig.",
      "partial": "Teilweise korrekt: Prüfe, ob nur die Spalte name erscheint und die Bedingung Leipzig ausschließt.",
      "wrong": "Noch nicht korrekt: Verwende city für den Wohnort und `!=` oder `<>` für ungleich."
    },
    "whereColumn": "city",
    "projection": "name",
    "like": false,
    "join": ""
  },
  {
    "id": "t7",
    "number": 7,
    "block": "C",
    "prompt": "**Zeige** alle Mitglieder, deren Vorname mit B beginnt.",
    "sql": "SELECT * FROM users WHERE name LIKE 'B%'",
    "select": "*",
    "tail": "FROM users\nWHERE name LIKE 'B%'",
    "hints": [
      "In name steht der Vorname am Anfang des vollständigen Namens.",
      "Ein B am Anfang und beliebige Zeichen danach lassen sich mit LIKE suchen.",
      "Der Anfang des Musters ist `LIKE 'B%'`; ergänze die passende Spalte und gib alle Spalten aus."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze mit einem Vornamen, der mit B beginnt.",
      "partial": "Teilweise korrekt: Prüfe, ob B nur am Anfang stehen darf und ob alle Spalten ausgegeben werden.",
      "wrong": "Noch nicht korrekt: Das Muster für ‚beginnt mit B‘ braucht B vor dem Prozentzeichen."
    },
    "whereColumn": "name",
    "projection": "*",
    "like": true,
    "join": ""
  },
  {
    "id": "t8",
    "number": 8,
    "block": "C",
    "prompt": "**Zeige** alle Mitglieder, deren Benutzername die Zeichenfolge „fuchs“ enthält.",
    "sql": "SELECT * FROM users WHERE username LIKE '%fuchs%'",
    "select": "*",
    "tail": "FROM users\nWHERE username LIKE '%fuchs%'",
    "hints": [
      "Gesucht wird im Benutzernamen, nicht im vollständigen Namen.",
      "Vor und nach fuchs dürfen weitere Zeichen stehen.",
      "Verwende für username das Muster `'%fuchs%'`; gib alle Spalten aus."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze mit fuchs an beliebiger Stelle im Benutzernamen.",
      "partial": "Teilweise korrekt: Prüfe, ob das Muster vor und nach fuchs weitere Zeichen erlaubt.",
      "wrong": "Noch nicht korrekt: Vergleiche username mit LIKE; für ‚enthält‘ brauchst du Prozentzeichen an beiden Seiten."
    },
    "whereColumn": "username",
    "projection": "*",
    "like": true,
    "join": ""
  },
  {
    "id": "t9",
    "number": 9,
    "block": "C",
    "prompt": "**Gib** die Namen aller Mitglieder aus, die im März Geburtstag haben.",
    "sql": "SELECT name FROM users WHERE birthday LIKE '%-03-%'",
    "select": "name",
    "tail": "FROM users\nWHERE birthday LIKE '%-03-%'",
    "hints": [
      "Der Monat steht in birthday zwischen den beiden Bindestrichen.",
      "Ein Märzdatum hat im mittleren Teil `-03-`.",
      "Wähle nur name und nutze für birthday ein LIKE-Muster mit `-03-` in der Mitte."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst nur die Namen der Mitglieder mit Geburtstag im März.",
      "partial": "Teilweise korrekt: Prüfe, ob du nur Namen ausgibst und die 03 genau an der Monatsposition suchst.",
      "wrong": "Noch nicht korrekt: Suche im Datumsfeld birthday nach dem Monatsteil `-03-`, nicht nach irgendeiner 03."
    },
    "whereColumn": "birthday",
    "projection": "name",
    "like": true,
    "join": ""
  },
  {
    "id": "t10",
    "number": 10,
    "block": "D",
    "prompt": "**Finde** alle Mitglieder aus Berlin, deren Vorname Lina lautet.",
    "sql": "SELECT * FROM users WHERE name LIKE 'Lina %' AND city = 'Berlin'",
    "select": "*",
    "tail": "FROM users\nWHERE name LIKE 'Lina %' AND city = 'Berlin'",
    "hints": [
      "Hier müssen Vorname und Wohnort gleichzeitig passen.",
      "Verbinde die Bedingung für name und die für city mit AND.",
      "Die Teile lauten `name LIKE 'Lina %'` und `city = 'Berlin'`; verbinde sie hinter WHERE."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst alle Berliner Mitglieder mit Vornamen Lina.",
      "partial": "Teilweise korrekt: Prüfe, ob wirklich beide Bedingungen zugleich gelten und alle Daten erscheinen.",
      "wrong": "Noch nicht korrekt: Für beide Bedingungen brauchst du vollständige Vergleiche, verbunden mit AND."
    },
    "whereColumn": "name",
    "projection": "*",
    "like": true,
    "join": "AND"
  },
  {
    "id": "t11",
    "number": 11,
    "block": "D",
    "prompt": "**Liste** alle weiblichen Mitglieder aus Leipzig auf.",
    "sql": "SELECT * FROM users WHERE gender = 'female' AND city = 'Leipzig'",
    "select": "*",
    "tail": "FROM users\nWHERE gender = 'female' AND city = 'Leipzig'",
    "hints": [
      "Geschlecht und Wohnort müssen zugleich stimmen.",
      "Die beiden Spalten heißen gender und city.",
      "Verbinde `gender = 'female'` mit `city = 'Leipzig'` durch AND."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze aller weiblichen Mitglieder aus Leipzig.",
      "partial": "Teilweise korrekt: Prüfe, ob nur Datensätze erscheinen, die beide Bedingungen erfüllen.",
      "wrong": "Noch nicht korrekt: OR wäre hier zu weit; verknüpfe zwei vollständige Bedingungen mit AND."
    },
    "whereColumn": "gender",
    "projection": "*",
    "like": false,
    "join": "AND"
  },
  {
    "id": "t12",
    "number": 12,
    "block": "D",
    "prompt": "**Liste** alle Mitglieder auf, deren Vorname Lina oder Felix lautet.",
    "sql": "SELECT * FROM users WHERE name LIKE 'Lina %' OR name LIKE 'Felix %'",
    "select": "*",
    "tail": "FROM users\nWHERE name LIKE 'Lina %' OR name LIKE 'Felix %'",
    "hints": [
      "Hier genügt einer der beiden Vornamen.",
      "OR verbindet zwei vollständige Bedingungen für name.",
      "Formuliere für Lina und Felix je einen eigenen `name LIKE`-Vergleich und verbinde sie mit OR."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst alle Mitglieder mit Vornamen Lina oder Felix.",
      "partial": "Teilweise korrekt: Prüfe, ob Mitglieder beider Vornamen erscheinen und alle Spalten da sind.",
      "wrong": "Noch nicht korrekt: Nach OR muss wieder eine vollständige Bedingung stehen, nicht nur der zweite Textwert."
    },
    "whereColumn": "name",
    "projection": "*",
    "like": true,
    "join": "OR"
  },
  {
    "id": "t13",
    "number": 13,
    "block": "A",
    "prompt": "**Wähle** alle Mitglieder aus, die in Schwerin wohnen.",
    "sql": "SELECT * FROM users WHERE city = 'Schwerin'",
    "select": "*",
    "tail": "FROM users\nWHERE city = 'Schwerin'",
    "hints": [
      "Suche die Spalte für den Wohnort.",
      "Der Wohnort ist ein Textwert in city.",
      "Ergänze `WHERE city = 'Schwerin'` und wähle sämtliche Spalten."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze aus Schwerin.",
      "partial": "Teilweise korrekt: Prüfe, ob ausschließlich Schwerin und alle Spalten erfasst sind.",
      "wrong": "Noch nicht korrekt: Vergleiche city mit dem Textwert `'Schwerin'`."
    },
    "whereColumn": "city",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t14",
    "number": 14,
    "block": "A",
    "prompt": "**Wähle** alle Mitglieder mit der Rolle `user` aus.",
    "sql": "SELECT * FROM users WHERE role = 'user'",
    "select": "*",
    "tail": "FROM users\nWHERE role = 'user'",
    "hints": [
      "Die Rolle steht in der Spalte role.",
      "`user` ist hier ein Textwert.",
      "Nutze `WHERE role = 'user'` und gib alle Spalten aus."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze mit der Rolle user.",
      "partial": "Teilweise korrekt: Prüfe, ob die Rolle genau user lautet und alle Daten erscheinen.",
      "wrong": "Noch nicht korrekt: Vergleiche role mit `'user'` in einfachen Anführungszeichen."
    },
    "whereColumn": "role",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t15",
    "number": 15,
    "block": "B",
    "prompt": "**Liste** alle Mitglieder auf, deren Profil aktiviert ist. Der Wert 1 in `is_active` bedeutet „aktiviert“.",
    "sql": "SELECT * FROM users WHERE is_active = 1",
    "select": "*",
    "tail": "FROM users\nWHERE is_active = 1",
    "hints": [
      "Die Aktivierung ist als Zahl gespeichert.",
      "1 bedeutet aktiviert, 0 nicht aktiviert.",
      "Prüfe `WHERE is_active = 1`; für alle Daten brauchst du hinter SELECT den Stern."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze der aktivierten Mitglieder.",
      "partial": "Teilweise korrekt: Prüfe, ob du den Zahlenwert 1 verwendest und alle Spalten zeigst.",
      "wrong": "Noch nicht korrekt: Vergleiche is_active mit der Zahl 1, ohne Text-Anführungszeichen."
    },
    "whereColumn": "is_active",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t16",
    "number": 16,
    "block": "B",
    "prompt": "**Zeige** alle Mitglieder aus München. **Lies** die Anzahl an der Ergebnisrelation ab.",
    "sql": "SELECT * FROM users WHERE city = 'München'",
    "select": "*",
    "tail": "FROM users\nWHERE city = 'München'",
    "hints": [
      "Gesucht sind alle Datensätze aus einer Stadt.",
      "Filtere über city; die Anzahl steht an der Ergebnisrelation.",
      "Verwende `WHERE city = 'München'` und wähle alle Spalten. COUNT brauchst du nicht."
    ],
    "texts": {
      "ok": "Korrekt: Die Ergebnisrelation zeigt alle Münchner Mitglieder; ihre Zeilenanzahl ist die gesuchte Anzahl.",
      "partial": "Teilweise korrekt: Prüfe, ob die Zeilen nur München enthalten und alle Spalten angezeigt werden.",
      "wrong": "Noch nicht korrekt: Filtere city nach `'München'`; die Anzahl kannst du danach ablesen."
    },
    "whereColumn": "city",
    "projection": "*",
    "like": false,
    "join": ""
  },
  {
    "id": "t17",
    "number": 17,
    "block": "C",
    "prompt": "**Zeige** alle Mitglieder mit einer E-Mail-Adresse, die auf `@instahub.test` endet.",
    "sql": "SELECT * FROM users WHERE email LIKE '%@instahub.test'",
    "select": "*",
    "tail": "FROM users\nWHERE email LIKE '%@instahub.test'",
    "hints": [
      "Gesucht wird die Endung einer E-Mail-Adresse.",
      "Bei einer Endung steht `%` vor dem bekannten Text.",
      "Nutze für email ein LIKE-Muster, das mit `%` beginnt und mit `@instahub.test` endet."
    ],
    "texts": {
      "ok": "Korrekt: Alle Mitglieder erfüllen derzeit dieses E-Mail-Muster; die wirksame LIKE-Bedingung ist trotzdem Teil der Abfrage.",
      "partial": "Teilweise korrekt: Die Ergebnisrelation kann alle Mitglieder enthalten. Prüfe trotzdem, ob du email mit einem Endungsmuster filterst.",
      "wrong": "Noch nicht korrekt: Eine Abfrage ohne wirksames `WHERE email LIKE` zeigt zwar dieselben Zeilen, erfüllt aber die verlangte Mustersuche nicht."
    },
    "whereColumn": "email",
    "projection": "*",
    "like": true,
    "join": ""
  },
  {
    "id": "t18",
    "number": 18,
    "block": "C",
    "prompt": "**Gib** die Namen aller Mitglieder aus, deren vollständiger Name mit der Zeichenfolge „Schmidt“ endet.",
    "sql": "SELECT name FROM users WHERE name LIKE '%Schmidt'",
    "select": "name",
    "tail": "FROM users\nWHERE name LIKE '%Schmidt'",
    "hints": [
      "Die bekannte Zeichenfolge steht am Ende des vollständigen Namens.",
      "Vor Schmidt dürfen beliebige Zeichen stehen, auch direkt anschließend.",
      "Wähle nur name; für die Endung steht `%` vor `Schmidt`."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst Namen mit der Endung Schmidt; auch Goldschmidt kann deshalb passen.",
      "partial": "Teilweise korrekt: Prüfe die Position von `%` und ob nur name ausgegeben wird.",
      "wrong": "Noch nicht korrekt: Gesucht ist die Zeichenfolge am Ende des vollständigen Namens, nicht nur ein exakt gleicher Nachname."
    },
    "whereColumn": "name",
    "projection": "name",
    "like": true,
    "join": ""
  },
  {
    "id": "t19",
    "number": 19,
    "block": "D",
    "prompt": "**Gib** Benutzernamen und Geburtsdatum aller weiblichen Mitglieder aus, die kleiner als 1,60 m sind.",
    "sql": "SELECT username, birthday FROM users WHERE gender = 'female' AND centimeters < 160",
    "select": "username, birthday",
    "tail": "FROM users\nWHERE gender = 'female' AND centimeters < 160",
    "hints": [
      "Du brauchst zwei Ausgabespalten und zwei Bedingungen.",
      "160 cm ist die Grenze; genau 160 cm zählt nicht mit.",
      "Wähle username und birthday; verbinde `gender = 'female'` mit `centimeters < 160` durch AND."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst Benutzername und Geburtstag aller weiblichen Mitglieder unter 160 cm.",
      "partial": "Teilweise korrekt: Prüfe beide Ergebnisspalten und ob Geschlecht und Größenvergleich zugleich gelten.",
      "wrong": "Noch nicht korrekt: `centimeters < 160` und `gender = 'female'` müssen mit AND verbunden werden."
    },
    "whereColumn": "gender",
    "projection": "username, birthday",
    "like": false,
    "join": "AND"
  },
  {
    "id": "t20",
    "number": 20,
    "block": "D",
    "prompt": "**Liste** alle Mitglieder auf, deren Vorname Felix lautet und die nicht aus Berlin kommen.",
    "sql": "SELECT * FROM users WHERE name LIKE 'Felix %' AND city != 'Berlin'",
    "select": "*",
    "tail": "FROM users\nWHERE name LIKE 'Felix %' AND city != 'Berlin'",
    "hints": [
      "Vorname und Ausschluss von Berlin müssen beide gelten.",
      "Nutze für den Vornamen ein Anfangsmuster in name.",
      "Verbinde `name LIKE 'Felix %'` mit `city != 'Berlin'` durch AND."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst vollständige Datensätze der Felixe außerhalb Berlins.",
      "partial": "Teilweise korrekt: Prüfe, ob Berliner Felixe ausgeschlossen und alle anderen passenden Felixe enthalten sind.",
      "wrong": "Noch nicht korrekt: Verknüpfe die vollständige Namensbedingung mit dem Ungleichheitsvergleich für city durch AND."
    },
    "whereColumn": "name",
    "projection": "*",
    "like": true,
    "join": "AND"
  },
  {
    "id": "t21",
    "number": 21,
    "block": "D",
    "prompt": "Eine Bekannte aus Berlin heißt mit Vornamen Lina oder Hailey. **Liste** alle passenden Datensätze auf.",
    "sql": "SELECT * FROM users WHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %') AND city = 'Berlin'",
    "select": "*",
    "tail": "FROM users\nWHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %') AND city = 'Berlin'",
    "hints": [
      "Beide möglichen Vornamen müssen mit Berlin kombiniert werden.",
      "Fasse zuerst die beiden Namensbedingungen mit OR zusammen.",
      "Setze Klammern um die beiden vollständigen `name LIKE`-Bedingungen und verbinde die Klammer mit `city = 'Berlin'` durch AND."
    ],
    "texts": {
      "ok": "Korrekt: Du zeigst die Berliner Mitglieder mit Vornamen Lina oder Hailey.",
      "partial": "Teilweise korrekt: Prüfe, ob die Wohnortbedingung für beide Vornamen gilt.",
      "wrong": "Noch nicht korrekt: Ohne passende Klammern kann ein Vorname auch außerhalb Berlins durchrutschen."
    },
    "whereColumn": "name",
    "projection": "*",
    "like": true,
    "join": "OR"
  }
]
;
const TASK_BY_ID = new Map(TASKS.map((task) => [task.id, task]));
const TAB_TASKS = { simple: ['t1','t2','t3'], compare: ['t4','t5','t6'], like: ['t7','t8','t9'], combine: ['t10','t11','t12'], fast: Array.from({length:9},(_,i)=>`t${i+13}`) };

const FINAL_QUIZ = [
  {id:'q1', prompt:'Was geschieht bei einer lesenden Abfrage mit WHERE und SELECT?', hint:'Unterscheide die Ergebnisrelation von der gespeicherten Tabelle und Zeilen von Spalten.', options:[
    ['a','WHERE wählt passende Zeilen für die Ergebnisrelation.',true], ['b','SELECT legt die Ausgabespalten fest.',true], ['c','WHERE löscht nicht passende Datensätze aus users.',false], ['d','SELECT verändert die gespeicherten Werte in users.',false]]},
  {id:'q2', prompt:'Welche Aussagen zu Vergleichen in users stimmen?', hint:'Prüfe die Grenze 180 cm und die Schreibweise von Textwerten.', options:[
    ['a','`centimeters < 180` schließt genau 180 cm aus.',true], ['b','`centimeters <= 180` schließt genau 180 cm ein.',true], ['c','`city = Berlin` ist ein korrekter Textvergleich ohne Anführungszeichen.',false], ['d','In centimeters steht die Größe in Metern.',false]]},
  {id:'q3', prompt:'Welche LIKE-Muster passen zur genannten Suche?', hint:'Die Stelle des Prozentzeichens zeigt, wo weitere Zeichen stehen dürfen.', options:[
    ['a',"`name LIKE 'B%'` sucht Namen, die mit B beginnen.",true], ['b',"`username LIKE '%fuchs%'` sucht fuchs an beliebiger Stelle.",true], ['c',"`name LIKE 'B%'` sucht B an jeder Stelle des Namens.",false], ['d',"`name LIKE '%berg'` sucht Namen, die mit berg beginnen.",false]]},
  {id:'q4', prompt:'Welche Aussagen über AND und OR stimmen?', hint:'Vergleiche ‚beide‘ mit ‚mindestens eine, möglicherweise beide‘.', options:[
    ['a','Bei AND müssen beide Bedingungen erfüllt sein.',true], ['b','Bei OR genügt mindestens eine Bedingung; auch beide dürfen stimmen.',true], ['c','OR erlaubt genau eine wahre Bedingung.',false], ['d','AND genügt schon bei einer wahren Bedingung.',false]]},
  {id:'q5', prompt:'Welche Bedingung sucht Lina oder Hailey aus Berlin?', hint:'Die Stadtbedingung muss für beide Vornamen gelten. Setze Klammern um die beiden Namensbedingungen.', options:[
    ['a',"WHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %')\n  AND city = 'Berlin'",true,true],
    ['b',"WHERE name LIKE 'Lina %' OR name LIKE 'Hailey %'\n  AND city = 'Berlin'",false,true],
    ['c',"WHERE (name LIKE 'Lina %' AND name LIKE 'Hailey %')\n  OR city = 'Berlin'",false,true],
    ['d',"WHERE name LIKE 'Lina %' OR 'Hailey %'\n  AND city = 'Berlin'",false,true]]}
];
const INTRO_PHASES = ['1 · Auftrag','2 · Tabelle wählen','3 · Zeilen prüfen','4 · Ergebnis bilden'];
const INTRO_EXPLANATIONS = [
  'Welche Mitglieder dieses Ausschnitts wohnen in Berlin?',
  'FROM users nennt die Tabelle, aus der die Daten stammen.',
  "WHERE city = 'Berlin' prüft jetzt jede Zeile des Ausschnitts.",
  ...Array.from({length:6},(_,i)=>[3,5].includes(i) ? 'Bedingung erfüllt: Dieser Datensatz bleibt in der gefilterten Ansicht.' : 'Bedingung nicht erfüllt: Dieser Datensatz wird aus der gefilterten Ansicht entfernt.'),
  'Nach WHERE bleiben im Ausschnitt die beiden Berliner Datensätze übrig.',
  'SELECT username, city bestimmt die beiden Spalten der Ergebnisrelation.',
  'WHERE wählt Zeilen aus. Diese Auswahl heißt Selektion; SELECT wählt die Ausgabespalten.'
];
const INTRO_EXPECTED = [
  ['1','zornigerfotograf','Schwerin'],['2','wanderwut_finn','München'],['3','bergcoder','Zürich'],
  ['4','koch_kicker','Berlin'],['8','theaterwut_oscar','Leipzig'],['34','gartenlinse','Berlin']
];
let introRows = INTRO_EXPECTED.map(([id,username,city])=>({id,username,city}));
let memberCount = 317;

const state = {assessmentVersion:'20261029-criteria-v1', tab:'intro', introStep:1, answers:{}, feedback:{}, solved:{}, descriptionAnswers:{}, descriptionFeedback:{}, quiz:{}, quizFeedback:null, quizPassed:false};
const results = {};
const running = new Set();
const revisions = new Map();
const descriptionRequests = new Map();
let tabRevision = 0;
let database;
let databaseReady = false;
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Speicher optional. */ } }
function isPlainObject(value) { return Boolean(value) && typeof value==='object' && !Array.isArray(value); }
function validFeedback(value) { return isPlainObject(value) && FEEDBACK_LEVELS.includes(value.level) && typeof value.text==='string'; }
function validDescriptionFeedback(value) {
  return isPlainObject(value) && DESCRIPTION_LEVELS.includes(value.level) && typeof value.text==='string' &&
    (value.points===undefined || (Number.isInteger(value.points) && value.points>=0 && value.points<=3)) &&
    (value.maxPoints===undefined || value.maxPoints===3) &&
    (value.status===undefined || DESCRIPTION_STATUSES.includes(value.status)) &&
    (value.strengths===undefined || (Array.isArray(value.strengths) && value.strengths.every((s)=>typeof s==='string'))) &&
    (value.missing===undefined || (Array.isArray(value.missing) && value.missing.every((s)=>typeof s==='string')));
}
function restore() {
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if (!isPlainObject(saved)) return;
    if (TABS.some(([id])=>id===saved.tab)) state.tab=saved.tab;
    if (Number.isInteger(saved.introStep) && saved.introStep>=1 && saved.introStep<=12) state.introStep=saved.introStep;
    if (isPlainObject(saved.answers)) for (const [id,value] of Object.entries(saved.answers)) if (TASK_BY_ID.has(id) && typeof value==='string') state.answers[id]=value;
    if (isPlainObject(saved.feedback)) for (const [id,value] of Object.entries(saved.feedback)) if (TASK_BY_ID.has(id) && validFeedback(value)) state.feedback[id]=value;
    if (isPlainObject(saved.solved)) for (const [id,value] of Object.entries(saved.solved)) if (TASK_BY_ID.has(id) && value===true) state.solved[id]=true;
    if (isPlainObject(saved.descriptionAnswers) && typeof saved.descriptionAnswers[DESCRIPTION_TASK.id]==='string') state.descriptionAnswers[DESCRIPTION_TASK.id]=saved.descriptionAnswers[DESCRIPTION_TASK.id];
    if (saved.assessmentVersion===state.assessmentVersion && isPlainObject(saved.descriptionFeedback) && validDescriptionFeedback(saved.descriptionFeedback[DESCRIPTION_TASK.id])) state.descriptionFeedback[DESCRIPTION_TASK.id]=saved.descriptionFeedback[DESCRIPTION_TASK.id];
    if (isPlainObject(saved.quiz)) for (const q of FINAL_QUIZ) if (Array.isArray(saved.quiz[q.id])) state.quiz[q.id]=saved.quiz[q.id].filter((id)=>q.options.some(([option])=>option===id));
    if (validFeedback(saved.quizFeedback)) state.quizFeedback=saved.quizFeedback;
    state.quizPassed=saved.quizPassed===true;
  } catch { /* Defekter oder gesperrter Speicher. */ }
}
function isTabComplete(id) {
  if (id==='intro') return state.introStep===12;
  if (id==='quiz') return state.quizPassed;
  if (id==='simple') return Boolean(state.descriptionFeedback[DESCRIPTION_TASK.id]?.points===3) && TAB_TASKS.simple.every((task)=>state.solved[task]);
  return TAB_TASKS[id]?.every((task)=>state.solved[task]) || false;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Einfache Auszeichnung: **fett** und `code`; alles andere bleibt Text (kein innerHTML).
function richText(parent, text) {
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('**')) parent.append(element('strong', '', part.slice(2, -2)));
    else if (part.startsWith('`')) parent.append(element('code', '', part.slice(1, -1)));
    else parent.append(document.createTextNode(part));
  });
  return parent;
}
function paragraph(text, className) { return richText(element('p', className), text); }
function sqlBlock(text) { const pre = element('pre', 'given-sql'); pre.append(element('code', '', text)); return pre; }


class SqlWorker {
  constructor() { this.nextId = 0; this.pending = new Map(); }
  async init() {
    this.worker = new Worker(new URL('../../../../include/lib/sql.js/worker.sql-wasm.js', import.meta.url));
    this.worker.onmessage = (event) => { const pending = this.pending.get(event.data.id); if (!pending) return; this.pending.delete(event.data.id); if (event.data.error) pending.reject(new Error(event.data.error)); else pending.resolve(event.data); };
    this.worker.onerror = (event) => { this.pending.forEach(({ reject }) => reject(event.error || new Error('SQL-Worker nicht verfügbar.'))); this.pending.clear(); };
    await this.send({ action: 'open' });
    const response = await fetch(new URL('../../klasse-10/1-Datenbanken/users.csv', import.meta.url));
    if (!response.ok) throw new Error('users.csv konnte nicht geladen werden.');
    const [headers, ...data] = parseDelimited(await response.text());
    this.csvRows = data.map((row)=>Object.fromEntries(headers.map((header,index)=>[header,row[index]])));
    const schema = headers.map((name) => `${quoteIdentifier(name)} ${['id', 'centimeters', 'is_active'].includes(name) ? 'INTEGER' : 'TEXT'}`).join(', ');
    const statements = [`CREATE TABLE users (${schema})`];
    data.forEach((row) => statements.push(`INSERT INTO users (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header, index) => sqlValue(row[index], header)).join(', ')})`));
    await this.send({ action: 'exec', sql: statements.join(';') });
  }
  send(message) {
    return new Promise((resolve, reject) => {
      const id = `sql-${++this.nextId}`;
      const timeout = window.setTimeout(() => { if (!this.pending.delete(id)) return; reject(new Error('Der SQL-Worker antwortet nicht rechtzeitig.')); }, 15000);
      this.pending.set(id, { resolve: (value) => { window.clearTimeout(timeout); resolve(value); }, reject: (error) => { window.clearTimeout(timeout); reject(error); } });
      try { this.worker.postMessage({ ...message, id }); } catch (error) { window.clearTimeout(timeout); this.pending.delete(id); reject(error); }
    });
  }
  async exec(sqlText) { return normalizeRelation((await this.send({ action: 'exec', sql: sqlText })).results); }
  close() { if (this.worker) { this.send({ action: 'close' }).catch(() => {}); this.worker.terminate(); } }
}
// nach quoteIdentifier und sqlValue in klasse-10/1-Datenbanken/sql-lab.js, angepasst: nur die Spalten der Tabelle users
function quoteIdentifier(name) { return `"${String(name).replaceAll('"', '""')}"`; }
function sqlValue(value, header) {
  if (value === 'NULL' || value === undefined || value === null) return 'NULL';
  if (['id', 'centimeters', 'is_active'].includes(header) && /^-?\d+(?:\.\d+)?$/.test(value)) return value;
  return `'${String(value).replaceAll("'", "''")}'`;
}

// Abfragen laufen nur lesend; Ergebnisse der Referenzabfragen werden zwischengespeichert.
const execCache = new Map();
async function cachedExec(sqlText) {
  if (!execCache.has(sqlText)) execCache.set(sqlText, await database.exec(sqlText));
  return execCache.get(sqlText);
}


function splitGroups(tokens) {
  const groups = [[]];
  tokens.forEach((token) => { if (token.value === ',') groups.push([]); else groups.at(-1).push(token); });
  return groups;
}
function tokenKeyword(token) { return token?.type === 'word' ? token.value.toUpperCase() : ''; }
function identifierValue(token) {
  if (token?.type === 'word') return token.value;
  if (token?.type === 'string' && !token.value.startsWith("'")) return stripQuotes(token.value);
  return null;
}
function stripQuotes(value) { return String(value).replace(/^["'`]/, '').replace(/["'`]$/, ''); }

function analyzeQuery(sql) {
  const tokens = sqlTokens(sql).filter((token) => token.value !== ';');
  const keywords = tokens.map(tokenKeyword);
  const selectIndex = keywords.indexOf('SELECT');
  const fromIndex = keywords.indexOf('FROM', selectIndex + 1);
  const orderIndex = keywords.indexOf('ORDER');
  const limitIndex = keywords.indexOf('LIMIT');
  const distinctIndex = keywords.indexOf('DISTINCT');
  const whereIndex = keywords.indexOf('WHERE');
  const hasFrom = fromIndex > -1;
  const afterSelect = selectIndex + 1 + (keywords[selectIndex + 1] === 'DISTINCT' ? 1 : 0);
  const projectionEnd = hasFrom ? fromIndex : [orderIndex, limitIndex].filter((index) => index > -1).reduce((min, index) => Math.min(min, index), tokens.length);
  const analysis = {
    hasFrom,
    distinct: distinctIndex > -1,
    distinctMisplaced: distinctIndex > -1 && distinctIndex !== selectIndex + 1,
    columns: [],
    implicitAliases: [],
    selectAliases: [],
    trailingComma: hasFrom && tokens[fromIndex - 1]?.value === ',',
    orderBy: [],
    orderWithoutBy: (orderIndex > -1 && keywords[orderIndex + 1] !== 'BY') || keywords.includes('SORT'),
    limit: null,
    limitBeforeOrder: limitIndex > -1 && orderIndex > -1 && limitIndex < orderIndex,
    tokens,
    orderIndex,
    selectIndex,
    fromIndex,
    whereIndex,
    source: sql,
    distinctToken: distinctIndex > -1 ? tokens[distinctIndex] : null
  };
  splitGroups(tokens.slice(afterSelect, projectionEnd)).forEach((group) => {
    if (!analysis.columns) return;
    const values = group.map(identifierValue);
    if (group.length === 1 && (values[0] || group[0].value === '*')) analysis.columns.push((values[0] || '*').toLowerCase());
    else if (group.length === 3 && values[0] && group[1].value === '.' && (values[2] || group[2].value === '*')) analysis.columns.push((values[2] || '*').toLowerCase());
    else if (group.length === 3 && values[0] && tokenKeyword(group[1]) === 'AS' && values[2]) {
      analysis.columns.push(values[0].toLowerCase());
      analysis.selectAliases.push({ column: values[0].toLowerCase(), alias: values[2].toLowerCase() });
    }
    else if (group.length === 2 && values[0] && values[1]) {
      analysis.columns.push(values[0].toLowerCase());
      analysis.implicitAliases.push({ column: values[0].toLowerCase(), alias: values[1].toLowerCase() });
      analysis.selectAliases.push({ column: values[0].toLowerCase(), alias: values[1].toLowerCase() });
    } else analysis.columns = null;
  });
  if (orderIndex > -1 && keywords[orderIndex + 1] === 'BY') {
    const orderEnd = limitIndex > orderIndex ? limitIndex : tokens.length;
    splitGroups(tokens.slice(orderIndex + 2, orderEnd)).forEach((group) => {
      let parts = group; let dir = 'ASC';
      const last = tokenKeyword(parts.at(-1));
      if (last === 'ASC' || last === 'DESC') { dir = last; parts = parts.slice(0, -1); }
      if (!parts.length) return;
      const quoted = parts.some((token) => token.type === 'string' && token.value.startsWith("'"));
      const rawColumn = stripQuotes(sql.slice(parts[0].start, parts.at(-1).end)).split('.').at(-1).trim().toLowerCase();
      const column = analysis.selectAliases.find(({ alias }) => alias === rawColumn)?.column || rawColumn;
      analysis.orderBy.push({ column, dir, quoted });
    });
  }
  if (limitIndex > -1 && tokens[limitIndex + 1]?.type === 'number') analysis.limit = Number(tokens[limitIndex + 1].value);
  return analysis;
}


const GERMAN_COLUMN_HINTS = {
  benutzername: 'username', nutzername: 'username', benutzer: 'username',
  geburtstag: 'birthday', geburtsdatum: 'birthday',
  stadt: 'city', wohnort: 'city', ort: 'city',
  land: 'country', laender: 'country', länder: 'country',
  groesse: 'centimeters', größe: 'centimeters', grosse: 'centimeters', koerpergroesse: 'centimeters',
  geschlecht: 'gender',
  nummer: 'id'
};

function unknownColumnClause(sql, analysis, name) {
  const tokens = analysis.tokens;
  const ranges = [];
  if (analysis.selectIndex > -1 && analysis.fromIndex > analysis.selectIndex) {
    ranges.push({ clause: 'SELECT', start: tokens[analysis.selectIndex].end, end: tokens[analysis.fromIndex].start });
  }
  if (analysis.whereIndex > -1) {
    const endIndex = tokens.findIndex((token, index) => index > analysis.whereIndex && ['GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(tokenKeyword(token)));
    ranges.push({ clause: 'WHERE', start: tokens[analysis.whereIndex].end, end: endIndex < 0 ? sql.length : tokens[endIndex].start });
  }
  if (analysis.orderIndex > -1 && tokenKeyword(tokens[analysis.orderIndex + 1]) === 'BY') {
    const endIndex = tokens.findIndex((token, index) => index > analysis.orderIndex + 1 && tokenKeyword(token) === 'LIMIT');
    ranges.push({ clause: 'ORDER BY', start: tokens[analysis.orderIndex + 1].end, end: endIndex < 0 ? sql.length : tokens[endIndex].start });
  }
  const needle = name.toLowerCase(); const identifiers = [];
  for (let start = 0; start < tokens.length; start += 1) {
    const first = tokens[start];
    if (first.type === 'string') {
      if (!first.value.startsWith("'") && stripQuotes(first.value).toLowerCase() === needle) identifiers.push({ start: first.start, end: first.end });
      continue;
    }
    for (let end = start; end < tokens.length; end += 1) {
      const current = tokens[end];
      if (current.type === 'string' || (end > start && tokens[end - 1].end !== current.start)) break;
      const raw = sql.slice(first.start, current.end);
      if (raw.toLowerCase() === needle) {
        const before = sql[first.start - 1] || '';
        const after = sql[current.end] || '';
        if (!/[\p{L}\p{N}_$]/u.test(before) && !/[\p{L}\p{N}_$]/u.test(after)) identifiers.push({ start: first.start, end: current.end });
        break;
      }
      if (raw.length > name.length + 2) break;
    }
  }
  for (const range of ranges) {
    if (identifiers.some(({ start, end }) => start >= range.start && end <= range.end)) return range.clause;
  }
  return null;
}

function diagnoseError(error, sql) {
  const analysis = analyzeQuery(sql);
  const message = String(error?.message || error || '');
  if (!analysis.hasFrom) return 'Noch nicht korrekt: Es fehlt FROM. Gib hinter FROM an, aus welcher Tabelle die Daten stammen.';
  if (analysis.limitBeforeOrder) return 'Noch nicht korrekt: LIMIT steht vor ORDER BY. LIMIT steht immer ganz am Ende der Abfrage – also hinter ORDER BY.';
  if (analysis.distinctMisplaced) return 'Noch nicht korrekt: DISTINCT steht direkt hinter SELECT, zum Beispiel SELECT DISTINCT gender.';
  if (analysis.orderWithoutBy) return 'Noch nicht korrekt: Zum Sortieren schreibst du ORDER BY – beide Wörter sind nötig.';
  if (analysis.trailingComma) return 'Noch nicht korrekt: Hinter der letzten Spalte vor FROM steht kein Komma.';
  if (/no such table/i.test(message)) return 'Noch nicht korrekt: Eine Tabelle mit diesem Namen gibt es nicht. Die Tabelle heißt users – prüfe den Namen hinter FROM.';
  const unknown = message.match(/no such column:\s*(\S+)/i);
  if (unknown) {
    const name = stripQuotes(unknown[1]).split('.').pop();
    const clause = unknownColumnClause(sql, analysis, name) || 'SELECT';
    const english = GERMAN_COLUMN_HINTS[name.toLowerCase()];
    const englishHint = english ? ` Die Spaltennamen sind englisch – gemeint ist vermutlich ${english}.` : '';
    if (clause === 'WHERE') {
      const quoteHint = missingTextQuote(sql, name);
      if (quoteHint) return `Noch nicht korrekt: ${name} ist ein Textwert und braucht einfache Anführungszeichen.${englishHint}`;
      return `Noch nicht korrekt: Die Spalte ${name} hinter WHERE gibt es in users nicht. Prüfe den englischen Spaltennamen im Schema.${englishHint}`;
    }
    return `Noch nicht korrekt: Die Spalte ${name} hinter ${clause} gibt es in users nicht. Prüfe den englischen Spaltennamen im Schema.${english ? ` Die Spaltennamen sind englisch – gemeint ist vermutlich ${english}.` : ''}`;
  }
  return 'Noch nicht korrekt: SQL konnte die Abfrage nicht ausführen. Prüfe die markierte Klausel und ihre Schreibweise.';
}


function valueKey(value) { return value === null ? '__NULL__' : `${typeof value}:${String(value)}`; }
function rowKey(row) { return row.map(valueKey).join('\u001f'); }
function columnIndex(relation, name) { return relation.columns.findIndex((column) => column.toLowerCase() === name.toLowerCase()); }
function sameSet(left, right) { const a = new Set(left); const b = new Set(right); return a.size === b.size && [...a].every((value) => b.has(value)); }
function sameMultiset(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const counts = new Map();
  left.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  for (const value of right) {
    const remaining = counts.get(value) || 0;
    if (!remaining) return false;
    counts.set(value, remaining - 1);
  }
  return [...counts.values()].every((count) => count === 0);
}


function relationSubset(actual, expected, actualNames, expectedNames) {
  if (!actualNames || !expectedNames || actualNames.length !== actual.columns.length || expectedNames.length !== expected.columns.length || !sameSet(actualNames, expectedNames)) return false;
  const key = (row, names) => JSON.stringify(names.map((name, index) => [name.toLowerCase(), valueKey(row[index])]).sort(([left], [right]) => left.localeCompare(right)));
  const counts = new Map();
  expected.values.forEach((row) => { const rowKey = key(row, expectedNames); counts.set(rowKey, (counts.get(rowKey) || 0) + 1); });
  return actual.values.every((row) => { const rowKey = key(row, actualNames); const remaining = counts.get(rowKey) || 0; if (!remaining) return false; counts.set(rowKey, remaining - 1); return true; });
}


function expectedColumns(task) { return task.projection==='*' ? USER_COLUMN_NAMES : task.projection.split(',').map((value)=>value.trim().toLowerCase()); }
function actualColumns(analysis, actual) {
  if (!analysis.columns) return actual.columns.map((value)=>value.toLowerCase());
  const names=analysis.columns.flatMap((value)=>value==='*' ? USER_COLUMN_NAMES : [value]);
  return names.length===actual.columns.length ? names : actual.columns.map((value)=>value.toLowerCase());
}
function whereTokens(analysis) {
  if (analysis.whereIndex<0) return [];
  const end=analysis.tokens.findIndex((token,index)=>index>analysis.whereIndex && ['ORDER','GROUP','HAVING','LIMIT'].includes(tokenKeyword(token)));
  return analysis.tokens.slice(analysis.whereIndex+1,end<0?undefined:end);
}
function featureIssue(task,analysis) {
  const tokens=whereTokens(analysis);
  const words=tokens.map(tokenKeyword);
  const column=task.whereColumn;
  const hasColumn=tokens.some((token)=>identifierValue(token)?.toLowerCase()===column);
  const hasComparison=tokens.some((token)=>['=','<','>','<=','>=','<>','!='].includes(token.value));
  const hasLike=words.includes('LIKE');
  if (!tokens.length || !hasColumn || (!hasComparison && !hasLike)) return {level:'hint',text:`Noch nicht korrekt: Die Aufgabe verlangt eine wirksame WHERE-Bedingung auf ${column}. Prüfe, welche Zeilen ausgewählt werden sollen.`};
  if (task.like && !hasLike) return {level:'hint',text:`Noch nicht korrekt: Die Aufgabe verlangt eine wirksame WHERE-Bedingung auf ${column}. Prüfe, welche Zeilen ausgewählt werden sollen.`};
  if (task.number===17) {
    const pattern=tokens.find((token)=>token.type==='string' && token.value.startsWith("'"));
    if (!pattern || !pattern.value.toLowerCase().endsWith("@instahub.test'")) return {level:'hint',text:'Noch nicht korrekt: Alle E-Mail-Adressen passen derzeit, aber verlangt ist eine wirksame LIKE-Bedingung für die Endung `@instahub.test`.'};
  }
  if (task.join && !words.includes(task.join)) return {level:'partial',text:task.texts.partial};
  if (task.number===21 && (!tokens.some((token)=>token.value==='(') || !tokens.some((token)=>token.value===')'))) return {level:'partial',text:'Teilweise korrekt: Die Berliner Bedingung muss für beide Vornamen gelten. Fasse die beiden Namensbedingungen mit Klammern zusammen.'};
  return null;
}
function withWhereProbes(task, sql) {
  // Die bestehende E-Mail-Gegenprobe auf alle Filteraufgaben erweitern.
  // Werte an der Vergleichsgrenze und Kombinationen erfüllter/nicht erfüllter
  // Teilbedingungen prüfen; users und die angezeigten Ergebnisse bleiben gleich.
  const choices = new Map();
  const tokens = whereTokens(analyzeQuery(task.sql));
  tokens.forEach((token, index) => {
    const column = identifierValue(token)?.toLowerCase();
    const operator = tokens[index + 1]?.value.toUpperCase();
    const literal = tokens[index + 2];
    if (!USER_COLUMN_NAMES.includes(column) || !['=', '<', '>', '<=', '>=', '!=', '<>', 'LIKE'].includes(operator) || !literal) return;
    let values;
    if (literal.type === 'number') {
      const value = Number(literal.value);
      values = column === 'is_active' ? [0, 1, null] : [value - 1, value, value + 1, null];
    } else if (literal.type === 'string' && literal.value.startsWith("'")) {
      const value = literal.value.slice(1, -1).replaceAll("''", "'");
      if (column === 'birthday') {
        // Nur gültige ISO-Daten: Monatssuche nicht durch künstliche,
        // ungültige Datumszeichenfolgen fälschlich als falsch bewerten.
        values = ['2003-01-03', '2007-03-01', '2007-03-31', '2007-04-03', null];
        if (operator !== 'LIKE') {
          const date = new Date(value + 'T00:00:00Z');
          values.push(value, ...[-1, 1].map(days => new Date(date.getTime() + days * 86400000).toISOString().slice(0, 10)));
        }
      } else {
        const stem = operator === 'LIKE' ? value.replaceAll('%', '').replaceAll('_', 'x') : value;
        values = [stem, `x${stem}`, `${stem}x`, `x${stem}x`, '__anderer_wert__', '', null];
      }
    } else return;
    choices.set(column, [...new Set([...(choices.get(column) || []), ...values])]);
  });
  let rows = [{}];
  choices.forEach((values, column) => { rows = rows.flatMap(row => values.map(value => ({ ...row, [column]: value }))); });
  const tuples = rows.map((row, index) => '(' + USER_COLUMN_NAMES.map(column => {
    const fallback = column === 'id' ? 900000 + index : column === 'centimeters' ? 170 : column === 'is_active' ? 1 : `__${column}_${index}__`;
    return sqlValue(Object.hasOwn(row, column) ? row[column] : fallback, column);
  }).join(', ') + ')');
  // main.users bezeichnet dieselbe Tabelle und muss auch an der Gegenprobe
  // teilnehmen; SQL-Bezeichner bearbeiten, keine Texte oder Kommentare ersetzen.
  const inputTokens = sqlTokens(sql);
  for (let index = inputTokens.length - 3; index >= 0; index -= 1) {
    if (identifierValue(inputTokens[index])?.toLowerCase() === 'main' && inputTokens[index + 1].value === '.' && identifierValue(inputTokens[index + 2])?.toLowerCase() === 'users') {
      sql = sql.slice(0, inputTokens[index].start) + sql.slice(inputTokens[index + 2].start);
    }
  }
  return `WITH users (${USER_COLUMN_NAMES.map(quoteIdentifier).join(', ')}) AS (VALUES ${tuples.join(', ')})\n${sql}`;
}
async function evaluate(task,analysis,actual) {
  const actualNames=actualColumns(analysis,actual), expectedNames=expectedColumns(task);
  const required=new Set(expectedNames);
  if (analysis.implicitAliases.some(({column,alias})=>required.has(column)&&required.has(alias)&&!actualNames.includes(alias)))
    return {level:'hint',text:'Noch nicht korrekt: Zwischen zwei gewünschten Spalten fehlt ein Komma. SQL liest das zweite Wort sonst als Alias der ersten Spalte.'};
  if (!sameMultiset(actualNames,expectedNames)) {
    if ((actualNames.includes('name') && expectedNames.includes('username')) || (actualNames.includes('username') && expectedNames.includes('name')))
      return {level:'hint',text:'Noch nicht korrekt: name enthält den vollständigen Namen, username den Benutzernamen. Prüfe, welche Spalte die Aufgabe verlangt.'};
    const extra=task.projection==='*' ? ' Für einen vollständigen Datensatz fehlen noch Spalten.' : '';
    return {level:'hint',text:`Noch nicht korrekt: Die ausgegebenen Spalten passen noch nicht. Vergleiche SELECT mit dem Arbeitsauftrag und dem Schema.${extra}`};
  }
  if (analysis.limit!==null) return {level:'partial',text:'Teilweise korrekt: Deine Ergebnisrelation ist begrenzt. Gesucht sind alle passenden Mitglieder; entferne LIMIT.'};
  const reference=await cachedExec(task.sql);
  if (analysis.distinct) {
    const without=await cachedExec(`${analysis.source.slice(0,analysis.distinctToken.start)}${analysis.source.slice(analysis.distinctToken.end)}`);
    if (without.values.length>actual.values.length) return {level:'partial',text:'Teilweise korrekt: DISTINCT entfernt hier benötigte Zeilen. Gesucht sind alle passenden Mitglieder.'};
  }
  const issue=featureIssue(task,analysis); if (issue) return issue;
  const equal=compareRelations(actual,reference,{columnOrder:task.number!==19,columnLabels:false,rowOrder:false}).correct;
  if (equal) {
    const probeActual=await cachedExec(withWhereProbes(task,analysis.source));
    const probeReference=await cachedExec(withWhereProbes(task,task.sql));
    if (!compareRelations(probeActual,probeReference,{columnOrder:task.number!==19,columnLabels:false,rowOrder:false}).correct) {
      if (task.number===17) return {level:'hint',text:'Noch nicht korrekt: Alle E-Mail-Adressen passen derzeit, aber verlangt ist eine wirksame LIKE-Bedingung für die Endung `@instahub.test`.'};
      const subset=probeActual.values.length===0 || relationSubset(probeActual,probeReference,actualNames,expectedNames);
      return {level:'partial',text:subset
        ? 'Teilweise korrekt: Deine WHERE-Bedingung schließt auch passende Mitglieder aus. Prüfe zusätzliche Einschränkungen und Vergleichsgrenzen.'
        : 'Teilweise korrekt: Deine WHERE-Bedingung kann auch Mitglieder auswählen, die der Auftrag ausschließt. Prüfe Vergleichswerte, Muster und Verknüpfungen.'};
    }
  }
  if (equal) return {level:'success',text:task.texts.ok,solved:true};
  const where=whereTokens(analysis), words=where.map(tokenKeyword);
  if (task.number===4 && where.some((token)=>token.value==='<=') && where.some((token)=>token.value==='180')) return {level:'partial',text:'Teilweise korrekt: Prüfe die Grenze und den Vergleichsoperator. ‚Kleiner als‘ schließt den Grenzwert aus.'};
  if ((task.number===4 || task.number===19) && where.some((token)=>token.value==='1.80' || token.value==='1.60')) return {level:'hint',text:'Noch nicht korrekt: centimeters speichert Zentimeter. Wandle Meter vor dem Vergleich um.'};
  if (task.number===12 && words.includes('AND') && !words.includes('OR')) return {level:'partial',text:'Teilweise korrekt: Hier genügt einer der beiden Vornamen. Prüfe, ob OR statt AND gebraucht wird.'};
  if ([10,11,19,20].includes(task.number) && words.includes('OR') && !words.includes('AND')) return {level:'partial',text:'Teilweise korrekt: Beide Bedingungen müssen zugleich gelten. Prüfe, ob AND statt OR gebraucht wird.'};
  if (task.number===21 && words.includes('OR') && words.includes('AND') && !where.some((token)=>token.value==='(')) return {level:'partial',text:'Teilweise korrekt: Die Berliner Bedingung muss für beide Vornamen gelten. Fasse die beiden Namensbedingungen mit Klammern zusammen.'};
  if (task.like) {
    const pattern=where.find((token)=>token.type==='string' && token.value.startsWith("'"))?.value || '';
    if (task.number===9 && pattern.includes('%03%')) return {level:'partial',text:"Teilweise korrekt: Suche die 03 an der Monatsposition zwischen den Bindestrichen; `'%03%'` trifft auch andere Datumsteile."};
    if (task.number===8 && !(pattern.startsWith("'%") && pattern.endsWith("%'"))) return {level:'partial',text:'Teilweise korrekt: Prüfe die Position der Prozentzeichen. Bei ‚enthält‘ dürfen vor und nach dem Suchtext Zeichen stehen.'};
    if ([7,10,12,20,21].includes(task.number) && pattern.startsWith("'%")) return {level:'partial',text:'Teilweise korrekt: Bei ‚beginnt mit‘ steht das Prozentzeichen nach dem bekannten Anfang.'};
    if ([17,18].includes(task.number) && !pattern.startsWith("'%")) return {level:'partial',text:'Teilweise korrekt: Bei ‚endet mit‘ steht das Prozentzeichen vor der bekannten Endung.'};
  }
  if (task.number===5 && actual.values.length===0) return {level:'hint',text:"Noch nicht korrekt: birthday speichert Datumswerte als `'JJJJ-MM-TT'`. Prüfe Jahr, Monat und Tag."};
  if (!actual.values.length && reference.values.length) return {level:'hint',text:task.texts.wrong};
  const subset=relationSubset(actual,reference,actualNames,expectedNames);
  if (subset && actual.values.length<reference.values.length) return {level:'partial',text:'Teilweise korrekt: Es fehlen passende Mitglieder. Prüfe, ob eine zusätzliche Bedingung zu viele Zeilen ausschließt.'};
  if (actual.values.length>reference.values.length) return {level:'partial',text:'Teilweise korrekt: Es erscheinen zu viele Mitglieder. Prüfe die WHERE-Bedingung.'};
  if (actual.values.length===reference.values.length) return {level:'partial',text:'Teilweise korrekt: Die Zeilenzahl stimmt, aber es sind nicht dieselben Mitglieder. Prüfe den Vergleichswert und die Bedingung.'};
  return {level:'hint',text:task.texts.wrong};
}

function taskCard(taskConfig) { return document.getElementById(`task-${taskConfig.id}`); }

function applyFeedback(taskConfig, level, text, { solved = false, relation = null, persist = true } = {}) {
  state.feedback[taskConfig.id] = { level, text };
  if (solved) state.solved[taskConfig.id] = true; else delete state.solved[taskConfig.id];
  if (relation) results[taskConfig.id] = relation; else delete results[taskConfig.id];
  if (persist) save();
  renderTaskOutput(taskConfig);
  updateTabMarks();
}

// nach renderTaskFeedback in klasse-10/1-Datenbanken/sql-lab.js, angepasst: Rückmeldung bleibt als aria-live-Bereich bestehen, Relation liegt in einem eigenen Platzhalter
function renderTaskOutput(taskConfig) {
  const card = taskCard(taskConfig);
  if (!card) return;
  const feedback = state.feedback[taskConfig.id];
  const box = card.querySelector('.sql-feedback');
  box.className = `feedback ${feedback ? feedback.level : ''} sql-feedback`;
  box.textContent = feedback ? feedback.text : '';
  const slot = card.querySelector('.sql9-relation-slot');
  slot.replaceChildren();
  if (results[taskConfig.id]) slot.append(renderRelation(results[taskConfig.id]));
  const run = card.querySelector('.sql9-run');
  if (run) run.disabled = !databaseReady || running.has(taskConfig.id);
}

async function runTask(taskConfig, { auto = false } = {}) {
  if (running.has(taskConfig.id)) return;
  const sqlText = state.answers[taskConfig.id] || '';
  if (!sqlText.trim()) { applyFeedback(taskConfig,'hint','Noch nicht korrekt: Schreibe zuerst eine SELECT-Abfrage in das Eingabefeld.'); return; }
  const check = validateSelectStatement(sqlText);
  if (!check.ok) { applyFeedback(taskConfig, 'hint', 'Noch nicht korrekt: Hier ist genau eine lesende SELECT-Abfrage erlaubt.'); return; }
  if (!databaseReady) { applyFeedback(taskConfig, 'hint', 'Warte bitte, bis die Tabelle users vollständig geladen ist.', { persist: false }); return; }
  running.add(taskConfig.id);
  const revision = revisions.get(taskConfig.id) || 0;
  const activeTabRevision = tabRevision;
  if (auto) renderTaskOutput(taskConfig);
  else { const box=taskCard(taskConfig)?.querySelector('.sql-feedback'); if(box){box.className='feedback hint sql-feedback';box.textContent='Die Abfrage wird ausgeführt …';} }
  try {
    const actual = await database.exec(check.sql);
    const verdict = await evaluate(taskConfig, analyzeQuery(check.sql), actual);
    if ((state.answers[taskConfig.id] || '') === sqlText && revisions.get(taskConfig.id) === revision && tabRevision === activeTabRevision) applyFeedback(taskConfig, verdict.level, verdict.text, { solved: verdict.solved === true, relation: actual });
  } catch (error) {
    if ((state.answers[taskConfig.id] || '') === sqlText && revisions.get(taskConfig.id) === revision && tabRevision === activeTabRevision) applyFeedback(taskConfig, 'error', diagnoseError(error, check.sql));
  } finally {
    running.delete(taskConfig.id);
    renderTaskOutput(taskConfig);
  }
}

// nach renderRelation in klasse-10/1-Datenbanken/sql-lab.js, angepasst: alle Zeilen statt höchstens 100, kein aria-live am Container
function renderRelation(relation) {
  const shell = element('section', 'table-shell result-relation');
  shell.setAttribute('aria-label', 'Ergebnisrelation deiner SQL-Abfrage');
  const caption = element('div', 'table-caption');
  caption.append(element('strong', '', 'Ergebnisrelation'), element('span', '', `${relation.values.length} Zeile(n)`));
  shell.append(caption);
  if (!relation.values.length) { shell.append(element('p', 'empty-result', 'Die Abfrage ist gültig, liefert aber keine Zeilen.')); return shell; }
  const scroll = element('div', 'table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Ergebnisrelation horizontal und vertikal scrollen');
  const table = element('table', `data-table${relation.columns.length <= 3 ? ' compact' : ''}`);
  table.append(element('caption', 'visually-hidden', 'Ergebnis deiner SQL-Abfrage'));
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  relation.columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  relation.values.forEach((values) => { const tr = document.createElement('tr'); values.forEach((value) => tr.append(element('td', '', value === null ? 'NULL' : String(value)))); body.append(tr); });
  table.append(head, body); scroll.append(table); shell.append(scroll);
  return shell;
}

// nach appendHints in klasse-10/1-Datenbanken/sql-lab.js, angepasst: eine Hilfe kann Text, einen SQL-Block und einen Schlusstext enthalten
function appendHints(card, hints) {
  const box = element('div', 'help-stack');
  hints.forEach((hint, index) => {
    const details = element('details'); details.append(element('summary', '', `Hilfe ${index + 1}`));
    const parts = typeof hint === 'string' ? { before: hint } : hint;
    if (parts.before) details.append(element('p', '', parts.before));
    if (parts.sql) details.append(sqlBlock(parts.sql));
    if (parts.after) details.append(element('p', '', parts.after));
    box.append(details);
  });
  card.append(box);
}

function renderDescriptionFeedback(task, box) {
  box.replaceChildren();
  const feedback = state.descriptionFeedback[task.id];
  if (!feedback) return;
  const level = Number.isInteger(feedback.points) ? feedback.points === 3 ? 'success' : feedback.points > 0 ? 'partial' : 'error' : feedback.level;
  box.className = `result server-feedback ${level}`;
  if (Number.isInteger(feedback.points)) {
    renderCompactEvaluation(box, { ...feedback, maxPoints: 3, feedback: feedback.text }, { maxHints: 1 });
  } else box.append(element('p', '', feedback.text));
}

function renderDescriptionTask(task) {
  const card = element('section', 'task-card sql-task description-task');
  card.id = `task-${task.id}`;
  card.append(element('h3', '', task.title), element('p', 'description-task-tab', task.tabLabel), paragraph(task.prompt), sqlBlock(task.sql));
  const label = element('label', 'sql-label', 'Deine Erklärung');
  label.htmlFor = `input-${task.id}`;
  const input = document.createElement('textarea');
  input.id = label.htmlFor; input.className = 'description-input'; input.maxLength = 1200; input.value = state.descriptionAnswers[task.id] || '';
  input.addEventListener('input', () => {
    state.descriptionAnswers[task.id] = input.value;
    descriptionRequests.set(task.id, (descriptionRequests.get(task.id) || 0) + 1);
    delete state.descriptionFeedback[task.id]; save(); renderDescriptionFeedback(task, output); updateTabMarks();
  });
  card.append(label, input);
  appendHints(card, task.hints);
  const actions = element('div', 'action-row');
  const button = element('button', 'primary-button', 'Erklärung prüfen'); button.type = 'button';
  button.addEventListener('click', () => submitDescription(task, input, button, output));
  actions.append(button); card.append(actions);
  const output = element('section', 'result server-feedback'); output.setAttribute('aria-live', 'polite');
  card.append(output); renderDescriptionFeedback(task, output);
  return card;
}

async function submitDescription(task, input, button, output) {
  if (button.disabled) return;
  const submittedText = input.value;
  if (submittedText.trim().length < 10) {
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Bitte formuliere eine etwas ausführlichere Antwort.' };
    save(); renderDescriptionFeedback(task, output); input.focus(); return;
  }
  if (!isValidScriptServerUrl(SCRIPT_SERVER_URL)) {
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.' };
    save(); renderDescriptionFeedback(task, output); return;
  }
  const requestId = (descriptionRequests.get(task.id) || 0) + 1;
  descriptionRequests.set(task.id, requestId);
  const submittedTabRevision = tabRevision;
  input.disabled = true; button.disabled = true; button.textContent = 'Erklärung wird geprüft …';
  output.replaceChildren(element('p', '', 'Deine Erklärung wird ausgewertet.'));
  output.className = 'result server-feedback';
  const stillCurrent = () => descriptionRequests.get(task.id) === requestId && tabRevision === submittedTabRevision && state.tab === task.tab && input.value === submittedText;
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.serverTaskId, answer: submittedText, expectedMaxPoints: 3 });
    if (!stillCurrent()) return;
    const classified = classifyDescriptionResult(result);
    if (classified.level !== 'error' && !String(result.feedback || '').trim()) {
      const key = classified.status === 'korrekt' ? 'korrekt' : classified.status === 'teilweise korrekt' ? 'partial' : 'incorrect';
      classified.text = task.fallbacks[key];
    }
    state.descriptionFeedback[task.id] = classified;
  } catch (error) {
    if (!stillCurrent()) return;
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.' };
  } finally {
    if (stillCurrent()) {
      input.disabled = false; button.disabled = false; button.textContent = 'Erklärung prüfen';
      save(); renderDescriptionFeedback(task, output); updateTabMarks();
    } else if (input.isConnected && tabRevision === submittedTabRevision && state.tab === task.tab) {
      input.disabled = false; button.disabled = false; button.textContent = 'Erklärung prüfen';
    }
  }
}

function renderTask(taskConfig) {
  const card = element('section', 'task-card sql-task'); card.id = `task-${taskConfig.id}`;
  card.append(element('h3', '', `Aufgabe ${taskConfig.number}`), paragraph(taskConfig.prompt));
  // nach renderSqlTask in klasse-10/1-Datenbanken/sql-lab.js, angepasst: eigene Prüflogik, Hilfen über appendHints
  const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = `input-${taskConfig.id}`;
  const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = NEUTRAL_SQL_PLACEHOLDER;
  const hasSavedAnswer = Object.prototype.hasOwnProperty.call(state.answers, taskConfig.id);
  input.value = hasSavedAnswer ? state.answers[taskConfig.id] : '';

  const resetOutput = () => {
    const wasSolved = Boolean(state.solved[taskConfig.id]);
    revisions.set(taskConfig.id, (revisions.get(taskConfig.id)||0)+1);
    delete state.feedback[taskConfig.id]; delete state.solved[taskConfig.id]; delete results[taskConfig.id];
    save(); renderTaskOutput(taskConfig);
    if (wasSolved) updateTabMarks();
  };
  input.addEventListener('input', () => { state.answers[taskConfig.id] = input.value; resetOutput(); });
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runTask(taskConfig); } });

  card.append(label, input);
  appendHints(card, taskConfig.hints);
  const actions = element('div', 'action-row');
  const run = element('button', 'primary-button sql9-run', 'Abfrage prüfen'); run.type = 'button'; run.disabled = !databaseReady;
  run.addEventListener('click', () => runTask(taskConfig));
  actions.append(run);
  actions.append(element('span', 'shortcut-hint', 'Strg/Cmd + Enter'));
  card.append(actions);
  const output = element('div', 'sql9-task-output');
  const feedback = element('p', 'feedback sql-feedback'); feedback.setAttribute('aria-live', 'polite');
  output.append(feedback, element('div', 'sql9-relation-slot'));
  card.append(output);

  return card;
}


function updateTabMarks() { TABS.forEach(([id]) => document.getElementById(`tab-${id}`)?.classList.toggle('is-complete', isTabComplete(id))); }
function tabIndex(id) { return TABS.findIndex(([tabId]) => tabId === id); }
function activateTab(id, { focusContent = false } = {}) { tabRevision += 1; state.tab = id; save(); render({ focusContent }); }

function renderTabs() {
  const tabs = document.getElementById('sql-tabs'); tabs.replaceChildren();
  TABS.forEach(([id, label], index) => {
    const button = element('button', `step-tab${isTabComplete(id) ? ' is-complete' : ''}`);
    button.type = 'button'; button.id = `tab-${id}`; button.dataset.tab = id; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'sql-panel');
    button.setAttribute('aria-selected', String(state.tab === id));
    button.append(element('span', '', String(index + 1)), element('small', '', label));
    button.addEventListener('click', () => activateTab(id));
    tabs.append(button);
  });
  enableTabKeyboardNavigation(tabs);
  syncTabSemantics(tabs, state.tab);
}

// nach schemaCard in klasse-10/1-Datenbanken/sql-lab.js
function schemaCard(schemas) {
  const card = element('aside', 'scenario-card accent sql-schema-card'); card.setAttribute('aria-label', 'Tabellenschema der SQL-Übungsdaten');
  const scroll = element('div', 'schema-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Tabellenschemata horizontal scrollen');
  // Überschrift und Innenabstände gehören zur Wischfläche des gesamten Kastens.
  scroll.append(element('strong', 'schema-title', schemas.length === 1 ? 'Tabellenschema' : 'Tabellenschemata'));
  schemas.forEach(({ table, columns }) => scroll.append(element('code', 'schema-code', `${table} (${columns.map(([name, type]) => `${name}: ${type}`).join(', ')})`)));
  card.append(scroll);
  return card;
}

function stepHeading(id) {
  const [, , kicker, title] = TABS[tabIndex(id)];
  const heading = element('div', 'step-heading'); heading.append(element('span', 'step-number', String(tabIndex(id) + 1)));
  const copy = element('div'); copy.append(element('p', 'step-kicker', kicker), element('h2', '', title)); heading.append(copy);
  return heading;
}

function render({ focusContent = false } = {}) {
  document.body.classList.toggle('sql-intro-active', state.tab === 'intro');
  renderTabs();
  const panel = document.getElementById('sql-panel'); panel.replaceChildren();
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  if (state.tab !== 'intro' && state.tab !== 'quiz') panel.append(schemaCard(USERS_TABLE_SCHEMAS));
  panel.append(stepHeading(state.tab));
  if (state.tab === 'intro') renderIntro(panel);
  else if (state.tab === 'quiz') renderQuiz(panel);
  else renderTaskTab(panel);
  renderTabFlowNavigation(panel, { items: TABS.map(([id, label]) => ({ id, label })), currentId: state.tab, onNavigate: activateTab });
  if (focusContent) focusTabPanelStart(panel);
}


function exampleTable(caption, columns, rows, className = '') {
  const table = element('table', `data-table sql9-mini-table${className ? ` ${className}` : ''}`);
  table.append(element('caption', '', caption));
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  rows.forEach((values) => { const tr = document.createElement('tr'); values.forEach((value) => tr.append(element('td', '', value))); body.append(tr); });
  table.append(head, body);
  return table;
}

function explainCard(title) { const card = element('section', 'scenario-card aggregate-intro'); card.append(element('h3', '', title)); return card; }


function explainContent(tab) {
  const card=explainCard({simple:'Kurz erklärt: WHERE und Gleichheit',compare:'Kurz erklärt: Vergleichen mit WHERE',like:'Kurz erklärt: Muster suchen',combine:'Kurz erklärt: Bedingungen verknüpfen'}[tab]);
  if (tab==='simple') card.append(paragraph("In `users` hat jedes Mitglied einen Wohnort. Mit `WHERE city = 'München'` gelangen nur Zeilen mit diesem Wohnort in die Ergebnisrelation. `WHERE` ist die Bedingung für die Zeilenauswahl; `=` vergleicht auf Gleichheit. Text- und Datumswerte stehen in einfachen Anführungszeichen, Spaltennamen nicht. Die Ausgabespalten hinter `SELECT` müssen nicht die Spalten aus `WHERE` sein."),sqlBlock("SELECT username, city\nFROM users\nWHERE city = 'München'"));
  if (tab==='compare') card.append(paragraph('`centimeters < 180` trifft eine Größe von 175 cm, aber nicht 180 cm. `centimeters <= 180` trifft auch 180 cm.'),paragraph("Die Größen sind in Zentimetern gespeichert. `=` bedeutet gleich, `<` kleiner als, `>` größer als, `<=` höchstens, `>=` mindestens und `<>` oder `!=` ungleich. Für ein Datum verwende das Format `'JJJJ-MM-TT'`, zum Beispiel `'2007-09-17'."),paragraph('Beim Konto admin ist kein Wohnort eingetragen (`NULL`). Ein normaler Vergleich mit `NULL` erfüllt diese WHERE-Bedingung nicht; admin erscheint deshalb hier nicht.'));
  if (tab==='like') card.append(paragraph("`'B%'` trifft Ben Neumann, weil sein Name mit B beginnt. `'%berg'` trifft Carl Seidenberg, weil der vollständige Name mit berg endet. `'%berg%'` trifft auch Theo Bergmeister, weil berg irgendwo im Namen steht."),paragraph('Mit `LIKE` vergleichst du einen Text mit einem Muster. `%` steht für beliebig viele Zeichen, auch für kein Zeichen. Seine Position bestimmt, ob du Anfang, Ende oder eine Stelle im Inneren suchst.'),paragraph("In `name` steht erst der Vorname, dann der Nachname. In `JJJJ-MM-TT` steht der Monat zwischen den Bindestrichen; `LIKE '%-03-%'` sucht März, `'%03%'` wäre zu ungenau."));
  if (tab==='combine') {
    card.append(sqlBlock("WHERE gender = 'male'"),sqlBlock("WHERE city = 'Berlin'"),sqlBlock("WHERE gender = 'male' AND city = 'Berlin'"),paragraph('Die erste Bedingung trifft alle männlichen Mitglieder, die zweite alle Berliner. Mit AND bleiben nur die Datensätze übrig, die beide Bedingungen erfüllen. Mit OR genügt mindestens eine Bedingung; auch beide dürfen erfüllt sein.'));
    card.append(exampleTable('AND und OR im Vergleich',['Mitglied','Ergebnis'],[['männlich/Berlin','AND und OR'],['männlich/Leipzig','nur OR'],['weiblich/Berlin','nur OR'],['weiblich/Leipzig','keines']]));
  }
  return card;
}
function bracketCard() {
  const card=explainCard('Klammern bei AND und OR');
  card.append(paragraph('Wenn AND und OR gemeinsam vorkommen, bindet AND stärker. Klammern machen deutlich, was zuerst zusammengehört: `(Vorname Lina OR Vorname Hailey) AND Wohnort Berlin`. Jede Teilbedingung muss vollständig sein.'),sqlBlock("SELECT *\nFROM users\nWHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %')\n  AND city = 'Berlin'"));
  return card;
}
function renderTaskTab(panel) {
  if (state.tab==='simple') panel.append(renderDescriptionTask(DESCRIPTION_TASK));
  if (state.tab==='fast') {
    const headings={13:'A · Einfache Bedingungen',15:'B · Vergleichen',17:'C · Muster suchen',19:'D · Bedingungen verknüpfen'};
    TAB_TASKS.fast.forEach((id)=>{ const task=TASK_BY_ID.get(id); if (headings[task.number]) panel.append(element('h3','',headings[task.number])); if (task.number===21) panel.append(bracketCard()); panel.append(renderTask(task)); renderTaskOutput(task); });
  } else {
    panel.append(explainContent(state.tab),paragraph('Die Ergebnisrelation zeigt die Daten dieser Abfrage; sie ändert users nicht.','sql9-quiet-note'));
    TAB_TASKS[state.tab].forEach((id)=>{ const task=TASK_BY_ID.get(id); panel.append(renderTask(task)); renderTaskOutput(task); });
  }
}

function introTable(rows,columns,caption,currentIndex=-1,leaving=false) {
  const wrap=element('div','sql9-intro-table');
  const scroll=element('div','table-scroll'); scroll.tabIndex=0; scroll.setAttribute('aria-label',caption);
  const table=element('table','data-table sql9-snippet-table'); table.append(element('caption','',caption));
  const head=document.createElement('thead'),hr=document.createElement('tr'); columns.forEach((column)=>{const th=element('th','',column);th.scope='col';hr.append(th);});head.append(hr);
  const body=document.createElement('tbody');
  rows.forEach((row,index)=>{const tr=document.createElement('tr');tr.dataset.rowId=row.id;if (index===currentIndex) tr.className=leaving?'is-leaving':'is-checking';columns.forEach((column)=>tr.append(element('td','',row[column])));body.append(tr);});
  table.append(head,body);scroll.append(table);wrap.append(scroll);return wrap;
}
function renderIntro(panel) {
  const card=element('section','task-card sql9-intro');
  const assignment=paragraph('**Klicke** dich durch die Animation. Beobachte, welche Datensätze in die Ergebnisrelation gelangen und welche ausgefiltert werden.');
  const heading=element('div','sql9-intro-heading'),progress=element('div','sql9-intro-progress');progress.setAttribute('aria-label','Ablauf der Erklärung');
  const phases=INTRO_PHASES.map((text)=>{const span=element('span','',text);progress.append(span);return span;});
  const stepper=element('div','intro-stepper'); stepper.setAttribute('role','group');stepper.setAttribute('aria-label','Animation durchklicken');
  const prev=element('button','secondary-button','Zurück');prev.type='button';prev.id='intro-prev';
  const count=element('span');count.id='intro-frame-count';count.setAttribute('aria-live','polite');
  const next=element('button','primary-button','Weiter');next.type='button';next.id='intro-next';stepper.append(prev,count,next);heading.append(progress,stepper);
  const workspace=element('div','sql9-intro-workspace'),visual=element('div','sql9-intro-visual'),resultCard=element('div','sql9-result-card');
  const explanation=element('p','intro-explanation');explanation.setAttribute('aria-live','polite');
  const statement=element('pre','given-sql sql9-intro-sql'),stage=element('div','sql9-intro-stage');
  const permanence=element('p','sql9-intro-hint','Ausgefilterte Datensätze fehlen nur im Abfrageergebnis. Die Tabelle users bleibt unverändert.');
  const result=element('div','sql9-result-body'),resultNote=element('p','sql9-result-note');
  visual.append(explanation,statement,stage,permanence); resultCard.append(element('h3','','Ergebnisrelation dieses Ausschnitts'),result,resultNote);
  workspace.append(visual,resultCard);const memo=element('div');card.append(assignment,heading,workspace,memo);panel.append(card);
  const update=(oldStep=null)=>{
    const step=state.introStep,phase=step===1?1:step===2?2:step<=9?3:4;
    phases.forEach((span,index)=>{span.className=index+1===phase?'is-active':index+1<phase?'is-complete':'';span.textContent=INTRO_PHASES[index];if(index+1===phase)span.setAttribute('aria-current','step');else span.removeAttribute('aria-current');});
    count.textContent=`Schritt ${step} von 12`;prev.disabled=step===1;next.textContent=step===12?'Erneut abspielen':'Weiter';
    explanation.textContent=step>=4&&step<=9?(introRows[step-4]?.city==='Berlin'?'Bedingung erfüllt: Dieser Datensatz bleibt in der gefilterten Ansicht.':'Bedingung nicht erfüllt: Dieser Datensatz wird aus der gefilterten Ansicht entfernt.'):INTRO_EXPLANATIONS[step-1];
    const code=element('code');[['select','SELECT username, city'],['from','FROM users'],['where',"WHERE city = 'Berlin'"]].forEach(([key,line])=>code.append(element('span',(step===2&&key==='from')||(step>=3&&step<=10&&key==='where')||(step===11&&key==='select')?'is-active-clause':'',line)));statement.replaceChildren(code);
    stage.replaceChildren();result.replaceChildren();permanence.hidden=step<4;
    const current=step>=4&&step<=9?step-4:-1;
    const processed=step>=10?6:Math.max(0,step-4);
    const visible=introRows.filter((row,index)=>index>=processed||row.city==='Berlin');
    const leaving=current>=0&&introRows[current]?.city!=='Berlin'&&oldStep===step-1;
    stage.append(introTable(visible,['id','username','city'],`Ausschnitt aus users (6 von ${memberCount} Mitgliedern)`,visible.findIndex((row)=>row.id===introRows[current]?.id),leaving));
    if (leaving && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const row=stage.querySelector('.is-leaving');
      row?.addEventListener('animationend',()=>{if(state.introStep===step)row.remove();},{once:true});
    } else if (leaving) stage.querySelector('.is-leaving')?.remove();
    if (step>=10) result.append(introTable(introRows.filter((row)=>row.city==='Berlin'),step>=11?['username','city']:['id','username','city'],step>=11?'Ergebnisrelation des Ausschnitts':'Gefilterter Zwischenstand des Ausschnitts'));
    else result.append(element('p','sql9-result-empty','–'));
    resultNote.textContent=step>=11?'SELECT username, city bestimmt die beiden Spalten der Ergebnisrelation.':step>=10?'Nach WHERE bleiben im Ausschnitt die beiden Berliner Datensätze übrig.':'';
    memo.replaceChildren();if(step===12){const box=element('section','short-summary sql9-intro-memo');box.append(element('h3','','Merke: Selektion'),paragraph('WHERE wählt die Zeilen aus, die eine Bedingung erfüllen. Diese Auswahl heißt Selektion. SELECT legt fest, welche Spalten ausgegeben werden. Die gespeicherte Tabelle bleibt bei dieser Abfrage unverändert.'));memo.append(box);}
  };
  prev.addEventListener('click',()=>{state.introStep=Math.max(1,state.introStep-1);save();update();updateTabMarks();});
  next.addEventListener('click',()=>{const old=state.introStep;state.introStep=old===12?1:old+1;save();update(old);updateTabMarks();});
  update();
}

function quizSelection(question) { return Array.isArray(state.quiz[question.id]) ? state.quiz[question.id] : []; }
function renderQuiz(panel) {
  const card=element('section','task-card sql-task');card.append(element('h3','','Abschlussquiz und Zusammenfassung'),paragraph('**Kreuze** bei jeder Frage alle richtigen Antworten an. Es können mehrere Antworten richtig sein.'));
  const form=element('form','final-quiz');form.id='final-quiz';form.noValidate=true;
  const feedback=element('p','feedback sql-quiz-feedback');feedback.setAttribute('aria-live','polite');
  const showFeedback=()=>{feedback.className=`feedback ${state.quizFeedback?.level||''} sql-quiz-feedback`;feedback.textContent=state.quizFeedback?.text||'';};
  FINAL_QUIZ.forEach((question,index)=>{
    const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.append(element('span','',String(index+1)),document.createTextNode(question.prompt));field.append(legend);
    const choices=element('div','choice-list');question.options.forEach(([id,text,,isSql])=>{
      const label=element('label','choice-option'),input=document.createElement('input');input.type='checkbox';input.name=`sql9-final-${question.id}`;input.value=id;input.checked=quizSelection(question).includes(id);
      input.addEventListener('change',()=>{const selected=quizSelection(question).filter((value)=>value!==id);state.quiz[question.id]=input.checked?[...selected,id]:selected;state.quizFeedback=null;save();showFeedback();});
      const content=element('span');content.append(isSql?element('code','quiz-sql',text):document.createTextNode(text));label.append(input,content);choices.append(label);
    });field.append(choices);form.append(field);
  });
  const actions=element('div','action-row'),submit=element('button','primary-button','Quiz prüfen');submit.type='submit';actions.append(submit);form.append(actions,feedback);
  const overviewSlot=element('div','sql9-overview-slot');const refresh=()=>{overviewSlot.replaceChildren();if(state.quizPassed)overviewSlot.append(renderOverview());};
  form.addEventListener('submit',(event)=>{event.preventDefault();checkQuiz();showFeedback();refresh();updateTabMarks();});
  window.addQuizQuestionChecks?.({questions:FINAL_QUIZ.map((question,index)=>({
    fieldset:form.querySelectorAll('fieldset')[index],solution:question.options.filter(([, ,right])=>right).map(([id])=>id),
    check:()=>{const selected=new Set(quizSelection(question)),correct=question.options.every(([id,,right])=>selected.has(id)===right),some=question.options.some(([id,,right])=>right&&selected.has(id));
      return {result:correct?'correct':some?'mixed':'wrong',text:correct?'Korrekt: Alle richtigen Aussagen dieser Frage sind markiert.':some?`Teilweise korrekt: Mindestens eine Markierung stimmt. ${question.hint}`:`Noch nicht korrekt: Prüfe die Aussagen noch einmal. ${question.hint}`};}
  })),buttonClass:'primary-button',rowClass:'action-row',levels:{high:'success',medium:'partial',low:'hint'},onAllCorrect:()=>form.requestSubmit()});
  card.append(form);panel.append(card,overviewSlot,renderSummary());appendSolutionDownloadFromTemplate(panel);showFeedback();refresh();
}
function checkQuiz() {
  const open=FINAL_QUIZ.map((question,index)=>quizSelection(question).length?null:index+1).filter(Boolean);
  if(open.length){state.quizFeedback={level:'hint',text:`Beantworte zuerst alle Fragen. Noch ohne Kreuz: Frage ${open.join(', ')}.`};save();return;}
  const amount=FINAL_QUIZ.filter((question)=>{const chosen=new Set(quizSelection(question));return question.options.every(([id,,right])=>chosen.has(id)===right);}).length;
  if(amount===5){state.quizPassed=true;state.quizFeedback={level:'success',text:'Korrekt: Alle fünf Fragen stimmen. Unten findest du jetzt die Übersicht über die Pflichtaufgaben mit Lösungen.'};}
  else if(amount)state.quizFeedback={level:'partial',text:`Teilweise korrekt: ${amount} von 5 Fragen stimmen. Prüfe die übrigen Fragen erneut.`};
  else state.quizFeedback={level:'hint',text:'Noch nicht korrekt: Prüfe die fünf Fragen mit den Hinweisen direkt darunter.'};
  save();
}
function renderOverview() {
  const overview=element('section','short-summary sql-quiz-overview');overview.setAttribute('aria-labelledby','sql9-overview-title');
  const title=element('h3','','Übersicht: alle Pflichtaufgaben mit Lösung');title.id='sql9-overview-title';overview.append(title);
  const describe=element('div');describe.append(element('h4','',DESCRIPTION_TASK.title),paragraph(DESCRIPTION_TASK.prompt),sqlBlock(DESCRIPTION_TASK.sql),element('p','',DESCRIPTION_TASK.model));overview.append(describe);
  const list=document.createElement('ol');TASKS.filter((task)=>task.number<=12).forEach((task)=>{const item=document.createElement('li');richText(item,task.prompt);item.append(sqlBlock(task.sql.replace(/ FROM /i,'\nFROM ').replace(/ WHERE /i,'\nWHERE ')));list.append(item);});overview.append(list);
  const fast=element('details');fast.append(element('summary','','Für die Schnellen – Lösungen'));const fastList=document.createElement('ol');fastList.start=13;TASKS.filter((task)=>task.number>12).forEach((task)=>{const item=document.createElement('li');richText(item,task.prompt);item.append(sqlBlock(task.sql.replace(/ FROM /i,'\nFROM ').replace(/ WHERE /i,'\nWHERE ')));fastList.append(item);});fast.append(fastList);overview.append(fast);
  const quiz=element('section');quiz.append(element('h4','','Abschlussquiz – Lösungen'));const questions=document.createElement('ol');FINAL_QUIZ.forEach((question)=>{const item=document.createElement('li');item.append(element('strong','',question.prompt));const answers=document.createElement('ul');question.options.filter(([, ,right])=>right).forEach(([,text,,isSql])=>{const li=document.createElement('li');li.append(isSql?element('code','quiz-sql',text):document.createTextNode(text));answers.append(li);});item.append(answers);questions.append(item);});quiz.append(questions);overview.append(quiz);return overview;
}
function renderSummary() {
  const summary=element('section','short-summary');summary.setAttribute('aria-labelledby','sql9-summary-title');const title=element('h3','','Merke: Filtern mit WHERE');title.id='sql9-summary-title';summary.append(title);
  const texts=[
    'FROM nennt die Tabelle. WHERE wählt Zeilen nach einer Bedingung aus; diese Auswahl heißt Selektion. SELECT bestimmt die Ausgabespalten. Die gespeicherte Tabelle bleibt unverändert.',
    "Text und Datum stehen in einfachen Anführungszeichen; Zahlen nicht. Größen in users sind Zentimeter, Datumswerte stehen als `'JJJJ-MM-TT'`.",
    '`LIKE` vergleicht mit einem Muster. `%` steht für beliebig viele Zeichen, auch für kein Zeichen: `B%` sucht einen Anfang, `%berg` eine Endung und `%berg%` eine Stelle im Inneren.',
    'AND verlangt beide Bedingungen. OR verlangt mindestens eine, auch beide sind möglich. Klammern steuern die Verbindung, wenn AND und OR gemeinsam vorkommen.',
    'Ein nicht eingetragener Wert ist NULL. Ein normaler Vergleich mit NULL erfüllt die WHERE-Bedingung nicht.'
  ];texts.forEach((text)=>summary.append(paragraph(text)));
  summary.append(sqlBlock('SELECT username, centimeters\nFROM users\nWHERE centimeters < 180\nORDER BY centimeters DESC\nLIMIT 5'),element('p','','Zuerst werden passende Zeilen ausgewählt, danach werden sie für die Ausgabe sortiert und begrenzt.'));return summary;
}
async function rerunSavedTasks() {for(const task of TASKS) if(state.feedback[task.id]) await runTask(task,{auto:true});}
async function init() {
  restore();render();
  document.getElementById('reset-module').addEventListener('click',()=>{if(window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')){tabRevision+=1;descriptionRequests.set(DESCRIPTION_TASK.id,(descriptionRequests.get(DESCRIPTION_TASK.id)||0)+1);try{localStorage.removeItem(STORAGE_KEY);}catch{}location.reload();}});
  window.addEventListener('beforeunload',()=>database?.close());const status=document.getElementById('data-status');
  try {
    database=new SqlWorker();await database.init();databaseReady=true;memberCount=database.csvRows.length;
    const expected=INTRO_EXPECTED.every(([id,username,city])=>database.csvRows.some((row)=>row.id===id&&row.username===username&&row.city===city));
    if(!expected){const berlin=database.csvRows.filter((row)=>row.city==='Berlin').slice(0,2);const others=database.csvRows.filter((row)=>row.city!=='Berlin').slice(0,4);if(berlin.length===2&&others.length===4)introRows=[...others,...berlin].map(({id,username,city})=>({id,username,city}));}
    if(state.tab==='intro')render();status.textContent='Die Tabelle users ist geladen. Du kannst SQL-Abfragen ausführen.';status.className='feedback success';status.setAttribute('aria-busy','false');
    document.querySelectorAll('.sql9-run').forEach((button)=>{button.disabled=false;});await rerunSavedTasks();
  } catch(error){status.textContent='Die Übungsdaten konnten nicht geladen werden. Bitte lade die Seite neu.';status.className='feedback error';status.setAttribute('aria-busy','false');console.error(error);}
}
document.addEventListener('DOMContentLoaded',init);
