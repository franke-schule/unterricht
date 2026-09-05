import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = fs.readFileSync(new URL("../../../../../manifest-physikaufgaben.txt", import.meta.url), "utf8");
const generalManifest = fs.readFileSync(new URL("../../../../../manifest-allgemein.txt", import.meta.url), "utf8");
const agentInstructions = fs.readFileSync(new URL("../../../../../AGENTS.md", import.meta.url), "utf8");

assert.match(manifest, /Formelzeichen und Indizes/);
assert.match(manifest, /Koordinatensysteme/);
assert.match(manifest, /positive x-Achse und die positive y-Achse besitzen Pfeilspitzen/);
assert.match(manifest, /Gültige Ziffern bei Rechenaufgaben/);
assert.match(manifest, /Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen/);
assert.match(manifest, /Runde das Endergebnis noch auf/);
assert.match(generalManifest, /manifest-physikaufgaben\.txt/);
assert.match(agentInstructions, /manifest-physikaufgaben\.txt/);

console.log("Das Physikmanifest bündelt Index-, Koordinatensystem- und Ziffernregeln und ist zentral verlinkt.");
