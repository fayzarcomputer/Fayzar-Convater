const fs = require('fs');
const path = require('path');

// Load modules
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';
const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

const MdLayoutParser = require(path.join(baseDir, 'layout-engine/md-layout-parser.js'));
const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));

const testText = `৭ম শ্রেণি
বিজ্ঞান
১। শ্বসন কী ধরনের শারীরবৃত্তীয়?
	ক. দহন	খ. প্রসারণ	গ. বিজারণ	ঘ. বিয়োজন
২। ব্যাঙাচি কিসের সাহায্যে শ্বাস নেয়?
	ক. লেন্টিসেলে	খ. ফুলকা	গ. ত্বক	ঘ. ফুসফুস
নিচের বিক্রিয়াটি পড়ে ৩ ও ৪ নং প্রশ্নের উত্তর দাও:`;

console.log("=== TEST 1: BanglaConverter.unicodeToBijoy ===");
const u2bResult = BanglaConverter.unicodeToBijoy(testText);
console.log("Direct U2B Result:\n", u2bResult);

console.log("\n=== TEST 2: DocxLayoutBuilder cvt ===");
console.log("DocxLayoutBuilder.cvt result:\n", DocxLayoutBuilder.cvt(testText, true));

console.log("\n=== TEST 3: AST blocks ===");
const ast = MdLayoutParser.parse(testText);
console.log("AST Profile:", ast.profile);
console.log("AST Blocks count:", ast.blocks.length);
ast.blocks.forEach((b, idx) => {
  console.log(`Block ${idx} [${b.type}]:`, JSON.stringify(b).substring(0, 100));
});

console.log("\n=== TEST 4: DocxLayoutBuilder.renderSmartRuns ===");
const runXml = DocxLayoutBuilder.renderSmartRuns("১। শ্বসন কী ধরনের শারীরবৃত্তীয়?", true);
console.log("RenderSmartRuns SutonnyMJ:\n", runXml);
