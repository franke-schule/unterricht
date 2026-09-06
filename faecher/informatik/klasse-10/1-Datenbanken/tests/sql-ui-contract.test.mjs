import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(folder, '../../../..');
const source = await readFile(resolve(folder, 'sql-lab.js'), 'utf8');
const css = await readFile(resolve(folder, 'sql-lab.css'), 'utf8');
const agents = await readFile(resolve(repository, 'AGENTS.md'), 'utf8');
const manifest = await readFile(resolve(repository, 'manifest-datenbankaufgaben.txt'), 'utf8');

assert.match(source, /const NEUTRAL_SQL_PLACEHOLDER = 'SELECT \.\.\.\\nFROM \.\.\.'/);
assert.doesNotMatch(source, /\.placeholder\s*=\s*SONG_VERBUND_SQL/);
assert.doesNotMatch(source, /\.placeholder\s*=\s*'SELECT \.\.\. FROM/);
assert.match(source, /SELECT username, birthday\\nFROM users\\nWHERE city != 'Berlin';/);
assert.match(source, /panel\.append\(schemaCard\(USERS_TABLE_SCHEMAS\)\)/);
for (const attribute of ['email_verified_at', 'password', 'bio', 'avatar', 'is_active', 'remember_token', 'updated_at']) assert.ok(source.includes(`['${attribute}',`), `users-Schema enthält ${attribute}`);
assert.match(source, /panel\.append\(schemaCard\(MENU_TABLE_SCHEMAS\)\)/);
assert.match(source, /panel\.append\(schemaCard\(SONG_VERBUND_TABLE_SCHEMAS\)\)/);
assert.match(source, /Ergebnisrelation horizontal und vertikal scrollen/);
assert.match(source, /`result server-feedback/);
assert.match(source, /\$\{feedback\.points\} von \$\{feedback\.maxPoints\} Punkten/);
assert.match(source, /button\.textContent = 'Erklärung erneut prüfen'/);
assert.match(source, /card\.querySelector\('\.server-feedback'\)\?\.remove\(\)/);
assert.match(css, /\.sql-page \.progress-card \{ position: static; \}/);
assert.match(css, /\.sql-schema-card \{ position: sticky;/);
assert.match(css, /\.result-relation \.table-scroll \{ max-height:[^}]+overflow: auto;/);
assert.match(css, /\.result-relation th \{[^}]*white-space: nowrap;/);
assert.match(css, /\.server-feedback\.result\.high/);
assert.match(css, /\.server-feedback\.result\.medium/);
assert.match(css, /\.server-feedback\.result\.low/);
assert.match(agents, /manifest-datenbankaufgaben\.txt` vollständig gelesen und beachtet werden/);
for (const phrase of ['Tabellenname (attribut: datentyp, ...)', 'SELECT ...', 'FROM ...', 'Ergebnisrelationen', 'Beschreibe-Aufgaben', 'Desktop, Tablet und Smartphone']) assert.ok(manifest.includes(phrase), `Manifest enthält: ${phrase}`);

console.log('SQL-UI-Vertrag für Schema, Platzhalter, Ergebnisfenster und Punktefeedback geprüft');
