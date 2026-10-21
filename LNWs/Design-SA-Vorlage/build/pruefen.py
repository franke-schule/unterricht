from pathlib import Path
import re
import sqlite3
import unicodedata
import json
from pypdf import PdfReader

root = Path(__file__).resolve().parent.parent
stem = 'kurzarbeit-informatik-klasse-10-datenbanken'
prompt_path = root / 'prompt-kurzarbeit-informatik-klasse-10.txt'
prompt = prompt_path.read_text(encoding='utf-8')
template = prompt.split('VERBINDLICHE AUFGABENVORLAGE – ANFANG', 1)[1].split('VERBINDLICHE AUFGABENVORLAGE – ENDE', 1)[0].strip()

tables = '''Tabellenausschnitte Nr. 1

Berechtigung
id | name
1  | Kamera
2  | Standort
3  | Fotos lesen

Apps
id | name
1  | WhatsApp
2  | TikTok
3  | Instagram

Berechtigungen_von_Apps
app_id | berechtigung_id
1      | 1
1      | 3
2      | 1
3      | 2
3      | 3
'''
diagram = '''Klassendiagramm Nr. 2

[Berechtigungen] 1 ---------- n [Berechtigungen-von-Apps] n ---------- 1 [Apps]

Alle Karten bestehen aus einem Namensbereich und einem leeren zweiten Bereich.
Freier Zeichenraum unter den Karten für Korrekturen.'''
schema = '''Appentwickler (id: int [PS], name: varchar(255), gruendungsjahr: int)
App (id: int [PS], appentwickler_id: int [FS], name: varchar(255), erscheinungsdatum: date, kategorie: varchar(255))

Verwendete Abkürzungen: PS = Primärschlüssel, FS = Fremdschlüssel. App.appentwickler_id verweist auf Appentwickler.id.'''
out = ['INFORMATIK · KLASSE 10\nKURZARBEIT\nDatenbanken\n']
expected = []
for line in template.splitlines():
    if line.startswith('(Füge hier ein Klassendiagramm mit den Klassenkarten App,'):
        out.append('Klassendiagramm Nr. 1\n\n[App]                 [Handy]                 [Benutzer]\n\nAlle Karten bestehen aus einem Namensbereich und einem leeren zweiten Bereich.\nFreier Zeichenraum zwischen den Klassenkarten; keine Beziehungen vorgegeben.')
    elif line.startswith('(Füge hier Tabellenausschnitte'):
        out.append(tables)
    elif line.startswith('(Füge direkt darunter'):
        out.append(diagram)
    elif line == '(Tabellenschema der Tabellen Appentwickler und App einfügen)':
        out.append(schema)
    elif line.startswith('(Appentwickler:'):
        pass
    elif line in ('(Hier Karo-Bereich zum Schreiben einfügen)', '(Karo-Muster hier einfügen)'):
        out.append('[Karofeld; Raster 5 mm]')
    else:
        points = {'1. Grundwissen:': 4, '2. Apps auf dem Handy': 9, '3. Berechtigungen und Apps': 10, '4. Appentwickler': 5}
        out.append(line + (f'    [____/{points[line]} BE]' if line in points else ''))
        if line.strip():
            expected.append(line)
        if line.startswith('c) Erkläre') or line.startswith('a) Korrigiere das abgebildete') or line.startswith('Beschreibe die Veränderungen') or line.startswith('c) Formuliere'):
            out.append('[Karofeld; Raster 5 mm]')
out.append('\nGesamt: [____/28 BE]')
text_version = '\n'.join(out).strip() + '\n'
text_version = text_version.replace('INFORMATIK · KLASSE 10\nKURZARBEIT\nDatenbanken', 'Kurzarbeit Informatik -- Datenbanken\nKlasse 10    Datum: __________    Name: __________________')
(root / (stem + '.txt')).write_text(text_version, encoding='utf-8')

def normalize(s):
    s = unicodedata.normalize('NFKC', s).replace('\u00ad', '')
    # Zeilentrennung und Trennstriche des deutschen Satzes entfernen.
    s = re.sub(r'-\s*\n\s*', '', s)
    s = re.sub(r'_{2,}', '', s)
    return re.sub(r'\s+', '', s)
versions = []
for folder in (root,):
    tex = (folder / (stem + '.tex')).read_text(encoding='utf-8')
    assert tex.count(r'\klassenkarte{') == 6
    assert r'\renewcommand{\familydefault}{\sfdefault}' in tex
    assert r'\definecolor{Sky}{HTML}{EAF3FA}' in tex
    assert tex.count(r'\rowcolor{Sky}') == 3
    assert r'\draw[Blue,line width=.7pt] ([yshift=2mm]#1.west)' in tex
    pdf = folder / 'build' / (stem + '.pdf')
    reader = PdfReader(pdf)
    assert len(reader.pages) == 3, f'Falsche Seitenzahl: {pdf}: {len(reader.pages)}'
    pages = [p.extract_text() for p in reader.pages]
    raw = '\n'.join(pages)
    (folder / 'build' / 'pdf-text.txt').write_text(raw, encoding='utf-8')
    normalized = normalize(raw)
    position = 0
    for text in expected:
        snippet = normalize(text)
        found = normalized.find(snippet, position)
        assert found >= 0, f'{folder}: Wortlaut/Reihenfolge abweichend: ' + text
        position = found + len(snippet)
    assert normalized.count('TabellenausschnitteNr.1') == 2
    assert normalized.count('KlassendiagrammNr.1') == 1
    assert normalized.count('KlassendiagrammNr.2') == 2
    assert 'Fortsetzung' not in normalized
    assert 'AppsaufdemHandy(Klassendiagramm)' not in normalized
    assert 'Fügehier' not in normalized and 'Karo-Musterhiereinfügen' not in normalized
    assert re.findall(r'\[/([0-9]+)BE\]', normalized) == ['4', '9', '10', '5', '28']
    assert 'Gesamt:[/28BE]' in normalized
    assert all(abs(float(p.mediabox.width) - 595.28) < 1 and abs(float(p.mediabox.height) - 841.89) < 1 for p in reader.pages)
    log = (folder / 'build' / (stem + '.log')).read_text(encoding='utf-8', errors='replace')
    assert 'Overfull' not in log
    versions.append({'ordner': str(folder.relative_to(root)), 'seiten': 3, 'BE': [4,9,10,5], 'gesamt_BE': 28, 'wortlaut_und_reihenfolge': 'bestanden', 'beschriftungen': 'bestanden', 'latex_overfull': False})

db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE Apps (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE Berechtigung (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE Berechtigungen_von_Apps (
app_id INT REFERENCES Apps(id), berechtigung_id INT REFERENCES Berechtigung(id),
PRIMARY KEY (app_id, berechtigung_id));
INSERT INTO Apps VALUES (1, 'WhatsApp'), (2, 'TikTok'), (3, 'Instagram');
INSERT INTO Berechtigung VALUES (1, 'Kamera'), (2, 'Standort'), (3, 'Fotos lesen');
INSERT INTO Berechtigungen_von_Apps VALUES (1,1), (1,3), (2,1), (3,2), (3,3);
''')
query = '''SELECT Apps.name, Berechtigung.name
FROM Apps, Berechtigung, Berechtigungen_von_Apps
WHERE Apps.id = Berechtigungen_von_Apps.app_id
AND Berechtigung.id = Berechtigungen_von_Apps.berechtigung_id'''
before = db.execute(query).fetchall()
assert before == [('WhatsApp', 'Kamera'), ('WhatsApp', 'Fotos lesen'), ('TikTok', 'Kamera'), ('Instagram', 'Standort'), ('Instagram', 'Fotos lesen')]
assert not db.execute('SELECT * FROM Berechtigungen_von_Apps WHERE app_id=1 AND berechtigung_id=2').fetchall()
db.execute('INSERT INTO Berechtigungen_von_Apps VALUES (1,2)')
after = db.execute(query).fetchall()
assert len(after) == 6 and ('WhatsApp', 'Standort') in after
assert db.execute('PRAGMA foreign_key_check').fetchall() == []
db.executescript('''
CREATE TABLE Appentwickler (id INT PRIMARY KEY, name VARCHAR(255), gruendungsjahr INT);
CREATE TABLE App (id INT PRIMARY KEY, appentwickler_id INT, name VARCHAR(255), erscheinungsdatum DATE, kategorie VARCHAR(255));
INSERT INTO Appentwickler VALUES (1,'Meta',2004), (2,'ByteDance',2012), (3,'Neustart',2025);
INSERT INTO App VALUES (10,1,'WhatsApp','2009-01-01','Kommunikation'), (20,2,'TikTok','2016-01-01','Video'), (30,3,'Lernapp','2025-01-01','Bildung');
''')
assert db.execute('SELECT COUNT(*) FROM Appentwickler WHERE gruendungsjahr < 2025').fetchone() == (2,)
query4 = '''SELECT Appentwickler.name, App.name
FROM Appentwickler, App
WHERE App.appentwickler_id = Appentwickler.id;'''
assert db.execute(query4).fetchall() == [('Meta','WhatsApp'), ('ByteDance','TikTok'), ('Neustart','Lernapp')]
student_source = (root / (stem + '.tex')).read_text(encoding='utf-8')
solution_source = (root / (stem + '-loesungen.tex')).read_text(encoding='utf-8')
assert solution_source == student_source.replace('\\solutionfalse', '\\solutiontrue', 1)
assert r'\textbf{begründe} deine Entscheidung.' in student_source
assert r'\textbf{Begründe} deine Entscheidung.' in student_source
assert r'\vspace{4mm}\luecke{einem Attributwert}' in student_source
solution_reader = PdfReader(root / 'build' / (stem + '-loesungen.pdf'))
assert len(solution_reader.pages) == 3
solution_text = '\n'.join(p.extract_text() for p in solution_reader.pages)
(root / (stem + '-loesungen.txt')).write_text(solution_text + '\n', encoding='utf-8')
assert not re.search(r'\bJOIN\b', solution_text, re.I)
assert normalize(query + ';') in normalize(solution_text)
assert normalize(query4) in normalize(solution_text)
student_text = (root / 'build' / 'pdf-text.txt').read_text(encoding='utf-8')
for forbidden in ('Signal', 'gruendungsdatum', 'id ist jeweils der Primärschlüssel.', 'Die mittlere Klassenkarte bezeichnet', 'enthält hier nur das Gründungsjahr'):
    assert forbidden not in student_text
assert 'TikTok' in student_text and 'TikTok' in solution_text
assert 'Verwendete Abkürzungen: PS = Primärschlüssel, FS = Fremdschlüssel.' in student_text
for phrase in ('einem Attribut', 'einem Objekt', 'einer Klasse', 'einem Attributwert'):
    assert phrase in solution_text and phrase not in student_text
solution_log = (root / 'build' / (stem + '-loesungen.log')).read_text(encoding='utf-8', errors='replace')
assert 'Overfull' not in solution_log
import pdfplumber
with pdfplumber.open(root / 'build' / (stem + '.pdf')) as s, pdfplumber.open(root / 'build' / (stem + '-loesungen.pdf')) as l:
    # Hauptaufgaben stehen in beiden Fassungen an identischen Positionen.
    for page_i, title in ((0, 'Grundwissen:'), (0, 'Handy'), (1, 'Berechtigungen'), (2, 'Appentwickler')):
        hits_s = s.pages[page_i].search(title)
        hits_l = l.pages[page_i].search(title)
        assert hits_s and hits_l
        assert abs(hits_s[0]['top'] - hits_l[0]['top']) < .1
result = {'versionen': versions, 'wortlaut_abschnitte': len(expected), 'sql_ergebniszeilen_vor_freigabe': len(before), 'sql_ergebniszeilen_nach_freigabe': len(after)}
result.update({'loesungsseiten': 3, 'sql_ohne_join': True, 'sql_aufgabe4_geprueft': True, 'layoutgleichheit': True})
(root / 'build' / 'pruefergebnisse.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=True))
