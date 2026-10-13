import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20261001a';
import { normalizeCardinality, evaluateCardinalityPair, evaluateQuizQuestion,
  SCHUELER, AG, TEILNAHME, SCHUELER_VERSUCH, INSTAHUB_USERS, INSTAHUB_PHOTOS,
  INSTAHUB_LIKES, INSTAHUB_FOLLOWS, R4_CLOZES, r4ClozeGapIds, evaluateCloze, normalizeClozeAnswer,
  KLASSE, KLASSENLEITER, KLASSE_LEITER_LOESUNG, KLASSE_LEITER_ID_VERWECHSLUNG,
  evaluateSchluesselSchlossAnswer, BEZIEHUNGSARTEN_QUIZ_8, BEZIEHUNGSARTEN_QUIZ_10
} from './beziehungsarten-daten.mjs?v=20261013';
import { SONG_VERBUND_TABLES } from './song-verbund-daten.mjs?v=20261013';
const SONG_ROWS={...SONG_VERBUND_TABLES,Song_in_Playlist:[...SONG_VERBUND_TABLES.Song_in_Playlist,{song_id:1,playlist_id:2}]};
function renderSongTables(){
 document.getElementById("song-tables").innerHTML=
 miniTableCard("Song",["id","titel"],SONG_ROWS.Song.map(s=>[s.id,s.titel]))+
 miniTableCard("Song_in_Playlist",["song_id","playlist_id"],SONG_ROWS.Song_in_Playlist.map(r=>[r.song_id,r.playlist_id]))+
 miniTableCard("Playlist",["id","titel"],SONG_ROWS.Playlist.map(p=>[p.id,p.titel]));
}
const compact=s=>String(s).toLocaleLowerCase("de").replace(/[’‘']/g,"").replace(/[^a-z0-9äöüß]+/g," ").trim();
function exactNames(text,words){
  let remaining=` ${compact(text)} `;
  for(const word of [...words].sort((a,b)=>b.length-a.length)){
    const normalized=` ${compact(word)} `;
    if(!remaining.includes(normalized))return false;
    remaining=remaining.replace(normalized," ");
  }
  return remaining.replace(/\bund\b/g,"").trim()==="";
}
function syncSongReveal(){
 document.getElementById("song-reveal").hidden=!(isSolved("song-observation")&&isSolved("song-cardinality"));
}
function checkSongObservation(){
 const a=state.song.playlists,b=state.song.songs;
  const aok=exactNames(a,["Good Oldies","Fussballhits"]);
  const bok=exactNames(b,["Gaslighter","Wavin Flag","54 74 90 2006"]);
 const kind=aok&&bok?"success":aok||bok?"partial":"hint";
 const msg=kind==="success"?"Richtig: Gaslighter steht in Good Oldies und Fussballhits. Fussballhits enthält Gaslighter, Wavin‘ Flag und ’54, ’74, ’90, 2006.":kind==="partial"?"Teilweise korrekt: Eine Richtung stimmt. Prüfe für die andere Richtung alle Zeilen mit derselben song_id beziehungsweise playlist_id.":"Noch nicht korrekt: Vergleiche erst die ids in Song und Playlist mit den beiden Fremdschlüsseln in Song_in_Playlist.";
 setFeedback("song-observation",kind,msg);if(aok&&bok){markSolved("song-observation");syncSongReveal();}
}
function checkSongCardinality(){
 const a=normalizeCardinality(state.song.cardA),b=normalizeCardinality(state.song.cardB);
 const count=[a,b].filter(v=>["n","m"].includes(v)).length;
 const ok=count===2&&a!==b;
 const kind=ok?"success":count?"partial":"hint";
 setFeedback("song-cardinality",kind,ok?"Richtig: Song und Playlist sind auf beiden Seiten mit vielen Datensätzen verbunden.":count?"Teilweise korrekt: Eine Seite ist richtig. Prüfe die andere Richtung an Gaslighter oder Fussballhits.":"Noch nicht korrekt: In beiden Richtungen gibt es mehr als einen passenden Datensatz.");
 if(ok){markSolved("song-cardinality");syncSongReveal();}
}
function checkSongFk(){
 const a=state.song.songFk==="Song.id",b=state.song.playlistFk==="Playlist.id";
 setFeedback("song-fk",a&&b?"success":a||b?"partial":"hint",a&&b?"Richtig: song_id verweist auf Song.id, playlist_id auf Playlist.id.":a||b?"Teilweise korrekt: Ein Verweis stimmt. Prüfe den zweiten Fremdschlüssel.":"Noch nicht korrekt: Vergleiche die Spaltennamen mit den Primärschlüsseln der beiden Tabellen.");
 if(a&&b)markSolved("song-fk");
}
function checkSongRow(){
 const a=state.song.newSong.trim()==="1",b=state.song.newPlaylist.trim()==="2";
 setFeedback("song-row",a&&b?"success":a||b?"partial":"hint",a&&b?"Richtig: Die neue Zeile lautet song_id 1, playlist_id 2.":a||b?"Teilweise korrekt: Eine id stimmt. Lies die andere in Song oder Playlist ab.":"Noch nicht korrekt: Trage zwei einzelne ids in eine neue Zeile ein; schreibe keine Liste in eine Zelle.");
 if(a&&b)markSolved("song-row");
}
function checkSongChain(){
 const v=["chainSong","chainLeft","chainRight","chainPlaylist"].map(k=>normalizeCardinality(state.song[k]));
 const left=v[0]==="1"&&v[1]==="n",right=v[2]==="n"&&v[3]==="1";
 setFeedback("song-chain",left&&right?"success":left||right?"partial":"hint",left&&right?"Richtig: Song 1 — n Song_in_Playlist n — 1 Playlist. So werden aus der n:m-Beziehung zwei 1:n-Beziehungen.":left||right?"Teilweise korrekt: Eine Verbindung stimmt. Prüfe auf der anderen Seite, wie viele Zuordnungszeilen zu einem Song oder einer Playlist gehören können.":"Noch nicht korrekt: Jede Zeile der Beziehungstabelle verweist auf genau einen Song und genau eine Playlist.");
 if(left&&right){markSolved("song-chain");document.getElementById("song-merken").hidden=false;}
}
const R3_F3A_OPTIONS = [
  { id: "multi", label: "1, 2" },
  { id: "twoRows", label: "Lina bekommt zwei Zeilen: eine mit ag_id 1 und eine mit ag_id 2." },
  { id: "onlyOne", label: "Nur 1 – für die zweite AG ist kein Platz." },
  { id: "none", label: "Keine dieser Möglichkeiten ist sauber: Mit einem einzigen Fremdschlüssel in schueler lässt sich das nicht speichern.", correct: true },
];
const R3_F3B_OPTIONS = [
  { id: "yes", label: "Ja, dann steht bei jeder AG die id eines Schülers, und alles passt." },
  { id: "no", label: "Nein, denn auch eine AG hat mehrere Schüler. Das Problem taucht nur auf der anderen Seite auf.", correct: true },
];
const R6_F6A_OPTIONS = [
  { id: "photo12", label: "Foto 12", correct: true },
  { id: "photo14", label: "Foto 14", correct: true },
  { id: "none", label: "Keines, weil in photos.user_id nirgends 15 steht" },
];
const R6_F6B_OPTIONS = [
  { id: "emil", label: "reisewut_emil", correct: true },
  { id: "jonas", label: "gamewut_jonas", correct: true },
  { id: "koch", label: "koch_kicker" },
  { id: "berg", label: "bergcoder" },
];
const R7_F7A_OPTIONS = [
  { id: "taroFollowsOeko", label: "wanderriese_taro folgt oekosmasher.", correct: true },
  { id: "oekoFollowsTaro", label: "oekosmasher folgt wanderriese_taro." },
  { id: "mutual", label: "oekosmasher und wanderriese_taro folgen sich gegenseitig." },
];
const R7_F7B_OPTIONS = [
  { id: "twoRows", label: "Dafür braucht follows zwei Zeilen.", correct: true },
  { id: "swapped", label: "In den beiden Zeilen sind following_id und follower_id vertauscht.", correct: true },
  { id: "oneRowEnough", label: "Eine Zeile reicht, weil Folgen immer in beide Richtungen gilt." },
  { id: "bothRefUsers", label: "Beide Fremdschlüssel verweisen auf die Tabelle users.", correct: true },
];

const STORAGE_KEY="informatik10-datenbanken-aufgabe8-nm-v1";
const STEP_TITLES=["Songs und Playlists","Beziehungstabelle","Lina besucht zwei AGs","Anmeldungen","InstaHub","likes","follows","Übersicht","Abschlussquiz"];
const SUMMARY_STEP=8,QUIZ_STEP=9,QUIZ=BEZIEHUNGSARTEN_QUIZ_8,QUIZ_SOLVED="r9-quiz";
const QUIZ_SUCCESS="Richtig: Alle sechs Fragen stimmen. Die Übersicht ist jetzt verfügbar.";
const STEP_SUBTASKS={1:["song-observation","song-cardinality"],2:["song-fk","song-row","song-chain"],
  3:["r3-f3a","r3-f3b","r3-cardinality"],4:["r4-f4a","r4-f4b","r4-f4c"],
  5:["r5-cardinality"],6:["r6-f6a","r6-f6b","r6-cardinality"],7:["r7-f7a","r7-f7b"],9:["r9-quiz"]};
const ALL_SUBTASK_IDS=Object.values(STEP_SUBTASKS).flat();
const R4_CLOZE_IDS=Object.keys(R4_CLOZES);
function emptyCloze(id){return Object.fromEntries(r4ClozeGapIds(id).map(gap=>[gap,""]));}
function emptyDefaultState(){return {
 currentStep:1,completed:[],summaryUnlocked:false,solved:[],download:{quiz:false,summary:false},
 song:{playlists:"",songs:"",cardA:"",cardB:"",songFk:"",playlistFk:"",newSong:"",newPlaylist:"",chainSong:"",chainLeft:"",chainRight:"",chainPlaylist:""},
 r3:{f3a:"",f3b:"",schueler:"",ag:""},
 r4:Object.fromEntries(R4_CLOZE_IDS.map(id=>[id,emptyCloze(id)])),
 r5:{folgenA:"",folgenB:"",kommentierenA:"",kommentierenB:"",likenA:"",likenB:""},
 r6:{f6a:[],f6b:[],users:"",likesA:"",likesB:"",photos:""},
 r7:{f7a:"",f7b:[]},
 quiz:Object.fromEntries(QUIZ.map(q=>[q.id,[]]))
};}
function sanitizeState(raw){
 const s=emptyDefaultState(); if(!raw||typeof raw!=="object")return s;
 s.currentStep=Number.isInteger(raw.currentStep)&&raw.currentStep>=1&&raw.currentStep<=9?raw.currentStep:1;
 s.summaryUnlocked=raw.summaryUnlocked===true;
 if(s.currentStep===8&&!s.summaryUnlocked)s.currentStep=1;
 s.solved=sanitizeArray(raw.solved,ALL_SUBTASK_IDS);
 s.completed=sanitizeArray(raw.completed,[1,2,3,4,5,6,7,9]).filter(n=>STEP_SUBTASKS[n].every(id=>s.solved.includes(id)));
 s.download={quiz:raw.download?.quiz===true,summary:raw.download?.summary===true};
 for(const key of Object.keys(s.song))s.song[key]=sanitizeText(raw.song?.[key],160);
 s.r3={f3a:sanitizeChoice(raw.r3?.f3a,R3_F3A_OPTIONS.map(o=>o.id)),f3b:sanitizeChoice(raw.r3?.f3b,R3_F3B_OPTIONS.map(o=>o.id)),schueler:sanitizeCardinalityInput(raw.r3?.schueler),ag:sanitizeCardinalityInput(raw.r3?.ag)};
 for(const id of R4_CLOZE_IDS)for(const gap of r4ClozeGapIds(id))s.r4[id][gap]=sanitizeText(raw.r4?.[id]?.[gap],40);
 for(const key of Object.keys(s.r5))s.r5[key]=sanitizeCardinalityInput(raw.r5?.[key]);
 s.r6={f6a:sanitizeArray(raw.r6?.f6a,R6_F6A_OPTIONS.map(o=>o.id)),f6b:sanitizeArray(raw.r6?.f6b,R6_F6B_OPTIONS.map(o=>o.id)),users:sanitizeCardinalityInput(raw.r6?.users),likesA:sanitizeCardinalityInput(raw.r6?.likesA),likesB:sanitizeCardinalityInput(raw.r6?.likesB),photos:sanitizeCardinalityInput(raw.r6?.photos)};
 s.r7={f7a:sanitizeChoice(raw.r7?.f7a,R7_F7A_OPTIONS.map(o=>o.id)),f7b:sanitizeArray(raw.r7?.f7b,R7_F7B_OPTIONS.map(o=>o.id))};
 for(const q of QUIZ)s.quiz[q.id]=sanitizeArray(raw.quiz?.[q.id],q.options.map(o=>o.id));
 return s;
}
function loadState(){try{return sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{return emptyDefaultState();}}
let state=loadState();
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{
 const status=document.getElementById("data-status");status.hidden=false;status.textContent="Hinweis: Deine Eingaben können in diesem Browser nicht dauerhaft gespeichert werden.";
}}
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function sanitizeChoice(value, allowedIds) {
  return typeof value === "string" && allowedIds.includes(value) ? value : "";
}
function sanitizeArray(value, allowedIds) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => allowedIds.includes(item)))] : [];
}
function sanitizeCardinalityInput(value) {
  return typeof value === "string" ? value.slice(0, 1) : "";
}
function sanitizeText(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}
function setFeedback(id, kind, message) {
  const node = document.getElementById(`feedback-${id}`);
  if (!node) return;
  node.className = `feedback ${kind}`;
  node.textContent = message;
}
function clearFeedback(id) { setFeedback(id, "", ""); }

function isSolved(id) { return state.solved.includes(id); }
function markSolved(id) {
  if (!state.solved.includes(id)) state.solved.push(id);
  const step = Number(Object.entries(STEP_SUBTASKS).find(([, ids]) => ids.includes(id))?.[0]);
  if (step && STEP_SUBTASKS[step].every((subtaskId) => state.solved.includes(subtaskId))) markComplete(step);
  saveState();
}
function markComplete(step) {
  if (!state.completed.includes(step)) state.completed.push(step);
  renderTabs();
  updateNavigation();
}

function sameSet(a, b) {
  return a.length === b.length && [...a].sort().every((value, index) => [...b].sort()[index] === value);
}
function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function renderRadioList(containerId, name, options, selected) {
  document.getElementById(containerId).innerHTML = options.map((option) =>
    `<label class="choice-option"><input type="radio" name="${name}" value="${escapeHtml(option.id)}" ${selected === option.id ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`
  ).join("");
}
function renderCheckboxList(containerId, name, options, selected) {
  document.getElementById(containerId).innerHTML = options.map((option) =>
    `<label class="choice-option"><input type="checkbox" name="${name}" value="${escapeHtml(option.id)}" ${selected.includes(option.id) ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`
  ).join("");
}

function miniTableCard(title, columns, rows, { highlight = [], captionText } = {}) {
  const head = columns.map((column, index) => `<th scope="col"${highlight.includes(index) ? ' class="link-column"' : ""}>${escapeHtml(column)}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((cell, index) => `<td${highlight.includes(index) ? ' class="link-column"' : ""}>${cell === null ? '<span class="unknown-value">?</span>' : escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<section class="mini-table-card"><h3>${escapeHtml(title)}</h3><table><caption class="sr-only">${escapeHtml(captionText ?? `${title} – Tabellenauszug`)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
}

function genericCardinalityMessage(result) {
  if (result.status === "missing") return "Noch nicht korrekt: Trage in jede Lücke 1, n oder m ein.";
  if (result.status === "invalid") return "Noch nicht korrekt: Erlaubt sind nur 1, n oder m.";
  return null;
}
function renderR3Tables() {
  document.getElementById("r3-tables").innerHTML =
    miniTableCard("ag", ["id", "name"], AG.map((a) => [a.id, a.name])) +
    miniTableCard("schueler – Versuch mit einem Fremdschlüssel", ["id", "name", "ag_id"], SCHUELER_VERSUCH.map((s) => [s.id, s.name, s.ag_id]), { highlight: [2], captionText: "schueler – Versuch mit einem Fremdschlüssel" });
}
function checkR3F3a() {
  state.r3.f3a = document.querySelector('input[name="r3-f3a"]:checked')?.value ?? "";
  saveState();
  const messages = {
    multi: "Noch nicht korrekt: In einer Zelle steht genau ein Wert. »1, 2« ist kein int, und ein Fremdschlüssel kann nur auf einen einzigen Datensatz verweisen.",
    twoRows: "Noch nicht korrekt: Dann stünde Lina zweimal in schueler – mit zwei verschiedenen ids. Das ist Redundanz wie in Aufgabe 2: Ändert sich ihr Name, muss er an zwei Stellen geändert werden.",
    onlyOne: "Noch nicht korrekt: Dann ginge die Information verloren, dass Lina auch in der Theater-AG ist.",
  };
  if (!state.r3.f3a) { setFeedback("r3-f3a", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r3.f3a === "none") { setFeedback("r3-f3a", "success", "Richtig: Ein Fremdschlüssel speichert genau einen Verweis. Lina braucht aber zwei."); markSolved("r3-f3a"); return; }
  setFeedback("r3-f3a", "hint", messages[state.r3.f3a]);
}
function checkR3F3b() {
  state.r3.f3b = document.querySelector('input[name="r3-f3b"]:checked')?.value ?? "";
  saveState();
  if (!state.r3.f3b) { setFeedback("r3-f3b", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r3.f3b === "no") { setFeedback("r3-f3b", "success", "Richtig: Auf beiden Seiten gibt es »viele«. Ein Fremdschlüssel reicht auf keiner Seite."); markSolved("r3-f3b"); return; }
  setFeedback("r3-f3b", "hint", "Noch nicht korrekt: Sieh in die Anmeldeliste: Die Robotik-AG hat zwei Schüler, Lina und Ben. Auch hier bräuchte eine Zelle zwei Werte.");
}
function checkR3Cardinality() {
  state.r3.schueler = document.getElementById("r3-schueler-cardinality").value;
  state.r3.ag = document.getElementById("r3-ag-cardinality").value;
  saveState();
  const result = evaluateCardinalityPair(state.r3.schueler, state.r3.ag, "n:m");
  const generic = genericCardinalityMessage(result);
  if (generic) { setFeedback("r3-cardinality", "hint", generic); return; }
  if (result.status === "correct") {
    setFeedback("r3-cardinality", "success", "Richtig: Schüler n ───── m AG. Auf beiden Seiten können viele beteiligt sein.");
    markSolved("r3-cardinality");
    document.getElementById("r3-reveal").hidden = false;
    return;
  }
  if (result.reason === "same-letter") { setFeedback("r3-cardinality", "partial", "Teilweise korrekt: Auf beiden Seiten stehen tatsächlich viele. Man verwendet aber zwei verschiedene Buchstaben, weil die beiden Anzahlen unabhängig voneinander sind."); return; }
  if (result.reason === "one-is-1") { setFeedback("r3-cardinality", "partial", "Teilweise korrekt: Eine Seite hat schon »viele«, bei der anderen steht noch eine 1. Sieh in die Anmeldeliste: Lina besucht zwei AGs, und die Robotik-AG hat zwei Schüler."); return; }
  setFeedback("r3-cardinality", "hint", "Noch nicht korrekt: Ein einzelner Partner würde bedeuten, dass jeder Schüler genau eine AG besucht. Sieh in die Anmeldeliste: Wie viele AGs besucht Lina?");
}

// ---------------------------------------------------------------------------
// Schritt 4
// ---------------------------------------------------------------------------
function renderR4Tables() {
  document.getElementById("r4-tables").innerHTML =
    miniTableCard("schueler", ["id", "name"], SCHUELER.map((s) => [s.id, s.name])) +
    miniTableCard("teilnahme", ["schueler_id", "ag_id"], TEILNAHME.map((t) => [t.schueler_id, t.ag_id])) +
    miniTableCard("ag", ["id", "name"], AG.map((a) => [a.id, a.name]));
}
function maybeRevealR4Merke() {
  if (["r4-f4a", "r4-f4b", "r4-f4c"].every(isSolved)) document.getElementById("r4-merke").hidden = false;
}
function clozeInput(clozeId, gapId) {
  return document.getElementById(`r4-${clozeId}-${gapId}`);
}
function readCloze(clozeId) {
  r4ClozeGapIds(clozeId).forEach((gapId) => { state.r4[clozeId][gapId] = clozeInput(clozeId, gapId).value; });
  saveState();
}
function markClozeGaps(clozeId, result) {
  r4ClozeGapIds(clozeId).forEach((gapId) => {
    const input = clozeInput(clozeId, gapId);
    const filled = Boolean(normalizeClozeAnswer(input.value));
    input.classList.toggle("is-correct", result.gaps[gapId]);
    input.classList.toggle("is-wrong", filled && !result.gaps[gapId]);
    if (filled && !result.gaps[gapId]) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  });
}
function clearClozeMark(input) {
  input.classList.remove("is-correct", "is-wrong");
  input.removeAttribute("aria-invalid");
}

// Fachliche Hinweise je Lückentext: die erste zutreffende Regel liefert die
// Begründung. Typische Fehlvorstellungen (Chor bei Lina, Ben bei Theater, neue
// Zeile in schueler, neue Spalte, »1, 3« in einer Zelle) bekommen eigene Hinweise.
const R4_CLOZE_FEEDBACK = {
  f4a: {
    success: "Richtig: In teilnahme stehen zwei Zeilen mit schueler_id 1 – eine mit ag_id 1 (Robotik) und eine mit ag_id 2 (Theater).",
    empty: "Noch nicht korrekt: Fülle die Lücken aus. Beginne mit Linas id in schueler.",
    hints: [
      [(v, r) => !r.gaps.id, "Linas id steht in schueler in derselben Zeile wie ihr Name."],
      [(v) => [v.agId1, v.agId2].map(normalizeClozeAnswer).includes("3") || [v.ag1, v.ag2].some((name) => normalizeClozeAnswer(name).startsWith("chor")), "Der Chor hat die ag_id 3. In teilnahme gibt es aber keine Zeile, in der Linas schueler_id zusammen mit ag_id 3 steht."],
      [(v, r) => !r.gaps.agId1 || !r.gaps.agId2, "Suche in teilnahme alle Zeilen mit Linas schueler_id und lies dort die ag_id ab."],
      [(v, r) => !r.gaps.ag1 || !r.gaps.ag2, "Die ag_id-Werte sind nur Verweise. Welche Namen gehören in der Tabelle ag zu diesen ids?"],
    ],
  },
  f4b: {
    success: "Richtig: Theater hat die ag_id 2. In teilnahme steht sie bei schueler_id 1 (Lina) und schueler_id 3 (Mia).",
    empty: "Noch nicht korrekt: Fülle die Lücken aus. Beginne mit der id der Theater-AG in ag.",
    hints: [
      [(v, r) => !r.gaps.id, "Die id der Theater-AG steht in ag in derselben Zeile wie ihr Name."],
      [(v) => [v.schuelerId1, v.schuelerId2].map(normalizeClozeAnswer).includes("2") || [v.name1, v.name2].map(normalizeClozeAnswer).includes("ben"), "Ben hat die id 2. In teilnahme steht schueler_id 2 nur zusammen mit ag_id 1 – Ben ist also nur bei Robotik angemeldet."],
      [(v, r) => !r.gaps.schuelerId1 || !r.gaps.schuelerId2, "Suche in teilnahme alle Zeilen mit der ag_id der Theater-AG und lies dort die schueler_id ab."],
      [(v, r) => !r.gaps.name1 || !r.gaps.name2, "Die schueler_id-Werte sind nur Verweise. Welche Namen gehören in der Tabelle schueler zu diesen ids?"],
    ],
  },
  f4c: {
    success: "Richtig: Jede Anmeldung ist eine eigene Zeile in teilnahme. Bens id 2 und die id 3 des Chors stehen zusammen in einer neuen Zeile – schueler und ag bleiben unverändert.",
    empty: "Noch nicht korrekt: Fülle die Lücken aus. Überlege zuerst, in welcher Tabelle die Anmeldungen stehen.",
    hints: [
      [(v) => normalizeClozeAnswer(v.table) === "schueler", "Dann stünde Ben doppelt in schueler – mit zwei verschiedenen ids. Das wäre Redundanz wie in Aufgabe 2. Bens Daten bleiben einmal gespeichert; neu ist nur seine Anmeldung."],
      [(v) => normalizeClozeAnswer(v.table) === "ag", "Der Chor steht schon in ag und bleibt unverändert. Neu ist nur Bens Anmeldung – in welcher Tabelle stehen die Anmeldungen?"],
      [(v, r) => !r.gaps.table, "Überlege, in welcher Tabelle die Anmeldungen gespeichert sind."],
      [(v) => normalizeClozeAnswer(v.row).startsWith("spalte"), "Eine neue Spalte würde die Tabelle für alle Anmeldungen umbauen. Sieh dir teilnahme an: Wie ist dort jede einzelne Anmeldung gespeichert?"],
      [(v, r) => !r.gaps.row, "Sieh dir teilnahme an: Wie ist dort jede einzelne Anmeldung gespeichert?"],
      [(v, r) => !r.gaps.schuelerId, "Bens id steht in schueler in derselben Zeile wie sein Name."],
      [(v) => /[,;\s]/.test(normalizeClozeAnswer(v.agId)), "In einer Zelle steht genau ein Wert. Bens Anmeldung für Robotik bleibt in ihrer eigenen Zeile; die neue Anmeldung bekommt eine eigene."],
      [(v) => normalizeClozeAnswer(v.agId) === "1", "ag_id 1 ist Robotik – dafür ist Ben schon angemeldet. Welche id hat der Chor in ag?"],
      [(v, r) => !r.gaps.agId, "Die id des Chors steht in ag in derselben Zeile wie sein Name."],
    ],
  },
};

function checkR4Cloze(clozeId) {
  readCloze(clozeId);
  const values = state.r4[clozeId];
  const result = evaluateCloze(clozeId, values);
  const feedbackId = `r4-${clozeId}`;
  const texts = R4_CLOZE_FEEDBACK[clozeId];
  markClozeGaps(clozeId, result);
  if (result.correctCount === result.total) {
    setFeedback(feedbackId, "success", texts.success);
    markSolved(feedbackId);
    maybeRevealR4Merke();
    return;
  }
  if (result.emptyCount === result.total) { setFeedback(feedbackId, "hint", texts.empty); return; }
  const prefix = result.correctCount > 0 ? `Teilweise korrekt: ${result.correctCount} von ${result.total} Lücken stimmen.` : "Noch nicht korrekt:";
  const hint = texts.hints.find(([applies]) => applies(values, result))?.[1] ?? "Fülle noch die leeren Lücken aus.";
  setFeedback(feedbackId, result.correctCount > 0 ? "partial" : "hint", `${prefix} ${hint}`);
}

// ---------------------------------------------------------------------------
// Schritt 5
// ---------------------------------------------------------------------------
function checkR5Cardinality() {
  state.r5.likenA = document.getElementById("r5-liken-a").value;
  state.r5.likenB = document.getElementById("r5-liken-b").value;
  state.r5.kommentierenA = document.getElementById("r5-kommentieren-a").value;
  state.r5.kommentierenB = document.getElementById("r5-kommentieren-b").value;
  state.r5.folgenA = document.getElementById("r5-folgen-a").value;
  state.r5.folgenB = document.getElementById("r5-folgen-b").value;
  saveState();
  const values = [state.r5.likenA, state.r5.likenB, state.r5.kommentierenA, state.r5.kommentierenB, state.r5.folgenA, state.r5.folgenB];
  if (values.some((value) => !normalizeCardinality(value))) { setFeedback("r5-cardinality", "hint", "Noch nicht korrekt: Trage in alle sechs Lücken 1, n oder m ein."); return; }
  if (values.some((value) => !["1", "n", "m"].includes(normalizeCardinality(value)))) { setFeedback("r5-cardinality", "hint", "Noch nicht korrekt: Erlaubt sind nur 1, n oder m."); return; }
  const liken = evaluateCardinalityPair(state.r5.likenA, state.r5.likenB, "n:m");
  const kommentieren = evaluateCardinalityPair(state.r5.kommentierenA, state.r5.kommentierenB, "n:m");
  const folgen = evaluateCardinalityPair(state.r5.folgenA, state.r5.folgenB, "n:m");
  const correctCount = [liken, kommentieren, folgen].filter((r) => r.status === "correct").length;
  if (correctCount === 3) {
    setFeedback("r5-cardinality", "success", "Richtig: Alle drei neuen Beziehungen sind n:m-Beziehungen – auch »kann folgen«, bei der users mit sich selbst verbunden ist.");
    markSolved("r5-cardinality");
    document.getElementById("r5-summary").hidden = false;
    return;
  }
  const prefix = correctCount > 0 ? `Teilweise korrekt: ${correctCount} von 3 Beziehungen stimmen.` : "Noch nicht korrekt.";
  const relations = [["kann liken", liken], ["kann kommentieren", kommentieren], ["kann folgen", folgen]];
  const sameLetter = relations.find(([, result]) => result.reason === "same-letter");
  if (sameLetter) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »${sameLetter[0]}« stehen zwei gleiche Buchstaben. Man verwendet zwei verschiedene Buchstaben, weil die beiden Anzahlen unabhängig voneinander sind.`); return; }
  const hasOne = (result) => result.reason === "one-is-1" || result.reason === "both-1";
  if (hasOne(liken)) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »kann liken« steht noch eine 1. Kann ein Foto nur von einem einzigen Benutzer geliked werden?`); return; }
  if (hasOne(kommentieren)) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »kann kommentieren« steht noch eine 1. Lies die Beziehung in beide Richtungen: Wie viele Fotos kann ein Benutzer kommentieren, und wie viele Benutzer können ein Foto kommentieren?`); return; }
  if (hasOne(folgen)) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »kann folgen« steht noch eine 1. Ein Benutzer kann vielen anderen folgen – und wie viele Follower kann ein Benutzer haben?`); return; }
  setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", prefix);
}

// ---------------------------------------------------------------------------
// Schritt 6
// ---------------------------------------------------------------------------
function renderR6Tables() {
  const userRows = INSTAHUB_USERS.filter((u) => [3, 4, 15, 18].includes(u.id));
  const photoRows = INSTAHUB_PHOTOS;
  document.getElementById("r6-tables").innerHTML =
    miniTableCard("users", ["id", "username"], userRows.map((u) => [u.id, u.username])) +
    miniTableCard("photos", ["id", "user_id", "description"], photoRows.map((p) => [p.id, p.user_id, p.description]), { highlight: [1] }) +
    miniTableCard("likes – Tabellenauszug (nur die Fremdschlüssel)", ["user_id", "photo_id"], INSTAHUB_LIKES.map((l) => [l.user_id, l.photo_id]), { captionText: "likes – Tabellenauszug (nur die Fremdschlüssel)" });
}
function checkR6F6a() {
  state.r6.f6a = selectedValues("r6-f6a");
  saveState();
  const selected = state.r6.f6a;
  const correctSet = ["photo12", "photo14"];
  if (!selected.length) { setFeedback("r6-f6a", "hint", "Noch nicht korrekt: Kreuze mindestens ein Foto an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r6-f6a", "success", "Richtig: In likes stehen zwei Zeilen mit user_id 15 – mit photo_id 12 und photo_id 14."); markSolved("r6-f6a"); return; }
  if (selected.includes("none")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r6-f6a", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} photos.user_id gibt an, wer ein Foto hochgeladen hat. Wer ein Foto geliked hat, steht in der Beziehungstabelle (Hilfstabelle) likes.`); return; }
  if (selected.some((id) => correctSet.includes(id))) { setFeedback("r6-f6a", "partial", "Teilweise korrekt: Dieses Foto stimmt. In likes steht user_id 15 in mehr als einer Zeile."); return; }
  setFeedback("r6-f6a", "hint", "Noch nicht korrekt: Suche in likes alle Zeilen mit user_id 15.");
}
function checkR6F6b() {
  state.r6.f6b = selectedValues("r6-f6b");
  saveState();
  const selected = state.r6.f6b;
  const correctSet = ["emil", "jonas"];
  if (!selected.length) { setFeedback("r6-f6b", "hint", "Noch nicht korrekt: Kreuze mindestens eine Person an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r6-f6b", "success", "Richtig: In likes steht photo_id 14 zweimal – bei user_id 15 (reisewut_emil) und user_id 18 (gamewut_jonas)."); markSolved("r6-f6b"); return; }
  if (selected.includes("koch")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r6-f6b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} koch_kicker (id 4) steht bei Foto 14 in photos.user_id: Er hat das Foto hochgeladen. Das ist die 1:n-Beziehung »kann hochladen«, nicht »kann liken«.`); return; }
  if (selected.includes("berg")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r6-f6b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} bergcoder (id 3) hat Foto 12 hochgeladen. Mit Foto 14 hat er in diesem Auszug nichts zu tun.`); return; }
  if (selected.some((id) => correctSet.includes(id))) { setFeedback("r6-f6b", "partial", "Teilweise korrekt: Diese Person stimmt. Suche in likes alle Zeilen mit photo_id 14."); return; }
  setFeedback("r6-f6b", "hint", "Noch nicht korrekt: Suche in likes alle Zeilen mit photo_id 14.");
}
function checkR6Cardinality() {
  state.r6.users = document.getElementById("r6-users-cardinality").value;
  state.r6.likesA = document.getElementById("r6-likes-a-cardinality").value;
  state.r6.likesB = document.getElementById("r6-likes-b-cardinality").value;
  state.r6.photos = document.getElementById("r6-photos-cardinality").value;
  saveState();
  const values = [state.r6.users, state.r6.likesA, state.r6.likesB, state.r6.photos];
  if (values.some((value) => !normalizeCardinality(value))) { setFeedback("r6-cardinality", "hint", "Noch nicht korrekt: Trage in jede Lücke 1, n oder m ein."); return; }
  if (values.some((value) => !["1", "n", "m"].includes(normalizeCardinality(value)))) { setFeedback("r6-cardinality", "hint", "Noch nicht korrekt: Erlaubt sind nur 1, n oder m."); return; }
  const users = normalizeCardinality(state.r6.users), likesA = normalizeCardinality(state.r6.likesA), likesB = normalizeCardinality(state.r6.likesB), photos = normalizeCardinality(state.r6.photos);
  const usersOk = users === "1", photosOk = photos === "1", likesAOk = likesA === "n", likesBOk = likesB === "n";
  const k = [usersOk, likesAOk, likesBOk, photosOk].filter(Boolean).length;
  if (k === 4) {
    setFeedback("r6-cardinality", "success", "Richtig: users 1 ───── n likes n ───── 1 photos. Aus der n:m-Beziehung sind zwei 1:n-Beziehungen geworden.");
    markSolved("r6-cardinality");
    document.getElementById("r6-summary").hidden = false;
    return;
  }
  const prefix = k > 0 ? `Teilweise korrekt: ${k} von 4 Lücken stimmen.` : "Noch nicht korrekt.";
  if (!usersOk) { setFeedback("r6-cardinality", k > 0 ? "partial" : "hint", `${prefix} Prüfe die Lücke bei users: In jeder Zeile von likes steht genau eine user_id. Zu wie vielen Benutzern gehört also ein Like?`); return; }
  if (!photosOk) { setFeedback("r6-cardinality", k > 0 ? "partial" : "hint", `${prefix} Prüfe die Lücke bei photos: In jeder Zeile von likes steht genau eine photo_id. Zu wie vielen Fotos gehört also ein Like?`); return; }
  if (likesA === "1" || likesB === "1") { setFeedback("r6-cardinality", k > 0 ? "partial" : "hint", `${prefix} Prüfe die Lücken bei likes: Ein Benutzer kann viele Fotos liken – wie viele Zeilen kann es in likes mit derselben user_id geben?`); return; }
  setFeedback("r6-cardinality", "partial", "Teilweise korrekt: Auf der Seite von likes stehen tatsächlich viele. Bei einer 1:n-Beziehung schreibt man dafür n.");
}

// ---------------------------------------------------------------------------
// Schritt 7
// ---------------------------------------------------------------------------
function renderR7Tables() {
  const userRows = INSTAHUB_USERS.filter((u) => [1, 52, 117, 138].includes(u.id));
  document.getElementById("r7-tables").innerHTML =
    miniTableCard("users", ["id", "username"], userRows.map((u) => [u.id, u.username])) +
    miniTableCard("follows", ["id", "following_id", "follower_id"], INSTAHUB_FOLLOWS.map((f) => [f.id, f.following_id, f.follower_id]), { highlight: [1, 2] });
}
function maybeRevealR7Summary() {
  if (["r7-f7a", "r7-f7b"].every(isSolved)) document.getElementById("r7-summary").hidden = false;
}
function checkR7F7a() {
  state.r7.f7a = document.querySelector('input[name="r7-f7a"]:checked')?.value ?? "";
  saveState();
  if (!state.r7.f7a) { setFeedback("r7-f7a", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r7.f7a === "taroFollowsOeko") { setFeedback("r7-f7a", "success", "Richtig: follower_id 138 ist wanderriese_taro, following_id 52 ist oekosmasher."); markSolved("r7-f7a"); maybeRevealR7Summary(); return; }
  if (state.r7.f7a === "oekoFollowsTaro") { setFeedback("r7-f7a", "hint", "Noch nicht korrekt: Die Richtung ist vertauscht. follower_id ist der, der folgt – hier also 138, wanderriese_taro."); return; }
  setFeedback("r7-f7a", "hint", "Noch nicht korrekt: Eine Zeile beschreibt nur eine Richtung. Gegenseitig wäre es erst, wenn es zusätzlich eine Zeile mit following_id 138 und follower_id 52 gäbe.");
}
function checkR7F7b() {
  state.r7.f7b = selectedValues("r7-f7b");
  saveState();
  const selected = state.r7.f7b;
  const correctSet = ["twoRows", "swapped", "bothRefUsers"];
  if (!selected.length) { setFeedback("r7-f7b", "hint", "Noch nicht korrekt: Kreuze mindestens eine Aussage an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r7-f7b", "success", "Richtig: Jede Zeile beschreibt eine Richtung. Für gegenseitiges Folgen braucht man zwei Zeilen, und beide Fremdschlüssel verweisen auf users."); markSolved("r7-f7b"); maybeRevealR7Summary(); return; }
  if (selected.includes("oneRowEnough")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r7-f7b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} Folgen gilt nicht automatisch in beide Richtungen: Zeile 947 zeigt, dass wanderriese_taro oekosmasher folgt – daraus folgt nicht, dass oekosmasher auch wanderriese_taro folgt.`); return; }
  setFeedback("r7-f7b", "partial", "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch mindestens eine richtige Aussage. Vergleiche die Zeilen 1 und 2 und sieh dir an, worauf following_id und follower_id verweisen.");
}

function renderQuiz() {
  QUIZ.forEach((question,index) => renderCheckboxList(`quiz-q${index+1}`, `quiz-q${index+1}`, question.options.map((o)=>({id:o.id,label:o.text})), state.quiz[question.id]));
}
function checkQuiz(event) {
  event.preventDefault();
  QUIZ.forEach((q,i)=> { state.quiz[q.id]=selectedValues(`quiz-q${i+1}`); });
  saveState();
  const results=QUIZ.map(q=>evaluateQuizQuestion(q,state.quiz[q.id]));
  const correctCount=results.filter(Boolean).length;
  if(correctCount===QUIZ.length) {
    setFeedback("step"+QUIZ_STEP,"success", QUIZ_SUCCESS);
    state.summaryUnlocked=true; markSolved(QUIZ_SOLVED); saveState(); renderTabs();
    setTimeout(()=>navigateTo(SUMMARY_STEP),300); return;
  }
  const firstWrong=results.findIndex(ok=>!ok);
  setFeedback("step"+QUIZ_STEP, correctCount ? "partial":"hint",
    `${correctCount ? "Teilweise korrekt:" : "Noch nicht korrekt:"} ${correctCount} von ${QUIZ.length} Fragen stimmen. ${QUIZ[firstWrong].hint}`);
}
function bindQuiz() {
  document.getElementById("final-quiz").addEventListener("submit",checkQuiz);
  window.addQuizQuestionChecks?.({
    questions: QUIZ.map((q,i)=>({fieldset:document.getElementById(`quiz-q${i+1}`)?.closest("fieldset"),solution:q.options.filter(o=>o.correct).map(o=>o.id),hint:q.hint})),
    buttonClass:"primary-button",rowClass:"action-row",levels:{high:"success",medium:"partial",low:"hint"},
    onAllCorrect:()=>document.getElementById("final-quiz").requestSubmit()
  });
  QUIZ.forEach((q,i)=>document.querySelectorAll(`input[name="quiz-q${i+1}"]`).forEach(input=>input.addEventListener("change",()=>{
    state.quiz[q.id]=selectedValues(`quiz-q${i+1}`); saveState(); clearFeedback("step"+QUIZ_STEP);
  })));
}
function renderTabs() {
  const tabs=document.getElementById("step-tabs");
  tabs.innerHTML=STEP_TITLES.map((title,index)=>{
    const step=index+1;
    return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step)?"is-complete":""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep===step}" data-step="${step}" ${step===SUMMARY_STEP&&!state.summaryUnlocked?"hidden":""}><span>${step}</span><small>${title}</small></button>`;
  }).join("");
  tabs.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>navigateTo(Number(b.dataset.step))));
  enableTabKeyboardNavigation(tabs); syncTabSemantics(tabs,state.currentStep);
}
function navigateTo(step,{focusContent=false}={}) {
  if(step===SUMMARY_STEP&&!state.summaryUnlocked) return;
  document.querySelectorAll(".step-panel").forEach(p=>{p.hidden=p.id!==`step-${step}`;});
  state.currentStep=step; saveState(); renderTabs(); updateNavigation();
  if(step===SUMMARY_STEP) renderSummary();
  const panel=document.getElementById(`step-${step}`);
  syncTabSemantics(document.getElementById("step-tabs"),step);
  if(focusContent) focusTabPanelStart(panel); else window.scrollTo({top:0,behavior:"smooth"});
}
function updateNavigation() {
  const percent=Math.round(state.completed.filter(n=>n>=1&&n<=QUIZ_STEP).length/QUIZ_STEP*100);
  document.getElementById("progress-bar").style.width=`${percent}%`;
  document.getElementById("progress-percent").textContent=`${percent} % bearbeitet`;
  document.getElementById("progress-label").textContent=`Schritt ${state.currentStep} von ${QUIZ_STEP}`;
  const panel=document.getElementById(`step-${state.currentStep}`);
  if(panel) renderTabFlowNavigation(panel,{items:STEP_TITLES.map((label,index)=>({id:index+1,label})),currentId:state.currentStep,onNavigate:navigateTo,isEnabled:id=>id!==SUMMARY_STEP||state.summaryUnlocked});
}
function unlockSolution(event,expectedCode,downloadLinkId,messageId) {
  event.preventDefault();
  const entered=event.currentTarget.elements["solution-code"].value.toUpperCase().replace(/[^A-Z0-9]/g,"");
  const expected=expectedCode.toUpperCase().replace(/[^A-Z0-9]/g,"");
  const link=document.getElementById(downloadLinkId),message=document.getElementById(messageId);
  const ok=entered===expected;
  link.hidden=!ok; message.className=`solution-code-message ${ok?"":"error"}`;
  message.textContent=ok?"Code korrekt. Das Sicherungsblatt ist freigeschaltet.":"Der eingegebene Code ist nicht gültig.";
  state.download[downloadLinkId.endsWith("-summary")?"summary":"quiz"]=ok; saveState();
}
window.unlockSolution=unlockSolution;
function restoreDownloads() {
  for(const [key,id] of [["quiz","solution-download-link"],["summary","solution-download-link-summary"]]) {
    document.getElementById(id).hidden=!state.download[key];
  }
}
function bindReset() {
  document.getElementById("reset-module").addEventListener("click",()=>{
    if(window.confirm("Möchtest du alle Eingaben und den Fortschritt zurücksetzen?")) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      window.location.reload();
    }
  });
}
function renderSummary(){
 const entries=[
 ["1. Songs und Playlists","Nenne Playlists von Gaslighter und Songs in Fussballhits; trage die Kardinalitäten ein.","Gaslighter: Good Oldies und Fussballhits; Fussballhits: Gaslighter, Wavin‘ Flag, ’54, ’74, ’90, 2006. Song n — m Playlist."],
 ["2. Beziehungstabelle","Ordne die Fremdschlüssel zu, ergänze die neue Zeile und die beiden Verbindungen.","Song_in_Playlist: song_id → Song.id; playlist_id → Playlist.id; neue Zeile (1, 2); Song 1 — n Song_in_Playlist n — 1 Playlist."],
 ["3. Lina besucht zwei AGs","Prüfe den Fremdschlüsselversuch und ergänze die Kardinalitäten.","Ein einzelner Fremdschlüssel kann Linas zwei AGs nicht speichern; Schüler n — m AG."],
 ["4. Anmeldungen","Lies die Zuordnungen in teilnahme und trage Bens Chor-Anmeldung ein.","Lina: Robotik und Theater; Theater: Lina und Mia; Ben im Chor: teilnahme(2, 3). Lina (id 1): ag_id 1 und 2, also Robotik und Theater. Theater (id 2): schueler_id 1 und 3, also Lina und Mia. Bens Chor-Anmeldung ist eine neue Zeile in teilnahme mit schueler_id 2 und ag_id 3."],
 ["5. InstaHub","Ergänze die Kardinalitäten für liken, kommentieren und folgen.","users n — m photos (liken, kommentieren); users n — m users (folgen)."],
 ["6. likes","Lies Likes und ihre Umsetzung.","likes(18, 14): Benutzer 18 hat Foto 14 geliked; users 1 — n likes n — 1 photos. reisewut_emil hat die Fotos 12 und 14 geliked; Foto 14 gefällt reisewut_emil und gamewut_jonas."],
 ["7. follows","Lies die Richtung und das gegenseitige Folgen.","follows: follower_id = wer folgt, following_id = wem gefolgt wird; gegenseitiges Folgen benötigt zwei Zeilen. Zeile 947: wanderriese_taro folgt oekosmasher."],
 ["9. Abschlussquiz","Sichere die Beziehungen.","Alle sechs Fragen richtig beantwortet."]
 ];
 document.getElementById("answer-summary").innerHTML=entries.map(([title,prompt,result])=>`<section class="summary-section"><h3>${title}</h3><p class="prompt">${prompt}</p><dl class="summary-grid"><dt>Richtiges Ergebnis</dt><dd>${result}</dd></dl></section>`).join("");
}
function restoreInputs(){
 const fields={ "song-playlists":"playlists","playlist-songs":"songs","song-cardinality":"cardA","playlist-cardinality":"cardB","song-fk":"songFk","playlist-fk":"playlistFk","new-song-id":"newSong","new-playlist-id":"newPlaylist","chain-song":"chainSong","chain-left":"chainLeft","chain-right":"chainRight","chain-playlist":"chainPlaylist"};
 for(const [id,key] of Object.entries(fields))document.getElementById(id).value=state.song[key];
 syncSongReveal();
 document.getElementById("song-merken").hidden=!isSolved("song-chain");
 for(const [id,key] of Object.entries({"r3-schueler-cardinality":"schueler","r3-ag-cardinality":"ag"}))document.getElementById(id).value=state.r3[key];
 for(const [id,key] of Object.entries({"r5-folgen-a":"folgenA","r5-folgen-b":"folgenB","r5-kommentieren-a":"kommentierenA","r5-kommentieren-b":"kommentierenB","r5-liken-a":"likenA","r5-liken-b":"likenB"}))document.getElementById(id).value=state.r5[key];
 for(const [id,key] of Object.entries({"r6-users-cardinality":"users","r6-likes-a-cardinality":"likesA","r6-likes-b-cardinality":"likesB","r6-photos-cardinality":"photos"}))document.getElementById(id).value=state.r6[key];
 R4_CLOZE_IDS.forEach(id=>r4ClozeGapIds(id).forEach(g=>{clozeInput(id,g).value=state.r4[id][g];}));
 renderRadioList("r3-f3a-choices","r3-f3a",R3_F3A_OPTIONS,state.r3.f3a);
 renderRadioList("r3-f3b-choices","r3-f3b",R3_F3B_OPTIONS,state.r3.f3b);
 renderCheckboxList("r6-f6a-choices","r6-f6a",R6_F6A_OPTIONS,state.r6.f6a);
 renderCheckboxList("r6-f6b-choices","r6-f6b",R6_F6B_OPTIONS,state.r6.f6b);
 renderRadioList("r7-f7a-choices","r7-f7a",R7_F7A_OPTIONS,state.r7.f7a);
 renderCheckboxList("r7-f7b-choices","r7-f7b",R7_F7B_OPTIONS,state.r7.f7b);
 renderQuiz();restoreDownloads();
 document.getElementById("r3-reveal").hidden=!isSolved("r3-cardinality");
 document.getElementById("r4-merke").hidden=!["r4-f4a","r4-f4b","r4-f4c"].every(isSolved);
 document.getElementById("r5-summary").hidden=!isSolved("r5-cardinality");
 document.getElementById("r6-summary").hidden=!isSolved("r6-cardinality");
 document.getElementById("r7-summary").hidden=!["r7-f7a","r7-f7b"].every(isSolved);
}
function bindEvents(){
 for(const [id,fn] of Object.entries({"song-observation":checkSongObservation,"song-cardinality":checkSongCardinality,"song-fk":checkSongFk,"song-row":checkSongRow,"song-chain":checkSongChain,"r3-f3a":checkR3F3a,"r3-f3b":checkR3F3b,"r3-cardinality":checkR3Cardinality,"r5-cardinality":checkR5Cardinality,"r6-f6a":checkR6F6a,"r6-f6b":checkR6F6b,"r6-cardinality":checkR6Cardinality,"r7-f7a":checkR7F7a,"r7-f7b":checkR7F7b}))document.getElementById("check-"+id).addEventListener("click",fn);
 R4_CLOZE_IDS.forEach(id=>document.getElementById("check-r4-"+id).addEventListener("click",()=>checkR4Cloze(id)));
 const fields={"song-playlists":"playlists","playlist-songs":"songs","song-cardinality":"cardA","playlist-cardinality":"cardB","song-fk":"songFk","playlist-fk":"playlistFk","new-song-id":"newSong","new-playlist-id":"newPlaylist","chain-song":"chainSong","chain-left":"chainLeft","chain-right":"chainRight","chain-playlist":"chainPlaylist"};
 for(const [id,key] of Object.entries(fields))document.getElementById(id).addEventListener(["song-fk","playlist-fk"].includes(id)?"change":"input",e=>{state.song[key]=e.target.value;saveState();});
 for(const [id,key] of Object.entries({"r3-schueler-cardinality":"schueler","r3-ag-cardinality":"ag"}))document.getElementById(id).addEventListener("input",e=>{state.r3[key]=e.target.value;saveState();});
 for(const [id,key] of Object.entries({"r5-folgen-a":"folgenA","r5-folgen-b":"folgenB","r5-kommentieren-a":"kommentierenA","r5-kommentieren-b":"kommentierenB","r5-liken-a":"likenA","r5-liken-b":"likenB"}))document.getElementById(id).addEventListener("input",e=>{state.r5[key]=e.target.value;saveState();});
 for(const [id,key] of Object.entries({"r6-users-cardinality":"users","r6-likes-a-cardinality":"likesA","r6-likes-b-cardinality":"likesB","r6-photos-cardinality":"photos"}))document.getElementById(id).addEventListener("input",e=>{state.r6[key]=e.target.value;saveState();});
 R4_CLOZE_IDS.forEach(id=>r4ClozeGapIds(id).forEach(g=>clozeInput(id,g).addEventListener("input",e=>{state.r4[id][g]=e.target.value;saveState();clearClozeMark(e.target);})));
 const bindChoice=(name,fn,multi)=>document.querySelectorAll(`input[name="${name}"]`).forEach(input=>input.addEventListener("change",()=>{fn(multi?selectedValues(name):input.value);saveState();}));
 bindChoice("r3-f3a",v=>state.r3.f3a=v,false);bindChoice("r3-f3b",v=>state.r3.f3b=v,false);
 bindChoice("r6-f6a",v=>state.r6.f6a=v,true);bindChoice("r6-f6b",v=>state.r6.f6b=v,true);
 bindChoice("r7-f7a",v=>state.r7.f7a=v,false);bindChoice("r7-f7b",v=>state.r7.f7b=v,true);
 bindQuiz();bindReset();
}
function init(){
 renderSongTables();renderR3Tables();renderR4Tables();renderR6Tables();renderR7Tables();
 restoreInputs();renderTabs();bindEvents();navigateTo(state.currentStep);updateNavigation();
}
document.addEventListener("DOMContentLoaded",init);
