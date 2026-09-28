"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {}, console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "diagrammwerkzeug.js"), "utf8"), sandbox, { filename: "diagrammwerkzeug.js" });
const core = sandbox.window.DiagrammwerkzeugCore;
const plain = (value) => JSON.parse(JSON.stringify(value));

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.01, `${message}: ${actual} statt ${expected}`);
}

function onRectangleBorder(card, point) {
  const { width, height } = core.cardLayout(card);
  const dx = Math.abs(point.x - card.x), dy = Math.abs(point.y - card.y);
  assert.ok(dx <= width / 2 + 0.01 && dy <= height / 2 + 0.01, "Anschluss liegt außerhalb der Karte");
  assert.ok(Math.abs(dx - width / 2) < 0.01 || Math.abs(dy - height / 2) < 0.01, "Anschluss berührt keinen Kartenrand");
}

const diagram = core.emptyDocument();
const subclass = core.makeCard(diagram, "class-3", 220, 230);
const superclass = core.makeCard(diagram, "abstract", 690, 230);
const object = core.makeCard(diagram, "object-2", 900, 510);
const iface = core.makeCard(diagram, "interface", 350, 530);
assert.equal(core.cardLayout(subclass).sections.length, 2);
assert.equal(core.cardLayout(object).sections.length, 1);
assert.equal(core.cardLayout(object).radius, 14);
assert.equal(core.cardLayout(iface).sections[0].key, "methods");

const inheritance = core.makeEdge(diagram, "inheritance", subclass.id, superclass.id);
const relation = core.makeEdge(diagram, "association", superclass.id, subclass.id);
relation.cardinalityFrom = "1";
relation.cardinalityTo = "0..*";
relation.name = "kennt";
const plainLine = core.makeEdge(diagram, "line", object.id, iface.id);
assert.throws(() => core.makeEdge(diagram, "inheritance", object.id, subclass.id), /nur Klassenkarten/);
assert.throws(() => core.makeEdge(diagram, "association", object.id, subclass.id), /nur Klassenkarten/);
assert.throws(() => core.makeEdge(diagram, "line", object.id, object.id), /zwei verschiedene/);

let geometry = core.edgeGeometry(diagram, inheritance);
onRectangleBorder(subclass, geometry.start);
onRectangleBorder(superclass, geometry.end);
near(geometry.triangle[0].x, geometry.end.x, "Pfeilspitze berührt Oberklasse horizontal");
near(geometry.triangle[0].y, geometry.end.y, "Pfeilspitze berührt Oberklasse vertikal");

superclass.x = subclass.x;
superclass.y = 570;
geometry = core.edgeGeometry(diagram, inheritance);
onRectangleBorder(subclass, geometry.start);
onRectangleBorder(superclass, geometry.end);
subclass.attributes.push("ein sehr langes Attribut mit einem längeren Typnamen, das in der Karte umgebrochen werden muss");
core.clampCard(subclass);
superclass.x = 690;
geometry = core.edgeGeometry(diagram, inheritance);
onRectangleBorder(subclass, geometry.start);
onRectangleBorder(superclass, geometry.end);
assert.ok(core.cardLayout(subclass).height > core.cardLayout(iface).height, "Zeilen vergrößern die Karte");

const objectPoint = core.edgeGeometry(diagram, plainLine).start;
const objectLayout = core.cardLayout(object);
assert.ok(Math.abs(objectPoint.x - object.x) <= objectLayout.width / 2);
assert.ok(Math.abs(objectPoint.y - object.y) <= objectLayout.height / 2);

const exported = JSON.stringify(diagram);
const loaded = core.validateDocument(JSON.parse(exported));
assert.equal(loaded.valid, true, loaded.error);
assert.deepEqual(plain(loaded.document), plain(diagram), "JSON speichert alle Karten, Kanten und Beschriftungen");
const original = JSON.stringify(diagram);
const duplicate = plain(diagram);
duplicate.cards.push({ ...duplicate.cards[0] });
assert.equal(core.validateDocument(duplicate).valid, false);
const unknown = plain(diagram);
unknown.cards[0].type = "er-attribut";
assert.equal(core.validateDocument(unknown).valid, false);
const broken = plain(diagram);
broken.edges[0].to = "c999";
assert.equal(core.validateDocument(broken).valid, false);
const illegal = plain(diagram);
illegal.edges[0].type = "aggregation";
assert.equal(core.validateDocument(illegal).valid, false);
assert.equal(JSON.stringify(diagram), original, "Ungültige Importe verändern das Ausgangsdokument nicht");

const checkDocument = core.emptyDocument();
const hund = core.makeCard(checkDocument, "class-3", 250, 250);
hund.name = "Hund";
hund.attributes = ["String name", "alter: int"];
hund.methods = ["belle(): void", "Hund(par1: int, par2: String)", "void zeigeDaten()"];
assert.deepEqual(plain(core.checkHundClass(hund).issues), [], "Hund-Karte akzeptiert Java- und UML-Schreibweise");
assert.deepEqual(plain(core.checkCardForm(hund).issues), [], "Hund-Karte erfüllt die Formregeln");
hund.attributes.reverse();
hund.methods.reverse();
assert.deepEqual(plain(core.checkHundClass(hund).issues), [], "Reihenfolge von Attributen und Methoden ist unerheblich");
hund.methods = ["Hund(parameter1, parameter2)", "zeigeDaten()", "belle()"];
assert.deepEqual(plain(core.checkHundClass(hund).issues), [], "Musterlösung aus dem Sicherungsblatt wird akzeptiert");
hund.methods[0] = "Hund(String, int)";
assert.ok(core.checkHundClass(hund).issues.some((issue) => issue.includes("Konstruktor")), "Die Reihenfolge der Konstruktorparameter bleibt fachlich verbindlich");
hund.methods[0] = "Hund(parameter1, parameter2)";
hund.attributes[0] = "farbe: String";
assert.ok(core.checkHundClass(hund).issues.some((issue) => issue.includes("Attribute")), "Falsches Attribut wird erkannt");
hund.attributes[0] = "alter: int";

const checkedObject = core.makeCard(checkDocument, "object-2", 700, 450);
checkedObject.name = "bello:Hund";
checkedObject.values = ["alter = 5", "name = Bello"];
assert.deepEqual(plain(core.checkCardForm(checkedObject).issues), [], "Objektkarte erfüllt die Formregeln");
checkedObject.values.reverse();
assert.deepEqual(plain(core.checkCardForm(checkedObject).issues), [], "Reihenfolge der Objektwerte ist unerheblich");
assert.deepEqual(plain(core.checkDiagramForm(checkDocument).issues), [], "Diagramm erfüllt die allgemeinen Formregeln");

const duplicateDocument = core.emptyDocument();
const duplicateClass = core.makeCard(duplicateDocument, "class-3", 250, 250);
duplicateClass.name = "Beispiel";
duplicateClass.attributes = ["alter: int", "int alter"];
duplicateClass.methods = ["foo()", "Foo()"];
assert.ok(core.checkCardForm(duplicateClass).issues.some((issue) => issue.includes("doppelte")), "Gleichbedeutende Attributschreibweisen werden als doppelt erkannt");
duplicateClass.attributes = ["alter: int"];
assert.deepEqual(plain(core.checkCardForm(duplicateClass).issues), [], "Unterschiedliche Großschreibung von Methodennamen bleibt erhalten");

console.log("Diagrammwerkzeug: Dokumentmodell, Import, Kartenrandgeometrie und reihenfolgeunabhängige Prüfung geprüft.");
