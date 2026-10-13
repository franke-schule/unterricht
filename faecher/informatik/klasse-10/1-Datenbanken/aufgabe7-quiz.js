// Wiederholungs-Quiz zu Aufgabe 7: nicht verlinkte Seite, jede Aufgabe mit eigenem Prüfen-Button.
// Löschanleitung: aufgabe7-quiz-loeschen.txt.
import { validateSelectStatement, analyzeMultiTableSelect, compareRelations, normalizeRelation } from "./sql-lab-core.mjs?v=20260929b";
import { enableTokenDrag, wasDragged } from "../../../physik/klasse-11/1-Kreisbewegungen/components/token-drag.mjs";
import { evaluateSemanticAnswer } from "../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs?v=20261010-scaleway";
const STORAGE_KEY = "informatik10-datenbanken-aufgabe7-test-v1";
const SCRIPT_SERVER_URL = "https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/";
const DESCRIBE_MIN_LENGTH = 30;

const DESCRIBE_TASKS = [
  {
    "id": "kreuzprodukt",
    "number": 7,
    "title": "Foto und Person passend verbinden",
    "taskId": "inf10-a7-quiz-kreuzprodukt-beschreibung",
    "maxPoints": 3,
    "prompt": "In InstaHub wird jedes Foto zunächst mit jeder Person kombiniert. Beschreibe, warum dabei falsche Zuordnungen entstehen, welche Schlüssel zusammengehören und wie eine WHERE-Bedingung die falschen Kombinationen entfernt."
  },
  {
    "id": "and",
    "number": 8,
    "title": "Zwei Verbindungen gleichzeitig prüfen",
    "taskId": "inf10-a7-quiz-and-beschreibung",
    "maxPoints": 3,
    "prompt": "Bei Song, Song_in_Playlist und Playlist soll jede Ergebniszeile den passenden Song und die passende Playlist enthalten. Beschreibe, welche zwei Spaltenpaare verglichen werden müssen, wie die Bedingungen verknüpft werden und warum OR ungeeignet ist."
  }
];
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);
const CLOZE_TERMS = [
  {
    "key": "Kreuzprodukt",
    "reason": "Ein Kreuzprodukt kombiniert jede Zeile einer Tabelle mit jeder Zeile der anderen Tabellen."
  },
  {
    "key": "Primärschlüssel",
    "reason": "Ein Primärschlüssel kennzeichnet den Datensatz seiner Tabelle eindeutig."
  },
  {
    "key": "Fremdschlüssel",
    "reason": "Ein Fremdschlüssel verweist auf einen Datensatz einer anderen Tabelle."
  },
  {
    "key": "WHERE",
    "reason": "WHERE legt fest, welche kombinierten Zeilen erhalten bleiben."
  },
  {
    "key": "AND",
    "reason": "AND verlangt, dass beide Bedingungen gleichzeitig gelten."
  },
  {
    "key": "Verbund",
    "reason": "Der Verbund enthält die über passende Schlüssel verbundenen Datensätze."
  },
  {
    "key": "OR",
    "reason": "Bei OR genügt eine der Bedingungen; dann können unpassende Kombinationen erhalten bleiben."
  },
  {
    "key": "ORDER BY",
    "reason": "ORDER BY sortiert Ergebniszeilen und stellt keine Verbindung zwischen Tabellen her."
  }
];
const CLOZE_SOLUTION = [
  "Kreuzprodukt",
  "Primärschlüssel",
  "Fremdschlüssel",
  "WHERE",
  "AND",
  "Verbund"
];
// Die Kartenreihenfolge verrät nicht die Reihenfolge der Lücken.
CLOZE_TERMS.sort((left, right) => left.key.localeCompare(right.key, 'de'));
const CLOZE_PARTS = [
  "Ohne Verknüpfungsbedingung entsteht das ",
  ". Der ",
  " einer Tabelle wird mit dem passenden ",
  " der anderen Tabelle verglichen. Die Bedingung steht nach ",
  ". Mehrere gleichzeitig nötige Bedingungen verbindet ",
  ". Die passende Auswahl aus dem Kreuzprodukt heißt ",
  "."
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);
const SORT_ZONES = [{ id: 'passend', label: 'Passende Schlüsselverbindung' }, { id: 'unpassend', label: 'Keine passende Schlüsselverbindung' }];
const SORT_VALUES = [
  {
    "key": "song-match",
    "label": "Song.id und Song_in_Playlist.song_id vergleichen",
    "zone": "passend",
    "reason": "Beide Spalten bezeichnen denselben Song."
  },
  {
    "key": "playlist-match",
    "label": "Playlist.id und Song_in_Playlist.playlist_id vergleichen",
    "zone": "passend",
    "reason": "Beide Spalten bezeichnen dieselbe Playlist."
  },
  {
    "key": "photo-match",
    "label": "users.id und photos.user_id vergleichen",
    "zone": "passend",
    "reason": "Der Fremdschlüssel beim Foto verweist auf die ID seiner Person."
  },
  {
    "key": "photo-id",
    "label": "users.id und photos.id vergleichen",
    "zone": "unpassend",
    "reason": "Die Foto-ID kennzeichnet ein Foto, nicht die Person, die es hochgeladen hat."
  },
  {
    "key": "different-ids",
    "label": "Song.id und Playlist.id vergleichen",
    "zone": "unpassend",
    "reason": "Gleiche Zahlen in unterschiedlichen Primärschlüsseln begründen keine Zuordnung."
  },
  {
    "key": "titles",
    "label": "Song.titel und Playlist.titel vergleichen",
    "zone": "unpassend",
    "reason": "Ein Songtitel und ein Playlisttitel sind keine zusammengehörigen Schlüssel."
  }
];
const MC_QUESTIONS = [
  {
    "id": "q1",
    "text": "In InstaHub stehen 3 Personen und 5 Fotos. Was gilt ohne Verknüpfungsbedingung?",
    "why": "Ohne Bedingung entstehen 3 · 5 = 15 Kombinationen. Dabei kann ein Foto auch mit einer falschen Person kombiniert werden.",
    "options": [
      {
        "id": "count",
        "text": "Es entstehen 15 Kombinationen.",
        "correct": true
      },
      {
        "id": "wrong",
        "text": "Es können falsche Foto-Person-Zuordnungen entstehen.",
        "correct": true
      },
      {
        "id": "sum",
        "text": "Es entstehen 8 Kombinationen.",
        "reason": "Die Zeilenanzahlen werden multipliziert, nicht addiert."
      },
      {
        "id": "auto",
        "text": "SQL erkennt die richtige Zuordnung automatisch an den IDs.",
        "reason": "Ohne passende Verknüpfungsbedingung wird jede Kombination gebildet."
      }
    ]
  },
  {
    "id": "q2",
    "text": "Welche Aussagen zu einem Foto mit photos.id = 31 und photos.user_id = 7 stimmen?",
    "why": "31 identifiziert das Foto. Der Fremdschlüssel 7 verweist auf die Person mit users.id = 7.",
    "options": [
      {
        "id": "owner",
        "text": "Die zugehörige Person hat users.id = 7.",
        "correct": true
      },
      {
        "id": "photo",
        "text": "Die Zahl 31 identifiziert das Foto.",
        "correct": true
      },
      {
        "id": "wrong-owner",
        "text": "Die Person hat users.id = 31.",
        "reason": "Die Foto-ID sagt nichts über die ID der zugehörigen Person aus."
      },
      {
        "id": "equal",
        "text": "photos.id und photos.user_id müssen gleich sein.",
        "reason": "Foto und Person besitzen unabhängige IDs."
      }
    ]
  },
  {
    "id": "q3",
    "text": "Ein Foto soll zur richtigen Person gehören, und diese Person soll in Hamburg wohnen. Was gilt?",
    "why": "Die Schlüsselverbindung und die Einschränkung auf Hamburg müssen gleichzeitig gelten, also mit AND verknüpft werden.",
    "options": [
      {
        "id": "both",
        "text": "Die Schlüsselverbindung und die Stadtbedingung müssen beide gelten.",
        "correct": true
      },
      {
        "id": "and",
        "text": "AND verbindet die beiden Bedingungen passend.",
        "correct": true
      },
      {
        "id": "or",
        "text": "OR ist hier gleichwertig zu AND.",
        "reason": "Mit OR reicht entweder die richtige Verbindung oder Hamburg; dadurch können falsche Kombinationen bleiben."
      },
      {
        "id": "city",
        "text": "Die Stadtbedingung allein verbindet Fotos mit ihren Personen.",
        "reason": "Der Wohnort filtert Personen, ersetzt aber keine Verknüpfung über Schlüssel."
      }
    ]
  },
  {
    "id": "q4",
    "text": "Die Song-Verbindung stimmt bereits; die Playlist-Verbindung fehlt noch. Warum bleiben im Modul 8 Zeilen?",
    "why": "Jede der vier passenden Song-Zuordnungen wird noch mit beiden Playlists kombiniert: 4 · 2 = 8.",
    "options": [
      {
        "id": "both-playlists",
        "text": "Jede passende Song-Zuordnung wird noch mit beiden Playlists kombiniert.",
        "correct": true
      },
      {
        "id": "eight-songs",
        "text": "Es sind acht unterschiedliche Songs gespeichert.",
        "reason": "Im Modul gibt es vier Songs; die zusätzlichen Zeilen entstehen durch Kombinationen."
      },
      {
        "id": "double",
        "text": "SQL verdoppelt grundsätzlich jedes Verbundergebnis.",
        "reason": "Die Zeilenanzahl ergibt sich aus den noch erlaubten Kombinationen."
      }
    ]
  },
  {
    "id": "q5",
    "text": "Welche Aussagen zur fertigen Song-Playlist-Zuordnung aus dem Modul stimmen?",
    "why": "Zwei Schlüsselverbindungen müssen zugleich gelten. So bleiben genau die vier gespeicherten Zuordnungen erhalten.",
    "options": [
      {
        "id": "two",
        "text": "Es werden zwei passende Schlüsselverbindungen benötigt.",
        "correct": true
      },
      {
        "id": "four",
        "text": "Es bleiben vier passende Zuordnungen.",
        "correct": true
      },
      {
        "id": "one",
        "text": "Eine beliebige Gleichheit zwischen zwei IDs genügt.",
        "reason": "Jede Verbindung braucht einen Primärschlüssel und den auf ihn verweisenden Fremdschlüssel."
      },
      {
        "id": "titles",
        "text": "Gleiche Song- und Playlisttitel legen die Zuordnung fest.",
        "reason": "Die Zuordnung wird in Song_in_Playlist gespeichert, nicht durch gleiche Titel."
      }
    ]
  }
];
const SQL_TASKS = [
  {
    "id": "samina",
    "number": 4,
    "title": "Fotos einer Nutzerin",
    "prompt": "Formuliere eine SQL-Abfrage, die die Links (url) aller Fotos von samina369 ausgibt.",
    "referenceSql": "SELECT photos.url\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.username = 'samina369'",
    "columns": [
      "photos.url"
    ],
    "hint": "Prüfe, aus welcher Tabelle der Benutzername und aus welcher Tabelle der Fotolink kommen. Verbinde die passende Person mit ihren Fotos."
  },
  {
    "id": "hamburg",
    "number": 5,
    "title": "Fotos aus Hamburg",
    "prompt": "Formuliere eine SQL-Abfrage, die alle Fotodaten von Personen aus Hamburg ausgibt. Gib in dieser Reihenfolge id, user_id, description, url, created_at und updated_at aus.",
    "referenceSql": "SELECT photos.id, photos.user_id, photos.description, photos.url, photos.created_at, photos.updated_at\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.city = 'Hamburg'",
    "columns": [
      "photos.id",
      "photos.user_id",
      "photos.description",
      "photos.url",
      "photos.created_at",
      "photos.updated_at"
    ],
    "hint": "Prüfe getrennt die ausgegebenen Fotospalten, die Verbindung zur Person und deren Wohnort."
  },
  {
    "id": "teddy",
    "number": 6,
    "title": "Wer hat das Teddybären-Foto hochgeladen?",
    "prompt": "Formuliere eine SQL-Abfrage, die die Namen der Nutzerinnen ausgibt, deren Foto-Beschreibung „Teddybären“ enthält. Der Wert für weiblich in gender ist female.",
    "referenceSql": "SELECT users.name\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.gender = 'female'\n  AND photos.description LIKE '%Teddybären%'",
    "columns": [
      "users.name"
    ],
    "hint": "Prüfe die Verbindung zur Person und beide Einschränkungen. LIKE mit % sucht nach einem Wort innerhalb eines Textes."
  }
];
const SQL_SCHEMAS = [
  {
    "table": "users",
    "columns": [
      [
        "id",
        "int"
      ],
      [
        "name",
        "varchar(255)"
      ],
      [
        "username",
        "varchar(255)"
      ],
      [
        "gender",
        "varchar(255)"
      ],
      [
        "city",
        "varchar(255)"
      ]
    ]
  },
  {
    "table": "photos",
    "columns": [
      [
        "id",
        "int"
      ],
      [
        "user_id",
        "int"
      ],
      [
        "description",
        "varchar(255)"
      ],
      [
        "url",
        "varchar(255)"
      ],
      [
        "created_at",
        "date"
      ],
      [
        "updated_at",
        "date"
      ]
    ]
  }
];
const SQL_DATA = "CREATE TABLE users (id int PRIMARY KEY, name varchar(255), username varchar(255), gender varchar(255), city varchar(255));\nCREATE TABLE photos (id int PRIMARY KEY, user_id int, description varchar(255), url varchar(255), created_at date, updated_at date);\nINSERT INTO users VALUES (7, 'Samina Sommer', 'samina369', 'female', 'Hamburg'), (12, 'Aaron Adler', 'aaron12', 'male', 'Berlin'), (19, 'Mira Morgen', 'mira19', 'female', 'Leipzig'), (25, 'Ben Berg', 'ben25', 'male', 'Hamburg');\nINSERT INTO photos VALUES (31,7,'Teddybären im Schaufenster','storage/photos/31.webp','2026-10-01','2026-10-01'),(32,7,'Abend am Hafen','storage/photos/32.webp','2026-10-02','2026-10-02'),(7,12,'Teddybären im Park','storage/photos/7.webp','2026-10-03','2026-10-03'),(44,19,'Blick auf den Marktplatz','storage/photos/44.webp','2026-10-04','2026-10-04'),(45,25,'Brücke in Hamburg','storage/photos/45.webp','2026-10-05','2026-10-05'),(19,25,'Teddybären auf einer Bank','storage/photos/19.webp','2026-10-06','2026-10-06');";
const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length };
const LOCAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);
const TOTAL_POINTS = LOCAL_POINTS + DESCRIBE_MAX_POINTS + SQL_TASKS.length;
const TASK_COUNT = 3 + SQL_TASKS.length + DESCRIBE_TASKS.length;

const LOCAL_TASKS = [
  { id: "cloze", number: 1, title: "Vom Kreuzprodukt zum Verbund" },
  { id: "sort", number: 2, title: "Schlüsselverbindungen erkennen" },
  { id: "mc", number: 3, title: "Multiple Choice" },
];

const DEFAULT_STATE = {
  version: 2,
  cloze: {},
  sort: {},
  mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, []])),
  sql: Object.fromEntries(SQL_TASKS.map((task) => [task.id, ""])),
  sqlResults: {},
  texts: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ""])),
  // Letzte Bewertung durch den Skriptserver und der Text, auf den sie sich bezieht.
  ai: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  aiText: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ""])),
  // true, solange die Markierungen des letzten Prüfens zur aktuellen Eingabe passen.
  checked: { cloze: false, sort: false, mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, false])) },
  // Gewertet wird der erste Prüfversuch jeder Aufgabe; null = noch nicht geprüft.
  first: {
    sql: Object.fromEntries(SQL_TASKS.map((task) => [task.id, null])),
    cloze: null,
    sort: null,
    mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, null])),
    describe: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  },
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function clampPoints(value, max) { return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), max) : null; }

// Nur bekannte Einträge übernehmen, damit ein veralteter oder beschädigter Stand die Seite nicht stört.
function loadState() {
  const fresh = clone(DEFAULT_STATE);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!isPlainObject(saved)) return fresh;
    const clozeKeys = CLOZE_TERMS.map((term) => term.key);
    const sortZones = SORT_ZONES.map((zone) => zone.id);
    if (isPlainObject(saved.cloze)) Object.entries(saved.cloze).forEach(([key, slot]) => { if (clozeKeys.includes(key) && CLOZE_SLOTS.includes(slot)) if (!Object.values(fresh.cloze).includes(slot)) fresh.cloze[key] = slot; });
    if (isPlainObject(saved.sort)) Object.entries(saved.sort).forEach(([key, zone]) => { if (SORT_VALUES.some((value) => value.key === key) && sortZones.includes(zone)) fresh.sort[key] = zone; });
    MC_QUESTIONS.forEach((question) => {
      const chosen = saved.mc?.[question.id];
      if (Array.isArray(chosen)) fresh.mc[question.id] = [...new Set(chosen.filter((id) => question.options.some((option) => option.id === id)))];
    });
    DESCRIBE_TASKS.forEach((task) => {
      if (typeof saved.texts?.[task.id] === "string") fresh.texts[task.id] = saved.texts[task.id].slice(0, 3000);
    });
    SQL_TASKS.forEach((task) => {
      if (typeof saved.sql?.[task.id] === 'string') fresh.sql[task.id] = saved.sql[task.id].slice(0, 3000);
      if (saved.version === 2) {
        fresh.first.sql[task.id] = clampPoints(saved.first?.sql?.[task.id], 1);
        const result = saved.sqlResults?.[task.id];
        if (isPlainObject(result) && ['success', 'partial', 'error'].includes(result.status) && typeof result.text === 'string' && result.answer === fresh.sql[task.id]) fresh.sqlResults[task.id] = { status: result.status, text: result.text, answer: result.answer };
      }
    });
    // Stände aus der Zeit mit Abgabe-Button (ohne version) bringen nur ihre Eingaben mit.
    if (saved.version !== 2) return fresh;
    ["cloze", "sort"].forEach((key) => {
      fresh.checked[key] = saved.checked?.[key] === true;
      fresh.first[key] = clampPoints(saved.first?.[key], MAX_POINTS[key]);
    });
    MC_QUESTIONS.forEach((question) => {
      fresh.checked.mc[question.id] = saved.checked?.mc?.[question.id] === true;
      fresh.first.mc[question.id] = clampPoints(saved.first?.mc?.[question.id], 1);
    });
    DESCRIBE_TASKS.forEach((task) => {
      const ai = saved.ai?.[task.id];
      if (isPlainObject(ai) && Number.isInteger(ai.points) && ai.points >= 0 && ai.points <= task.maxPoints
          && ai.maxPoints === task.maxPoints && ['korrekt', 'teilweise korrekt', 'noch nicht korrekt'].includes(ai.status)
          && typeof ai.feedback === 'string' && Array.isArray(ai.strengths) && ai.strengths.every((text) => typeof text === 'string')
          && Array.isArray(ai.missing) && ai.missing.every((text) => typeof text === 'string')
          && saved.aiText?.[task.id] === fresh.texts[task.id]) {
        fresh.ai[task.id] = { points: ai.points, maxPoints: ai.maxPoints, status: ai.status, strengths: ai.strengths, missing: ai.missing, feedback: ai.feedback };
        fresh.aiText[task.id] = saved.aiText[task.id];
      }
      fresh.first.describe[task.id] = clampPoints(saved.first?.describe?.[task.id], task.maxPoints);
    });
    return fresh;
  } catch {
    return fresh;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Eingaben bleiben nur für diese Sitzung erhalten. */
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resultMark(ok) {
  const mark = element("span", "result-mark");
  const symbol = element("span", "", ok ? " ✓" : " ✗");
  symbol.setAttribute("aria-hidden", "true");
  mark.append(symbol, element("span", "visually-hidden", ok ? " richtig" : " falsch"));
  return mark;
}

/**
 * Rückmeldung unter einer Aufgabe (Klasse feedback aus den Modulen).
 * status: "success", "partial", "error" oder "" für einen neutralen Hinweis.
 * parts: Texte oder fertige Knoten, leere Einträge entfallen.
 */
function setFeedback(box, status, parts) {
  box.className = `feedback quiz-feedback${status ? ` ${status}` : ""}`;
  box.dataset.status = "";
  box.replaceChildren();
  parts.filter(Boolean).forEach((part) => box.append(typeof part === "string" ? element("p", "", part) : part));
  box.hidden = false;
}

function reasonList(entries) {
  const list = element("ul", "feedback-reasons");
  entries.forEach((entry) => list.append(element("li", "", entry)));
  return list;
}

// Verschwindet der Prüfen-Button, bleibt der Fokus auf der Rückmeldung statt im Nichts.
function focusFeedback(box) {
  box.tabIndex = -1;
  box.focus({ preventScroll: true });
}

/**
 * Gemeinsame Tafel für Lückentext und Zuordnung.
 * assignment: { Kartenschlüssel: Ablage-ID }, fehlender Eintrag = Wortspeicher.
 * Gezogen wird mit der vorhandenen Komponente token-drag.mjs; zusätzlich lässt
 * sich jede Karte antippen und danach die Lücke beziehungsweise Spalte antippen.
 * isLocked: Aufgabe vollständig richtig gelöst, Karten sind dann fest.
 * onChange: Eingabe geändert, alte Markierungen passen nicht mehr.
 */
function setupBoard({ root, rootSelector, items, assignment, capacity, layout, isLocked, onChange }) {
  let picked = null;

  function slotOf(key) { return assignment[key] || ""; }
  function labelOf(key) { return items.find((item) => item.key === key).label; }

  function move(key, slot) {
    const from = slotOf(key);
    if (slot && capacity(slot) === 1) {
      const occupant = Object.keys(assignment).find((other) => other !== key && assignment[other] === slot);
      if (occupant) {
        if (from) assignment[occupant] = from; // Tausch zwischen zwei Lücken
        else delete assignment[occupant];
      }
    }
    if (slot) assignment[key] = slot;
    else delete assignment[key];
    picked = null;
    onChange();
    saveState();
    render(key);
    updateProgress();
  }

  // Karte als Schaltfläche; nach vollständig richtiger Lösung nur noch als Text mit Markierung.
  function card(key, className, mark) {
    const markClass = mark ? ` is-${mark}` : "";
    if (isLocked()) {
      const node = element("span", `${className} is-locked${markClass}`, labelOf(key));
      if (mark) node.append(resultMark(mark === "correct"));
      return node;
    }
    const node = element("button", `${className}${markClass}`, labelOf(key));
    node.type = "button";
    node.dataset.key = key;
    if (mark) node.append(resultMark(mark === "correct"));
    const isPicked = picked === key;
    node.classList.toggle("is-picked", isPicked);
    node.setAttribute("aria-pressed", String(isPicked));
    enableTokenDrag(node, {
      getLabel: () => labelOf(key),
      dropSelector: `${rootSelector} [data-slot]`,
      bankSelector: `${rootSelector} .cloze-term-bank`,
      onDrop: (slot, onBank) => {
        if (slot) move(key, slot.dataset.slot);
        else if (onBank) move(key, "");
        else render();
      },
    });
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      if (wasDragged(node)) return;
      const slot = slotOf(key);
      if (picked && picked !== key && slot) { move(picked, slot); return; }
      if (isPicked) { if (slot) move(key, ""); else { picked = null; render(key); } return; }
      picked = key;
      render(key);
    });
    return node;
  }

  function target(node, slot) {
    node.dataset.slot = slot;
    // Belegte Lücken sind selbst Karten; deren Klick-Handler übernimmt das Ablegen.
    if (isLocked() || node.dataset.key) return node;
    node.addEventListener("click", () => {
      if (!picked) return;
      if (slot === "" && !slotOf(picked)) { picked = null; render(); return; }
      move(picked, slot);
    });
    return node;
  }

  function bank() {
    const node = element("div", "cloze-term-bank");
    node.setAttribute("role", "group");
    node.setAttribute("aria-label", "Wortspeicher");
    if (!isLocked()) {
      node.addEventListener("click", () => { if (picked && slotOf(picked)) move(picked, ""); });
    }
    const free = items.filter((item) => !slotOf(item.key));
    free.forEach((item) => node.append(card(item.key, "cloze-token")));
    if (!free.length) node.append(element("span", "bank-empty", isLocked() ? "Alle Karten wurden verwendet." : "Alle Karten sind verteilt. Hierher ziehen, um eine Karte zurückzulegen."));
    return node;
  }

  function render(focusKey) {
    root.replaceChildren(...layout({ bank, card, target, assignment, picked }));
    if (focusKey) root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  render();
  return { render };
}

function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ""; }

function scoreCloze() {
  return CLOZE_SLOTS.map((slot, index) => {
    const chosen = Object.keys(state.cloze).find((key) => state.cloze[key] === slot) || "";
    return { index, chosen, correct: chosen === CLOZE_SOLUTION[index] };
  });
}

function scoreSort() {
  return SORT_VALUES.map((value) => ({ value, chosen: state.sort[value.key] || "", correct: state.sort[value.key] === value.zone }));
}

function sameSet(a, b) { return a.length === b.length && b.every((value) => a.includes(value)); }
function correctIds(question) { return question.options.filter((option) => option.correct).map((option) => option.id); }

function mcResult(question) {
  const chosen = state.mc[question.id];
  const right = correctIds(question);
  return {
    exact: sameSet(chosen, right),
    hits: chosen.filter((id) => right.includes(id)).length,
    wrong: question.options.filter((option) => !option.correct && chosen.includes(option.id)),
    missing: right.some((id) => !chosen.includes(id)),
  };
}

function answerOf(task) { return state.texts[task.id].trim(); }

function clozeSolved() { return state.checked.cloze && scoreCloze().every((row) => row.correct); }
function sortSolved() { return state.checked.sort && scoreSort().every((row) => row.correct); }
function mcSolved(question) { return state.checked.mc[question.id] && mcResult(question).exact; }
function describeSolved(task) {
  const ai = state.ai[task.id];
  return Boolean(ai) && ai.points >= task.maxPoints && state.aiText[task.id] === state.texts[task.id];
}

function clozeLayout({ bank, card, target, assignment, picked }) {
  const sentence = element("p", "cloze-sentence");
  const byGap = Object.fromEntries(Object.entries(assignment).map(([key, slot]) => [slot, key]));
  CLOZE_PARTS.forEach((part, index) => {
    sentence.append(part);
    if (index >= CLOZE_SLOTS.length) return;
    const slot = CLOZE_SLOTS[index];
    const key = byGap[slot];
    const attached = /^\S/.test(CLOZE_PARTS[index + 1]);
    if (key) {
      const mark = state.checked.cloze ? (key === CLOZE_SOLUTION[index] ? "correct" : "wrong") : "";
      const gap = target(card(key, `cloze-gap is-filled${attached ? " is-attached" : ""}`, mark), slot);
      gap.setAttribute("aria-label", `Lücke ${index + 1}: ${key}${mark ? (mark === "correct" ? ", richtig" : ", falsch") : ""}`);
      sentence.append(gap);
      return;
    }
    // Leere Lücken gibt es nur vor dem Prüfen: Geprüft wird erst, wenn alle Lücken belegt sind.
    const gap = element("button", `cloze-gap${attached ? " is-attached" : ""}`, " ");
    gap.type = "button";
    gap.classList.toggle("is-awaiting", Boolean(picked));
    gap.setAttribute("aria-label", `Lücke ${index + 1}: leer`);
    sentence.append(target(gap, slot));
  });
  return [bank(), sentence];
}

function sortLayout({ bank, card, target, assignment, picked }) {
  const locked = sortSolved();
  const grid = element("div", "subset-zones");
  SORT_ZONES.forEach((zone) => {
    const box = target(element("div", `subset-zone is-${zone.id}`), zone.id);
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", zone.label);
    const label = element(locked ? "span" : "button", "subset-zone-label");
    label.append(element("strong", "", zone.label));
    if (!locked) {
      label.type = "button";
      label.append(element("small", "", picked ? "hier ablegen" : ""));
      label.setAttribute("aria-label", `${zone.label}${picked ? ": ausgewählte Karte hier ablegen" : ""}`);
    }
    box.append(label);
    const list = element("div", "subset-zone-items");
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.checked.sort ? (value.zone === zone.id ? "correct" : "wrong") : "";
      list.append(card(value.key, "cloze-token subset-card", mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

function zoneLabel(id) { return SORT_ZONES.find((zone) => zone.id === id)?.label || "nicht zugeordnet"; }

function showClozeFeedback() {
  const box = document.getElementById("term-cloze-feedback");
  const rows = scoreCloze();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, "success", ["Korrekt: Alle Lücken sind richtig ausgefüllt."]); return; }
  setFeedback(box, points ? "partial" : "error", [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Lücken ${points === 1 ? "stimmt" : "stimmen"}.` : "Noch nicht korrekt: Keine Lücke stimmt.",
    reasonList(wrong.map((row) => `„${row.chosen}“ passt nicht in Lücke ${row.index + 1}. ${termReason(row.chosen)}`)),
    "Verschiebe die mit ✗ markierten Karten und prüfe erneut.",
  ]);
}

function showSortFeedback() {
  const box = document.getElementById("subset-sort-feedback");
  const rows = scoreSort();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, "success", ["Korrekt: Alle Karten sind richtig zugeordnet."]); return; }
  setFeedback(box, points ? "partial" : "error", [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Karten ${points === 1 ? "ist" : "sind"} richtig zugeordnet.` : "Noch nicht korrekt: Keine Karte ist richtig zugeordnet.",
    reasonList(wrong.map((row) => `„${row.value.label}“ gehört nicht zu „${zoneLabel(row.chosen)}“. ${row.value.reason}`)),
    "Verschiebe die mit ✗ markierten Karten und prüfe erneut.",
  ]);
}

function checkCloze() {
  const box = document.getElementById("term-cloze-feedback");
  const open = CLOZE_SLOTS.filter((slot) => !Object.values(state.cloze).includes(slot)).length;
  if (open) { setFeedback(box, "", [`Fülle zuerst alle Lücken aus. ${open === 1 ? "Eine Lücke ist" : `${open} Lücken sind`} noch leer.`]); return; }
  if (state.first.cloze === null) state.first.cloze = scoreCloze().filter((row) => row.correct).length;
  state.checked.cloze = true;
  saveState();
  boards.cloze.render();
  showClozeFeedback();
  updateCheckButtons();
  if (clozeSolved()) focusFeedback(box);
  updateProgress();
}

function checkSort() {
  const box = document.getElementById("subset-sort-feedback");
  const open = SORT_VALUES.filter((value) => !state.sort[value.key]).length;
  if (open) { setFeedback(box, "", [`Ordne zuerst alle Karten zu. ${open === 1 ? "Eine Karte liegt" : `${open} Karten liegen`} noch im Wortspeicher.`]); return; }
  if (state.first.sort === null) state.first.sort = scoreSort().filter((row) => row.correct).length;
  state.checked.sort = true;
  saveState();
  boards.sort.render();
  showSortFeedback();
  updateCheckButtons();
  if (sortSolved()) focusFeedback(box);
  updateProgress();
}

function showMcFeedback(question, box) {
  const result = mcResult(question);
  if (result.exact) { setFeedback(box, "success", [`Korrekt. ${question.why}`]); return; }
  setFeedback(box, result.hits ? "partial" : "error", [
    result.hits ? "Teilweise korrekt." : "Noch nicht korrekt.",
    result.wrong.length ? reasonList(result.wrong.map((option) => `„${option.text}“ stimmt nicht. ${option.reason}`)) : "",
    result.missing ? "Es fehlt noch mindestens eine richtige Aussage." : "",
  ]);
}

// Multiple Choice mit Prüfen-Button je Frage.
function mcQuestion(question, index) {
  const solved = mcSolved(question);
  const fieldset = element("fieldset", "quiz-question");
  fieldset.id = `mc-${question.id}`;
  const legend = element("legend", "", `Frage ${index + 1} · ${question.text}`);
  const options = element("div", "quiz-options");
  question.options.forEach((option) => {
    const label = element("label", "quiz-option");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = question.id;
    input.value = option.id;
    input.checked = state.mc[question.id].includes(option.id);
    input.disabled = solved;
    input.addEventListener("change", () => {
      state.mc[question.id] = [...fieldset.querySelectorAll("input:checked")].map((checked) => checked.value);
      state.checked.mc[question.id] = false;
      fieldset.querySelector(".quiz-feedback").hidden = true;
      saveState();
      updateProgress();
    });
    label.append(input, element("span", "quiz-option-text", option.text));
    options.append(label);
  });
  const button = element("button", "primary-button quiz-check-button", "Antwort prüfen");
  button.type = "button";
  button.hidden = solved;
  const feedback = element("div", "feedback quiz-feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  feedback.hidden = true;
  button.addEventListener("click", () => checkMc(question, index, feedback));
  fieldset.append(legend, options, button, feedback);
  if (state.checked.mc[question.id]) showMcFeedback(question, feedback);
  return fieldset;
}

function checkMc(question, index, box) {
  if (!state.mc[question.id].length) { setFeedback(box, "", ["Wähle zuerst mindestens eine Aussage aus."]); return; }
  if (state.first.mc[question.id] === null) state.first.mc[question.id] = mcResult(question).exact ? 1 : 0;
  state.checked.mc[question.id] = true;
  saveState();
  if (mcSolved(question)) {
    const fieldset = mcQuestion(question, index);
    document.getElementById(`mc-${question.id}`).replaceWith(fieldset);
    focusFeedback(fieldset.querySelector(".quiz-feedback"));
  } else {
    showMcFeedback(question, box);
  }
  updateProgress();
}

function renderMcQuestions() {
  document.getElementById("mc-questions").replaceChildren(...MC_QUESTIONS.map(mcQuestion));
}

// Beschreibe-Aufgaben: Prüfen über die POST-/JSON-Anbindung an den Skriptserver.
const describePending = {};
const describeErrors = {};
// Anfragen laufen nacheinander, auch wenn mehrere Prüfen-Buttons kurz hintereinander
// gedrückt werden, damit eine ganze Klasse den Server nicht mit gebündelten Anfragen belastet.
let describeQueue = Promise.resolve();

function renderDescribe(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const button = document.getElementById(`check-${task.id}`);
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const solved = describeSolved(task);
  const pending = Boolean(describePending[task.id]);
  textarea.readOnly = solved || pending;
  button.hidden = solved;
  button.disabled = pending;
  button.textContent = pending ? "Antwort wird geprüft …" : "Antwort prüfen";
  const ai = state.ai[task.id];
  box.className = "feedback quiz-feedback";
  box.dataset.status = "";
  if (pending) {
    box.replaceChildren(element("p", "", "Deine Antwort wird mit dem Erwartungshorizont verglichen …"));
  } else if (describeErrors[task.id]) {
    box.classList.add("error");
    box.replaceChildren(element("p", "", `Die Antwort konnte gerade nicht automatisch bewertet werden (${describeErrors[task.id]}). Versuche es in einem Moment noch einmal.`));
  } else if (ai) {
    box.dataset.status = ai.status || "";
    box.replaceChildren(element("h4", "", `${ai.status}: ${ai.points} von ${ai.maxPoints} Aspekten erkannt.`));
    [["Das ist dir gelungen:", ai.strengths, "Noch kein Aspekt wurde eindeutig erkannt."], ["Das fehlt noch:", ai.missing, "Es fehlen keine wesentlichen Aspekte."]].forEach(([title, entries, fallback]) => {
      box.append(element("h4", "", title));
      const list = document.createElement("ul");
      (entries?.length ? entries : [fallback]).forEach((entry) => list.append(element("li", "", entry)));
      box.append(list);
    });
    if (ai.feedback) box.append(element("p", "", ai.feedback));
    if (!solved) box.append(element("p", "", "Ergänze deine Antwort und prüfe sie erneut."));
  } else {
    box.hidden = true;
    return;
  }
  box.hidden = false;
}

function checkDescription(task) {
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const answer = answerOf(task);
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    setFeedback(box, "", [`Deine Antwort ist noch zu kurz. Schreibe mindestens ${DESCRIBE_MIN_LENGTH} Zeichen und gehe auf alle ${task.maxPoints} Aspekte ein.`]);
    return;
  }
  if (state.ai[task.id] && state.aiText[task.id] === state.texts[task.id]) {
    renderDescribe(task);
    box.append(element("p", "", "Diese Antwort wurde schon geprüft. Ändere oder ergänze sie, bevor du sie erneut prüfen lässt."));
    return;
  }
  const text = state.texts[task.id];
  describePending[task.id] = true;
  delete describeErrors[task.id];
  renderDescribe(task);
  describeQueue = describeQueue.then(() => evaluateDescription(task, text));
}

async function evaluateDescription(task, text) {
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.taskId, answer: text.trim(), expectedMaxPoints: task.maxPoints });
    const points = clampPoints(Number(result.points) || 0, task.maxPoints);
    state.ai[task.id] = {
      status: result.status || "noch nicht korrekt",
      points,
      maxPoints: Number(result.maxPoints) || task.maxPoints,
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
      missing: Array.isArray(result.missing) ? result.missing.map(String) : [],
      feedback: result.feedback || "",
    };
    state.aiText[task.id] = text;
    if (state.first.describe[task.id] === null) state.first.describe[task.id] = points;
    saveState();
  } catch (error) {
    describeErrors[task.id] = error.message || "Der Auswertungsserver war nicht erreichbar";
  }
  describePending[task.id] = false;
  renderDescribe(task);
  if (describeSolved(task)) focusFeedback(document.getElementById(`describe-${task.id}-feedback`));
  updateProgress();
}

function setupDescribeTask(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const counter = document.getElementById(`describe-${task.id}-count`);
  const updateCounter = () => { counter.textContent = `${textarea.value.length} von 3000 Zeichen`; };
  textarea.addEventListener("input", () => { state.texts[task.id] = textarea.value; state.ai[task.id] = null; delete describeErrors[task.id]; renderDescribe(task); updateCounter(); saveState(); updateProgress(); });
  document.getElementById(`check-${task.id}`).addEventListener("click", () => checkDescription(task));
  textarea.value = state.texts[task.id];
  updateCounter();
  renderDescribe(task);
}

// Punkte des ersten Prüfversuchs je Aufgabe; points = null, solange nichts geprüft ist.
function taskScores() {
  const mcChecked = MC_QUESTIONS.filter((question) => state.first.mc[question.id] !== null);
  return [
    { ...LOCAL_TASKS[0], max: MAX_POINTS.cloze, unit: "Punkten", points: state.first.cloze, done: state.first.cloze !== null },
    { ...LOCAL_TASKS[1], max: MAX_POINTS.sort, unit: "Punkten", points: state.first.sort, done: state.first.sort !== null },
    {
      ...LOCAL_TASKS[2],
      max: MAX_POINTS.mc,
      unit: "Punkten",
      points: mcChecked.length ? mcChecked.reduce((sum, question) => sum + state.first.mc[question.id], 0) : null,
      done: mcChecked.length === MC_QUESTIONS.length,
      note: mcChecked.length && mcChecked.length < MC_QUESTIONS.length ? `${mcChecked.length} von ${MC_QUESTIONS.length} Fragen geprüft` : "",
    },
    ...SQL_TASKS.map((task) => ({ ...task, max: 1, unit: "Punkten", points: state.first.sql[task.id], done: state.first.sql[task.id] !== null })),
    ...DESCRIBE_TASKS.map((task) => ({ id: task.id, number: task.number, title: task.title, max: task.maxPoints, unit: "Aspekten", points: state.first.describe[task.id], done: state.first.describe[task.id] !== null })),
  ];
}

function scoreText(task) {
  if (task.points === null) return "noch nicht geprüft";
  return `${task.points} von ${task.max} ${task.max === 1 ? 'Punkt' : task.unit}${task.note ? ` (${task.note})` : ""}`;
}

function updateProgress() {
  const tasks = taskScores();
  const points = tasks.reduce((sum, task) => sum + (task.points ?? 0), 0);
  document.getElementById("progress-label").textContent = `${tasks.filter((task) => task.done).length} von ${TASK_COUNT} Aufgaben geprüft`;
  document.getElementById("progress-points").textContent = `Wertung: ${points} von ${TOTAL_POINTS} Punkten`;
  tasks.forEach((task) => {
    document.getElementById(`task${task.number}-points`).textContent = task.points === null ? `${task.max} ${task.unit === "Aspekten" ? "Aspekte" : task.max === 1 ? "Punkt" : "Punkte"}` : `Wertung: ${scoreText(task)}`;
  });
  const list = element("ul", "evaluation-list");
  tasks.forEach((task) => {
    const item = element("li", task.points === null ? "" : task.points === task.max ? "is-correct" : "is-open");
    item.append(element("strong", "", `Aufgabe ${task.number} · ${task.title}: `), scoreText(task));
    list.append(item);
  });
  document.getElementById("evaluation-details").replaceChildren(list);
  const total = document.getElementById("evaluation-total");
  const totalText = `Wertung: ${points} von ${TOTAL_POINTS} Punkten`;
  if (total.textContent !== totalText) total.textContent = totalText; // Live-Region nur bei echter Änderung
}

let boards = {};

// Prüfen-Buttons verschwinden, sobald eine Aufgabe vollständig richtig gelöst ist.
function updateCheckButtons() {
  [["check-term-cloze", "term-cloze", clozeSolved()], ["check-subset-sort", "subset-sort", sortSolved()]].forEach(([buttonId, help, solved]) => {
    document.getElementById(buttonId).parentElement.hidden = solved;
    document.querySelector(`[data-help='${help}']`).hidden = solved;
  });
}

function init() {
  boards = {
    cloze: setupBoard({
      root: document.getElementById("term-cloze"),
      rootSelector: "#term-cloze",
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.key })),
      assignment: state.cloze,
      capacity: () => 1,
      layout: clozeLayout,
      isLocked: clozeSolved,
      onChange: () => { state.checked.cloze = false; document.getElementById("term-cloze-feedback").hidden = true; },
    }),
    sort: setupBoard({
      root: document.getElementById("subset-sort"),
      rootSelector: "#subset-sort",
      items: SORT_VALUES.map((value) => ({ key: value.key, label: value.label })),
      assignment: state.sort,
      capacity: () => Infinity,
      layout: sortLayout,
      isLocked: sortSolved,
      onChange: () => { state.checked.sort = false; document.getElementById("subset-sort-feedback").hidden = true; },
    }),
  };
  document.getElementById("check-term-cloze").addEventListener("click", checkCloze);
  document.getElementById("check-subset-sort").addEventListener("click", checkSort);
  if (state.checked.cloze) showClozeFeedback();
  if (state.checked.sort) showSortFeedback();
  updateCheckButtons();
  renderMcQuestions();
  DESCRIBE_TASKS.forEach(setupDescribeTask);
  setupSqlTasks();
  document.getElementById("print-evaluation").addEventListener("click", () => window.print());
  document.getElementById("reset-test").addEventListener("click", () => {
    if (!window.confirm("Möchtest du das Quiz wirklich neu starten? Alle Eingaben und die Wertung werden gelöscht.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nichts gespeichert */ }
    window.location.reload();
  });
  updateProgress();
}

// Gleiche lokale SQL-Engine und Prüfbausteine wie im SQL-Labor; eigene Übungsdaten.
let quizDatabase;
let sqlReady = false;
function sqlSolved(task) { return state.sqlResults[task.id]?.status === 'success'; }

function renderSqlFeedback(task) {
  const result = state.sqlResults[task.id];
  const box = document.getElementById(`sql-${task.id}-feedback`);
  const input = document.getElementById(`sql-${task.id}`);
  input.readOnly = sqlSolved(task);
  const button = document.getElementById(`check-sql-${task.id}`);
  button.hidden = sqlSolved(task);
  button.disabled = !sqlReady;
  if (result) setFeedback(box, result.status, [result.text]);
  else box.hidden = true;
}

function renderSqlRelation(task, relation) {
  // Semantische Tabelle und begrenztes Ergebnisfenster wie renderRelation im SQL-Labor.
  const root = document.getElementById(`sql-${task.id}-result`);
  const shell = element('section', 'table-shell result-relation');
  const scroll = element('div', 'table-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('aria-label', 'Ergebnisrelation horizontal und vertikal scrollen');
  const table = element('table', 'data-table compact');
  table.append(element('caption', '', `Ergebnis deiner SQL-Abfrage: ${relation.values.length} Zeile(n)`));
  const head = document.createElement('thead');
  const headings = document.createElement('tr');
  relation.columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headings.append(th); });
  head.append(headings);
  const body = document.createElement('tbody');
  relation.values.slice(0, 100).forEach((values) => { const row = document.createElement('tr'); values.forEach((value) => row.append(element('td', '', value === null ? 'NULL' : String(value)))); body.append(row); });
  table.append(head, body); scroll.append(table); shell.append(scroll); root.replaceChildren(shell);
}

export function assessQuizSql(answer, task, execute) {
  const valid = validateSelectStatement(answer);
  if (!valid.ok) return { valid: false, status: '', text: valid.message };
  let actual;
  try { actual = normalizeRelation(execute(valid.sql)); }
  catch (error) {
    const message = String(error.message);
    const text = /ambiguous column/i.test(message) ? 'Noch nicht korrekt: Ein Spaltenname kommt in beiden Tabellen vor. Stelle den Tabellennamen voran, zum Beispiel users.id.'
      : /no such table/i.test(message) ? 'Noch nicht korrekt: Prüfe die Tabellennamen im Schema: users und photos.'
      : /no such column/i.test(message) ? 'Noch nicht korrekt: Prüfe die Spaltennamen im Schema und setze Textwerte in Anführungszeichen.'
      : 'Noch nicht korrekt: Prüfe die SQL-Schreibweise und die Reihenfolge SELECT, FROM, WHERE.';
    return { valid: false, status: 'error', text };
  }
  const expected = normalizeRelation(execute(task.referenceSql));
  // Erlaubt auch photos.* und gleichwertige Tabellen-/Spaltenaliasse.
  const projectionSql = valid.sql.replace(/\bphotos\s*\.\s*\*/gi, SQL_SCHEMAS[1].columns.map(([name]) => `photos.${name}`).join(', ')).replace(/^SELECT\s+DISTINCT\s+/i, 'SELECT ');
  const analysis = analyzeMultiTableSelect(projectionSql, SQL_SCHEMAS);
  const sourceOk = analysis?.tables.length === 2 && ['users', 'photos'].every((name) => analysis.tables.includes(name));
  const columns = analysis?.projection?.map(({ table, name }) => `${table}.${name}`);
  const columnsOk = columns && sameSet(columns, task.columns) && columns.every((name, index) => name === task.columns[index]);
  const comparison = compareRelations(actual, expected);
  const correct = sourceOk && columnsOk && comparison.correct;
  const text = correct ? 'Korrekt: Deine SQL-Abfrage liefert genau die geforderten Daten.'
    : !sourceOk ? 'Noch nicht korrekt: Verwende für den Verbund sowohl users als auch photos.'
    : !columnsOk ? 'Teilweise korrekt: Prüfe, welche Spalten in welcher Reihenfolge ausgegeben werden sollen.'
    : `Teilweise korrekt: Die Ausgabespalten stimmen; die ausgewählten Datensätze passen noch nicht. ${task.hint}`;
  return { valid: true, status: correct ? 'success' : sourceOk ? 'partial' : 'error', text, actual: correct ? actual : null };
}

function checkSql(task) {
  if (!sqlReady || sqlSolved(task)) return;
  const answer = state.sql[task.id];
  const result = assessQuizSql(answer, task, (sql) => quizDatabase.exec(sql));
  if (result.valid) {
    if (state.first.sql[task.id] === null) state.first.sql[task.id] = result.status === 'success' ? 1 : 0;
    state.sqlResults[task.id] = { status: result.status, text: result.text, answer };
    saveState();
    renderSqlFeedback(task);
  } else setFeedback(document.getElementById(`sql-${task.id}-feedback`), result.status, [result.text]);
  if (result.actual) renderSqlRelation(task, result.actual);
  if (sqlSolved(task)) focusFeedback(document.getElementById(`sql-${task.id}-feedback`));
  updateProgress();
}

async function loadSqlDatabase() {
  const status = document.getElementById('sql-status');
  const retry = document.getElementById('retry-sql');
  retry.hidden = true;
  status.textContent = 'Die Übungsdaten werden geladen …';
  try {
    const SQL = await window.initSqlJs({ locateFile: (file) => `../../../../include/lib/sql.js/${file}` });
    quizDatabase = new SQL.Database();
    quizDatabase.run(SQL_DATA);
    sqlReady = true;
    status.textContent = 'Die fiktiven InstaHub-Übungsdaten sind bereit. Du kannst deine SQL-Abfragen prüfen.';
    SQL_TASKS.forEach((task) => {
      renderSqlFeedback(task);
      if (sqlSolved(task)) {
        const result = assessQuizSql(state.sql[task.id], task, (sql) => quizDatabase.exec(sql));
        if (result.actual) renderSqlRelation(task, result.actual);
      }
    });
  } catch {
    status.textContent = 'Die Übungsdaten konnten nicht geladen werden. Lade sie erneut oder lade die Seite neu; deine bisherigen Eingaben bleiben erhalten.';
    retry.hidden = false;
  }
}

function setupSqlTasks() {
  SQL_TASKS.forEach((task) => {
    const input = document.getElementById(`sql-${task.id}`);
    input.value = state.sql[task.id];
    input.addEventListener('input', () => {
      state.sql[task.id] = input.value;
      delete state.sqlResults[task.id];
      document.getElementById(`sql-${task.id}-result`).replaceChildren();
      renderSqlFeedback(task); saveState();
    });
    input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); checkSql(task); } });
    document.getElementById(`check-sql-${task.id}`).addEventListener('click', () => checkSql(task));
    renderSqlFeedback(task);
  });
  document.getElementById('retry-sql').addEventListener('click', loadSqlDatabase);
  loadSqlDatabase();
  window.addEventListener('pagehide', (event) => { if (!event.persisted) quizDatabase?.close(); });
}

export { SQL_TASKS, SQL_SCHEMAS, SQL_DATA, MC_QUESTIONS, TOTAL_POINTS };
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
