from pathlib import Path
import hashlib, json, re, unicodedata
import pdfplumber

root = Path(__file__).resolve().parent.parent
old = root.parent / 'Inf10-KA-Version1'
stem = 'Inf10-KA-Version2'
source = (root / (stem + '.tex')).read_text(encoding='utf-8')
assert (root / (stem + '-loesungen.tex')).read_text(encoding='utf-8') == source.replace(r'\solutionfalse', r'\solutiontrue', 1)

# Compare the complete task source with Version 1; only the first writing
# fields are extended and the former notes page and repeated heads removed.
previous = (old / 'Inf10-KA-Version1.tex').read_text(encoding='utf-8')
previous = previous.split(r'\begin{document}', 1)[1].replace('\\kopf\n', '').lstrip('\n')
previous = previous.replace('\\newpage\n\\sectiontitle{Für Notizen}\n\\gridfield{238mm}{}\n', '')
previous = previous.replace(r'\gridfield{58mm}', r'\gridfield{70mm}', 1).replace(r'\gridfield{38mm}', r'\gridfield{45mm}', 1)
current = source.split('\\begin{document}\n\\kopf\n\\newpage\n', 1)[1]
assert current == previous, 'Unbeabsichtigte Aufgabenänderung'
hashes = json.loads((root / 'build/version1-hashes.json').read_text(encoding='utf-8'))
assert hashes == {str(p.relative_to(old)): hashlib.sha256(p.read_bytes()).hexdigest() for p in old.rglob('*') if p.is_file()}, 'Version 1 verändert'

def norm(text):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text).replace('\u00ad', ''))

for suffix in ('', '-loesungen'):
    name = stem + suffix
    with pdfplumber.open(root / 'build' / (name + '.pdf')) as doc:
        assert len(doc.pages) == 4
        pages = [page.extract_text() for page in doc.pages]
        cover = doc.pages[0]
        expected = ('Musterlösung' if suffix else 'Kurzarbeit') + ' Informatik – Datenbanken Klasse 10 Datum: Name:'
        assert norm(pages[0]).replace('--', '–') == norm(expected), repr(pages[0])
        assert not cover.rects and not cover.images
        assert max(c['size'] for c in cover.chars) > 21
        for word in ('Klasse', 'Datum:', 'Name:'):
            found = cover.search(re.escape(word))[0]
            chars = [c for c in cover.chars if found['top'] - .1 <= c['top'] <= found['bottom']]
            assert all(c['size'] > 13 for c in chars)
        assert norm(pages[1]).startswith('1.Grundwissen:')
        assert '2.AppsaufdemHandy' in norm(pages[1])
        assert norm(pages[2]).startswith('3.BerechtigungenundApps')
        assert norm(pages[3]).startswith('c)Korrigiere')
        assert '4.Appentwickler' in norm(pages[3])
        assert 'FürNotizen' not in norm(''.join(pages))
        assert re.findall(r'\[/([0-9]+)BE\]', norm(''.join(pages))) == ['4', '9', '10', '5', '28']
        assert not re.search(r'\bJOIN\b', '\n'.join(pages), re.I)
        (root / (name + '.txt')).write_text('\n'.join(pages) + '\n', encoding='utf-8')
    log = (root / 'build' / (name + '.log')).read_text(encoding='utf-8', errors='replace')
    assert 'Overfull' not in log

with pdfplumber.open(root / 'build' / (stem + '.pdf')) as student, pdfplumber.open(root / 'build' / (stem + '-loesungen.pdf')) as solution:
    for i, phrases in ((1, ('Grundwissen:', 'Apps auf dem Handy', 'c) Erkläre')), (2, ('Berechtigungen und Apps', 'WhatsApp fragt', 'Klassendiagramm Nr. 2', 'Skizziere die korrigierte Version')), (3, ('c) Korrigiere', 'Appentwickler', 'Formuliere eine SQL-Anweisung'))):
        for phrase in phrases:
            pattern = re.escape(phrase).replace(r'\ ', r'\s*')
            a = student.pages[i].search(pattern)
            b = solution.pages[i].search(pattern)
            assert a and b and abs(a[0]['top'] - b[0]['top']) < .1, (i, phrase)

result = {'fassung': stem, 'seiten': 4, 'deckblatt': 1, 'aufgabenbeginn': 2, 'notizseite': False, 'kopf_schrift_pt': {'titel': 22, 'daten': 14}, 'schreibfelder_mm': {'2b': 70, '2c': 45, '3a': 50, '3b': 55, '4a': 45, '4b': 60}, 'BE': [4, 9, 10, 5], 'gesamt_BE': 28, 'aufgabeninhalt_unveraendert': True, 'version1_unveraendert': True, 'layoutgleich': True, 'keine_ueberlaeufe': True}
(root / 'build/pruefergebnisse.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=True))
