const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

const MdLayoutParser = require(path.join(baseDir, 'layout-engine/md-layout-parser.js'));
const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));

const sample = `১। ব্রঙ্কাইটিস কিসের সাহায্যে শ্বাস গ্রহণ হয়?
২। কার্বন ডাইঅক্সাইড + পানি $ \\rightarrow ($ আলো $) $ গ্লুকোজ + অক্সিজেন
৩। ক. $CO_2$ খ. $NO_2$ গ. $O_2$ ঘ. কোনটিই নয়`;

console.log("Parsing sample...");
const ast = MdLayoutParser.parse(sample);
console.log("Blocks:", ast.blocks.length);
ast.blocks.forEach((b, i) => console.log(`Block ${i}:`, b.type, b.number || '', b.text));
