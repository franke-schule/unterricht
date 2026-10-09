import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const base = 'C:/Users/ffran/Documents/git/unterricht';
const pptx = path.join(base, 'faecher/physik/klasse-8/1-El-Strom/wiederholung-stromstaerke.pptx');
const output = path.join(base, 'tmp/presentation-stromstaerke');
const presentation = await PresentationFile.importPptx(await FileBlob.load(pptx));
for (const [index, slide] of presentation.slides.items.entries()) {
  const png = await presentation.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(path.join(output, `final-slide-${index + 1}.png`), new Uint8Array(await png.arrayBuffer()));
}
const snapshot = await presentation.inspect({ kind: 'slide,textbox,image,notes', maxChars: 20000 });
await fs.writeFile(path.join(output, 'final-inspect.ndjson'), snapshot.ndjson);
console.log(`Rendered ${presentation.slides.items.length} slides from the final PPTX.`);
