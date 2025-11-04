import * as fs from 'fs';
import { parse } from './src/util/conllu';
import { conlluToTurtle, extractMetadata } from './src/util/ttl';

// Read the source file
const sourcePath = './src/turtle/source.conllu';
const targetPath = './src/turtle/output.ttl';

console.log('Reading source CONLL-U file...');
const conlluContent = fs.readFileSync(sourcePath, 'utf-8');

console.log('Parsing CONLL-U...');
const document = parse(conlluContent);

console.log('Extracting metadata...');
const metadata = extractMetadata(document);

console.log('Converting to Turtle format...');
const turtleContent = conlluToTurtle(document, metadata);

console.log('Writing output TTL file...');
fs.writeFileSync(targetPath, turtleContent, 'utf-8');

console.log('Conversion completed!');
console.log(`Output written to: ${targetPath}`);


