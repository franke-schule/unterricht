from pathlib import Path
root=Path(__file__).resolve().parent.parent
stem='Inf10-KA-Version2'
source=(root/(stem+'.tex')).read_text(encoding='utf-8')
assert source.count(r'\solutionfalse')==1
(root/(stem+'-loesungen.tex')).write_text(source.replace(r'\solutionfalse',r'\solutiontrue',1),encoding='utf-8')
