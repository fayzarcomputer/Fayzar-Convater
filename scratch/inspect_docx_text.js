const path = require('path');
const fs = require('fs');

const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';
const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));
const MdLayoutParser = require(path.join(baseDir, 'layout-engine/md-layout-parser.js'));

const testText = `৭ম শ্রেণি
বিজ্ঞান
১। শ্বসন কী ধরনের শারীরবৃত্তীয়?
	ক. দহন	খ. প্রসারণ	গ. বিজারণ	ঘ. বিয়োজন
২। ব্যাঙাচি কিসের সাহায্যে শ্বাস নেয়?
	ক. লেন্টিসেলে	খ. ফুলকা	গ. ত্বক	ঘ. ফুসফুস
নিচের বিক্রিয়াটি পড়ে ৩ ও ৪ নং প্রশ্নের উত্তর দাও:`;

async function run() {
  const ast = MdLayoutParser.parse(testText);
  const docxBlob = await DocxLayoutBuilder.build(ast, { font: 'SutonnyMJ' });
  const buf = Buffer.from(await docxBlob.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('text');
  
  // Find all <w:t> tags
  const wtMatches = [...docXml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)].map(m => m[1]);
  console.log("All text in document.xml:");
  console.log(wtMatches);
}
run();
