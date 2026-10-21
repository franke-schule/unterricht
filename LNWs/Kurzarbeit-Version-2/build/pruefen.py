from pathlib import Path
import re, json, hashlib, sqlite3, unicodedata
from pypdf import PdfReader
import pdfplumber

root = Path(__file__).resolve().parent.parent
original = root.parent / 'Design-SA-Vorlage'
stem = 'kurzarbeit-informatik-klasse-10-datenbanken'
def norm(text):
    text = unicodedata.normalize('NFKC',text).replace('\u00ad','')
    text = re.sub(r'-\s*\n\s*','',text)
    return re.sub(r'\s+','',text)

# Die komplette erste Fassung muss einschließlich aller Hilfsdateien unangetastet sein.
snapshot = json.loads((root/'build/bestand-version-1.json').read_text(encoding='utf-8'))
current = {str(p.relative_to(original)):hashlib.sha256(p.read_bytes()).hexdigest() for p in original.rglob('*') if p.is_file()}
assert snapshot == current, 'Dateien der ersten Fassung wurden verändert.'
source = (root/(stem+'.tex')).read_text(encoding='utf-8')
solution = (root/(stem+'-loesungen.tex')).read_text(encoding='utf-8')
assert solution == source.replace('\\solutionfalse','\\solutiontrue',1)
assert source.count(r'\klassenkarte{') == 5
texts = {}
for suffix in ('','-loesungen'):
    name = stem + suffix
    reader = PdfReader(root/'build'/(name+'.pdf'))
    assert len(reader.pages)==3
    assert all(abs(float(p.mediabox.width)-595.28)<1 and abs(float(p.mediabox.height)-841.89)<1 for p in reader.pages)
    pages = [p.extract_text() for p in reader.pages]
    raw = '\n'.join(pages)
    texts[suffix] = raw
    text = norm(raw)
    assert re.findall(r'\[/([0-9]+)BE\]',text) == ['4','9','7','5','25']
    assert 'Gesamt:[/25BE]' in text
    assert 'KlassendiagrammNr.2' in norm(pages[1])
    assert 'Berechtigungen-von-Apps' not in pages[1]
    assert 'FehlerindiesemKlassendiagramm' not in text
    assert 'a)WhatsApp' in norm(pages[1]) and 'b)Formuliere' in norm(pages[1])
    assert 'c)Formuliere' not in norm(pages[1])
    original_reader = PdfReader(original/(name+'.pdf'))
    assert norm(pages[0]) == norm(original_reader.pages[0].extract_text())
    assert 'Overfull' not in (root/'build'/(name+'.log')).read_text(encoding='utf-8',errors='replace')
    (root/(name+'.txt')).write_text(raw+'\n',encoding='utf-8')

p3 = norm(PdfReader(root/'build'/(stem+'.pdf')).pages[2].extract_text())
wording = 'In den Tabellenschemata Apps, Appentwickler bzw. Zuordnung-Apps-Appentwickler haben sich Fehler eingeschlichen. Korrigiere den Fehler oder die Fehler. Du kannst direkt in das Tabellenschema hineinschreiben und Falsches durchstreichen, wenn notwendig. Begründe deine Änderungen.'
assert norm(wording) in p3
app_position = p3.index('App(id:')
a_position = p3.index('a)Beschreibe')
developer_position = p3.index('Appentwickler(id:')
assignment_position = p3.index('Zuordnung-Apps-Appentwickler(')
b_position = p3.index('b)IndenTabellenschemata')
c_position = p3.index('c)Korrigiere')
assert app_position < a_position < developer_position < assignment_position < b_position < c_position
assert 'appentwickler_id' not in p3[app_position:a_position]
assert 'app_id:int[FS' in p3 and 'appentwickler_id:int[FS' in p3
assert 'JedeAppwirdindiesemSzenariovongenau einemAppentwickler'.replace(' ','') in p3
assert not re.search(r'\bJOIN\b',texts['-loesungen'],re.I)

# Beide SQL-Lösungen mit den Beispieldaten ausführen.
db = sqlite3.connect(':memory:')
db.executescript('''
PRAGMA foreign_keys=ON;
CREATE TABLE Apps (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE Berechtigung (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE Berechtigungen_von_Apps (app_id INT REFERENCES Apps(id), berechtigung_id INT REFERENCES Berechtigung(id), PRIMARY KEY(app_id,berechtigung_id));
INSERT INTO Apps VALUES (1,'WhatsApp'),(2,'TikTok'),(3,'Instagram');
INSERT INTO Berechtigung VALUES (1,'Kamera'),(2,'Standort'),(3,'Fotos lesen');
INSERT INTO Berechtigungen_von_Apps VALUES (1,1),(1,3),(2,1),(3,2),(3,3);
CREATE TABLE Appentwickler (id INT PRIMARY KEY, name VARCHAR(255), gruendungsjahr INT);
CREATE TABLE App (id INT PRIMARY KEY, appentwickler_id INT REFERENCES Appentwickler(id), name VARCHAR(255), erscheinungsdatum DATE, kategorie VARCHAR(255));
INSERT INTO Appentwickler VALUES (1,'Meta',2004),(2,'ByteDance',2012),(3,'Neustart',2025);
INSERT INTO App VALUES (10,1,'WhatsApp','2009-01-01','Kommunikation'),(20,2,'TikTok','2016-01-01','Video'),(30,3,'Lernapp','2025-01-01','Bildung'),(40,1,'Instagram','2010-01-01','Foto');
''')
query3 = '''SELECT Apps.name, Berechtigung.name
FROM Apps, Berechtigung, Berechtigungen_von_Apps
WHERE Apps.id = Berechtigungen_von_Apps.app_id
AND Berechtigung.id = Berechtigungen_von_Apps.berechtigung_id;'''
assert len(db.execute(query3).fetchall()) == 5
db.execute('INSERT INTO Berechtigungen_von_Apps VALUES (1,2)')
assert len(db.execute(query3).fetchall()) == 6
query4 = '''SELECT Appentwickler.name, App.name
FROM Appentwickler, App
WHERE App.appentwickler_id = Appentwickler.id;'''
assert db.execute(query4).fetchall() == [('Meta','WhatsApp'),('ByteDance','TikTok'),('Neustart','Lernapp'),('Meta','Instagram')]
assert db.execute('SELECT COUNT(*) FROM Appentwickler WHERE gruendungsjahr < 2025').fetchone() == (2,)
assert norm(query3) in norm(texts['-loesungen'])
assert norm(query4) in norm(texts['-loesungen'])
assert db.execute('PRAGMA foreign_key_check').fetchall() == []

with pdfplumber.open(root/'build'/(stem+'.pdf')) as s, pdfplumber.open(root/'build'/(stem+'-loesungen.pdf')) as l:
    for i,title in ((0,'Grundwissen:'),(0,'Handy'),(1,'Berechtigungen'),(2,'Appentwickler'),(2,r'b\) In den'),(2,r'c\) Korrigiere')):
        a=s.pages[i].search(title); b=l.pages[i].search(title)
        assert a and b and abs(a[0]['top']-b[0]['top']) < .1,(i,title,a,b)
results = {'seiten_schueler':3,'seiten_loesungen':3,'BE':[4,9,7,5],'gesamt_BE':25,'erste_version_unveraendert':True,'urspruengliche_dateien_geprueft':len(current),'aufgabenfolge_und_schemata':True,'sql_ohne_join':True,'sql_ausgefuehrt':True,'layoutgleichheit':True,'latex_overfull':False}
(root/'build/pruefergebnisse.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(results,ensure_ascii=True))
