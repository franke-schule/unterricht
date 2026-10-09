import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'C:/Users/ffran/Documents/git/unterricht';
const skillDir = 'C:/Users/ffran/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations';
const buildDir = path.join(workspaceDir, 'tmp/presentation-stromstaerke');
const finalPath = path.join(workspaceDir, 'faecher/physik/klasse-8/1-El-Strom/wiederholung-stromstaerke.pptx');
const image1Path = 'C:/Users/ffran/AppData/Local/Temp/codex-clipboard-2e7b863d-7fe9-497a-acdf-28c304c101aa.png';
const image2Path = 'C:/Users/ffran/AppData/Local/Temp/codex-clipboard-90222ac1-bcd4-4569-81b8-4d99515637fd.png';
process.env.RUNTIME_NODE = 'C:/Users/ffran/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe';
process.env.RUNTIME_NODE_MODULES = 'C:/Users/ffran/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
process.env.RUNTIME_BIN_DIR = 'C:/Users/ffran/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override';
process.env.RUNTIME_PYTHON = 'C:/Users/ffran/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href);

await fs.mkdir(buildDir, { recursive: true });
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const color = { ink: '#17324D', accent: '#087E8B', muted: '#4A6578', white: '#FFFFFF' };
const font = 'Arial';

function addText(slide, value, position, size, options = {}) {
  const box = slide.shapes.add({
    geometry: 'textbox',
    position,
    fill: 'none',
    line: { fill: 'none', width: 0 },
  });
  box.text = value;
  box.text.style = {
    typeface: font,
    fontSize: size,
    bold: Boolean(options.bold),
    color: options.color ?? color.ink,
    autoFit: 'none',
  };
  return box;
}

function questionSlide(number, title, notes) {
  const slide = presentation.slides.add();
  slide.background.fill = color.white;
  addText(slide, title, { left: 70, top: 48, width: 1100, height: 76 }, 44, { bold: true });
  addText(slide, `${number} / 4`, { left: 1140, top: 58, width: 90, height: 40 }, 20, { color: color.muted });
  slide.speakerNotes.textFrame.setText(notes);
  return slide;
}

const slide1 = questionSlide(1, 'Wasserstromstärke',
  'Mögliche Antwort: In beiden Situationen passieren in jeder Sekunde 5 Liter Wasser eine betrachtete Stelle. Die Wasserstromstärke ist also gleich, obwohl Ort und Weg des Wassers verschieden sind. Bildquelle: vom Nutzer bereitgestellte Abbildung.');
addText(slide1,
  'Im Abfluss und am Feuerwehrschlauch fließen jeweils 5 l in 1 s. Was ist gleich?',
  { left: 76, top: 150, width: 1110, height: 135 }, 34);
slide1.images.add({
  blob: new Uint8Array(await fs.readFile(image1Path)),
  contentType: 'image/png',
  alt: 'Abfluss und Feuerwehrschlauch, beide mit der Angabe 5 Liter je Sekunde',
  fit: 'contain',
  position: { left: 82, top: 320, width: 1116, height: 270 },
});

const slide2 = questionSlide(2, 'Stromstärke in drei Kontexten',
  'Mögliche Antwort: Die grünen Markierungen zeigen jeweils eine gedachte feste Stelle. Dort wird betrachtet, wie viele Schülerinnen und Schüler oder Elektronen beziehungsweise wie viel Wasser in derselben Zeit vorbeikommen. Bildquelle: vom Nutzer bereitgestellte Tafelnotiz.');
slide2.images.add({
  blob: new Uint8Array(await fs.readFile(image2Path)),
  contentType: 'image/png',
  alt: 'Handschriftliche Skizze zu Schülerstromstärke, elektrischer Stromstärke und Wasserstromstärke mit markierten Stellen',
  fit: 'contain',
  position: { left: 52, top: 148, width: 628, height: 486 },
});
addText(slide2,
  'Was zeigen die markierten Stellen? Erkläre es für Menschen, Elektronen und Wasser.',
  { left: 740, top: 212, width: 475, height: 315 }, 34);

const slide3 = questionSlide(3, 'Schülerstromstärke',
  'Lösung: Tür A: 12 Personen in 3 Sekunden, also 4 Personen pro Sekunde. Tür B: 10 Personen in 2 Sekunden, also 5 Personen pro Sekunde. An Tür B ist die Schülerstromstärke größer. Entscheidend ist die Anzahl pro gleicher Zeit, nicht die Gesamtzahl.');
addText(slide3, 'Wo ist die Schülerstromstärke größer? Begründe.',
  { left: 76, top: 158, width: 1115, height: 95 }, 37);
addText(slide3, 'Tür A: 12 Personen in 3 s',
  { left: 92, top: 323, width: 1080, height: 76 }, 42, { color: color.accent });
addText(slide3, 'Tür B: 10 Personen in 2 s',
  { left: 92, top: 440, width: 1080, height: 76 }, 42, { color: color.accent });

const slide4 = questionSlide(4, 'Die gemeinsame Idee',
  'Mögliche Antwort: Eine Stromstärke ist größer, wenn in derselben Zeit mehr durch eine feste Stelle fließt. Bei der Schülerstromstärke sind es mehr Menschen, bei der Wasserstromstärke mehr Wasser und bei der elektrischen Stromstärke mehr elektrische Ladung. Im vereinfachten Elektronenmodell: mehr Elektronen pro gleicher Zeit.');
addText(slide4, 'Ergänze den Satz für alle drei Beispiele:',
  { left: 76, top: 165, width: 1110, height: 85 }, 37);
addText(slide4, 'Eine Stromstärke ist größer, wenn in derselben Zeit ...',
  { left: 76, top: 312, width: 1110, height: 145 }, 43, { color: color.accent });
addText(slide4, 'Denke an Schülerinnen und Schüler, Elektronen und Wasser.',
  { left: 76, top: 502, width: 1100, height: 95 }, 29, { color: color.muted });

for (const [index, slide] of presentation.slides.items.entries()) {
  const preview = await presentation.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(path.join(buildDir, `slide-${index + 1}.png`), new Uint8Array(await preview.arrayBuffer()));
  const layout = await slide.export({ format: 'layout' });
  await fs.writeFile(path.join(buildDir, `slide-${index + 1}.layout.json`), await layout.text());
}

const stagingDir = path.join(buildDir, '.codex-finalizer');
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, 'candidate.pptx');
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: 'C:/Users/ffran/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  explicitTotalSlideCount: 4,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  fontPolicy: { basis: 'design', families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, 'validation.json'),
});
console.log(JSON.stringify(result, null, 2));
