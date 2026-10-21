from pathlib import Path

root = Path(__file__).resolve().parent.parent
stem = 'kurzarbeit-informatik-klasse-10-datenbanken'
source = (root / (stem + '.tex')).read_text(encoding='utf-8')
assert source.count('\\solutionfalse') == 1
(root / (stem + '-loesungen.tex')).write_text(source.replace('\\solutionfalse', '\\solutiontrue', 1), encoding='utf-8')
print('Layoutgleiche Loesungsquelle erzeugt.')
