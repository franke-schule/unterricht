"""Use the packaged PNG renderer with the PDF exported by native Word.

Windows has no bundled LibreOffice; native Word performs only the conversion
step. All page rasterization and output handling remains in render_docx.py.
"""
from pathlib import Path
import importlib.util, os, sys, tempfile

root = Path(__file__).resolve().parent.parent
temp_root = (root / 'build/word-render-tmp').resolve()
assert temp_root.is_relative_to(root.resolve())
temp_root.mkdir(exist_ok=True)
tempfile.tempdir = str(temp_root)
skill = Path('C:/Users/Franke/.codex/plugins/cache/openai-primary-runtime/documents/26.1025.11240/skills/documents')
poppler = Path('C:/Users/Franke/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
os.environ['PATH'] = str(poppler) + os.pathsep + os.environ['PATH']
spec = importlib.util.spec_from_file_location('render_docx', skill / 'render_docx.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
pdf = root / 'build/word-loesungen-pruefung.pdf'
assert pdf.is_file()
renderer.convert_to_pdf = lambda *args, **kwargs: (str(pdf), 'Native Word PDF export')
sys.argv = ['render_docx.py', str(root / 'Inf10-KA-Version2-loesungen.docx'), '--output_dir', str(root / 'build/word-render'), '--dpi', '120']
renderer.main()
