const path = require('path');
const fs = require('fs');

const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';
const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));
const MdLayoutParser = require(path.join(baseDir, 'layout-engine/md-layout-parser.js'));
const DocxToDocConverter = require(path.join(baseDir, 'docx-to-doc-engine.js'));

const testText = `৭ম শ্রেণি
বিজ্ঞান
১। শ্বসন কী ধরনের শারীরবৃত্তীয়?
	ক. দহন	খ. প্রসারণ	গ. বিজারণ	ঘ. বিয়োজন
২। ব্যাঙাচি কিসের সাহায্যে শ্বাস নেয়?
	ক. লেন্টিসেলে	খ. ফুলকা	গ. ত্বক	ঘ. ফুসফুস
নিচের বিক্রিয়াটি পড়ে ৩ ও ৪ নং প্রশ্নের উত্তর দাও:`;

async function run() {
  const ast = MdLayoutParser.parse(testText);
  console.log("Building DOCX with SutonnyMJ...");
  const docxBlob = await DocxLayoutBuilder.build(ast, { font: 'SutonnyMJ' });

  // Inspect document.xml from inside docxBlob
  const zip = await JSZip.loadAsync(docxBlob);
  const docXml = await zip.file('word/document.xml').async('text');
  console.log("\n--- word/document.xml snippet ---");
  console.log(docXml.substring(0, 1000));

  console.log("\n--- Running DocxToDocConverter ---");
  const docxConverter = new DocxToDocConverter();
  const docResult = await docxConverter.convertDocxToDoc(docxBlob, {
    preserveSutonny: true,
    optimizeForQuestionPaper: true
  });
  console.log("Doc conversion result:", !!docResult.blob || !!docResult.convertedBlob);
  
  // Save RTF/DOC text to inspect
  const rtfText = docResult.rtfContent || (docResult.blob && docResult.blob.toString());
  if (rtfText) {
    fs.writeFileSync('scratch/output_test.doc', rtfText);
    console.log("RTF snippet (first 1000 chars):");
    console.log(rtfText.substring(0, 1000));
  }
}
run();
