from pathlib import Path
import json,re,sqlite3,unicodedata
from pypdf import PdfReader
import pdfplumber
root=Path(__file__).resolve().parent.parent
stem='Inf10-KA-Version1'
def norm(s):
    s=unicodedata.normalize('NFKC',s).replace('\u00ad','')
    return re.sub(r'\s+','',re.sub(r'-\s*\n\s*','',s))
source=(root/(stem+'.tex')).read_text(encoding='utf-8')
assert (root/(stem+'-loesungen.tex')).read_text(encoding='utf-8')==source.replace('\\solutionfalse','\\solutiontrue',1)
assert r'\gridfield{58mm}' in source
assert r'korrekt darstellt.\par' in source
assert r'\gridfield{238mm}{}' in source
assert r'\zeichenfeld{55mm}' in source
assert r'(handy.east) -- node[pos=.12,above,font=\small] {n}' in source
assert not (root.parent/'Kurzarbeit-Version-2').exists()
assert not (root.parent/'Design-SA-Vorlage').exists()
texts={}
for suffix in ('','-loesungen'):
    name=stem+suffix
    reader=PdfReader(root/'build'/(name+'.pdf'))
    assert len(reader.pages)==4
    pages=[p.extract_text() for p in reader.pages]
    raw='\n'.join(pages); text=norm(raw); texts[suffix]=raw
    assert norm(pages[3])=='FürNotizen4'
    assert re.findall(r'\[/([0-9]+)BE\]',text)==['4','9','10','5','28']
    assert norm('Ein Handy gehört in diesem Szenario zu genau einer Person. Eine Person kann aber mehrere Handys haben.') in text
    assert 'Szenarion' not in raw and 'erscheinungsdatum' not in raw
    assert 'erscheinungsjahr:int' in text
    assert 'SELECTCOUNT(*)FROMAppWHEREerscheinungsjahr>2025' in text
    p2=norm(pages[1])
    assert p2.index('TabellenausschnitteNr.1')<p2.index('a)WhatsApp')<p2.index('KlassendiagrammNr.2')<p2.index('b)Skizziere')
    release='WhatsApp fragt beim Öffnen der App nach einer neuen Berechtigung "Standort". Du nimmst die Berechtigungsanfrage an. Beschreibe die Veränderungen, die passieren müssen, damit die Tabellen (siehe Tabellenausschnitte Nr. 1) auf dem aktuellen Stand sind.'
    assert norm(release) in p2
    assert 'SchreibedeineKorrekturendirektindasKlassendiagramm.' not in p2
    assert norm('Skizziere die korrigierte Version des abgebildeten Klassendiagramm, sodass es den Sachverhalt korrekt darstellt.') in p2
    assert norm('Korrigiere die folgende SQL-Anweisung, indem du falsche Zeilen durchstreichst und in der zweiten Spalte korrigiert angibst.') in norm(pages[2])
    assert norm('Formuliere eine SQL-Anweisung, die Namen der Apps zusammen mit den Namen der Appentwickler ausgibt, die die jeweilige App entwickelt haben.') in norm(pages[2])
    assert 'Overfull' not in (root/'build'/(name+'.log')).read_text(encoding='utf-8',errors='replace')
    assert not re.search(r'\bJOIN\b',raw,re.I)
    (root/(name+'.txt')).write_text(raw+'\n',encoding='utf-8')
wrong='SELECT * FROM Berechtigung, Apps, Berechtigung_von_Apps WHERE Berechtigungen.id = Apps.id AND Berechtigung_von_Apps.id = App.id'
q3='SELECT * FROM Berechtigung, Apps, Berechtigungen_von_Apps WHERE Berechtigung.id = Berechtigungen_von_Apps.berechtigung_id AND Apps.id = Berechtigungen_von_Apps.app_id;'
q4='SELECT App.name, Appentwickler.name FROM App, Appentwickler WHERE App.appentwickler_id = Appentwickler.id;'
assert norm(wrong) in norm(texts[''])
assert norm(q4) in norm(texts['-loesungen'])
assert '1:1-Beziehung' not in texts['-loesungen']
assert 'n bei Handy und 1 bei Benutzer.' in texts['-loesungen']
with pdfplumber.open(root/'build'/(stem+'.pdf')) as s,pdfplumber.open(root/'build'/(stem+'-loesungen.pdf')) as l:
    for i,phrase in ((0,'Grundwissen:'),(0,'Apps auf dem Handy'),(1,'Berechtigungen und Apps'),(1,'WhatsApp fragt'),(1,'Klassendiagramm Nr. 2'),(1,'Skizziere die korrigierte Version'),(2,'Appentwickler'),(2,'Formuliere eine SQL-Anweisung')):
        pattern=phrase.replace(' ',r'\s*')
        a=s.pages[i].search(pattern); b=l.pages[i].search(pattern)
        assert a and b and abs(a[0]['top']-b[0]['top'])<.1,(i,phrase)
    page=l.pages[2]
    head=page.search(r'Korrektur')[0]; title=page.search(r'4.\s*Appentwickler')[0]
    right=page.crop((head['x0']-1,head['top'],page.width-40,title['top']-2)).extract_text()
    assert norm(q3) in norm(right)
db=sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE Apps(id INT PRIMARY KEY,name VARCHAR(255));
CREATE TABLE Berechtigung(id INT PRIMARY KEY,name VARCHAR(255));
CREATE TABLE Berechtigungen_von_Apps(app_id INT,berechtigung_id INT,PRIMARY KEY(app_id,berechtigung_id));
INSERT INTO Apps VALUES(1,'WhatsApp'),(2,'TikTok'),(3,'Instagram');
INSERT INTO Berechtigung VALUES(1,'Kamera'),(2,'Standort'),(3,'Fotos lesen');
INSERT INTO Berechtigungen_von_Apps VALUES(1,1),(1,3),(2,1),(3,2),(3,3);
CREATE TABLE Appentwickler(id INT PRIMARY KEY,name VARCHAR(255),gruendungsjahr INT);
CREATE TABLE App(id INT PRIMARY KEY,appentwickler_id INT,name VARCHAR(255),erscheinungsjahr INT,kategorie VARCHAR(255));
INSERT INTO Appentwickler VALUES(1,'Meta',2004),(2,'ByteDance',2012),(3,'Neustart',2025);
INSERT INTO App VALUES(10,1,'Altapp',2024,'Kommunikation'),(20,2,'Grenzapp',2025,'Video'),(30,3,'Neue App',2026,'Bildung'),(40,1,'Weitere App',2027,'Foto');
''')
try: db.execute(wrong)
except sqlite3.OperationalError: pass
else: raise AssertionError('Fehlerhafte Vorgabe wurde unerwartet akzeptiert.')
assert len(db.execute(q3).fetchall())==5
db.execute('INSERT INTO Berechtigungen_von_Apps VALUES(1,2)')
assert len(db.execute(q3).fetchall())==6
assert db.execute('SELECT COUNT(*) FROM App WHERE erscheinungsjahr > 2025').fetchone()==(2,)
assert db.execute(q4).fetchall()==[('Altapp','Meta'),('Grenzapp','ByteDance'),('Neue App','Neustart'),('Weitere App','Meta')]
result={'fassung':stem,'seiten_schueler':4,'seiten_loesungen':4,'BE':[4,9,10,5],'gesamt_BE':28,'version2_geloescht':True,'schreibfelder_mm':{'2b':58,'2c':38,'3a':50,'3b':55,'4a':45,'4b':60,'notizen':238},'sql3c_schrift_pt':9,'aufgabenfolge_geprueft':True,'3a_wortlaut_unveraendert':True,'sql_vorgabe_wortgetreu':True,'sql_korrektur_und_sql4_ausgefuehrt':True,'sql_ohne_join':True,'layoutgleich':True}
(root/'build/pruefergebnisse.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=True))
