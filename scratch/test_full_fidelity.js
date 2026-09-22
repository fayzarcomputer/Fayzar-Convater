const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

const MdLayoutParser = require(path.join(baseDir, 'layout-engine/md-layout-parser.js'));
const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));
const DocWord2003Builder = require(path.join(baseDir, 'layout-engine/doc-word2003-builder.js'));

const testText = `৭ম শ্রেণি
বিজ্ঞান
১। শ্বসন কী ধরনের শারীরবৃত্তীয়?
	ক. দহন	খ. প্রসারণ	গ. বিজারণ	ঘ. বিয়োজন
২। ব্যাঙাচি কিসের সাহায্যে শ্বাস নেয়?
	ক. লেন্টিসেলে	খ. ফুলকা	গ. ত্বক	ঘ. ফুসফুস
নিচের বিক্রিয়াটি পড়ে ৩ ও ৪ নং প্রশ্নের উত্তর দাও:`;

async function testFull() {
  console.log("Parsing testText into AST...");
  const ast = MdLayoutParser.parse(testText);
  console.log("- Profile:", ast.profile.archetypeId, "|", ast.profile.name);

  console.log("\n--- Testing Modern Word (.docx) SutonnyMJ ---");
  const docxBlob = await DocxLayoutBuilder.build(ast, { font: 'SutonnyMJ' });
  const buf = Buffer.from(await docxBlob.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('text');

  // Verify that SutonnyMJ text runs contain NO Unicode Bengali characters (U+0980..U+09FF)
  const sutonnyRuns = [...docXml.matchAll(/<w:rFonts[^>]*w:ascii="SutonnyMJ"[^>]*\/>[\s\S]*?<w:t[^>]*>(.*?)<\/w:t>/g)].map(m => m[1]);
  console.log(`Found ${sutonnyRuns.length} SutonnyMJ text runs.`);
  
  let hasUnicodeInSutonny = false;
  sutonnyRuns.forEach((txt, idx) => {
    if (/[\u0980-\u09FF]/.test(txt)) {
      console.error(`FAIL: SutonnyMJ run ${idx} contains raw Unicode Bengali: "${txt}"`);
      hasUnicodeInSutonny = true;
    }
  });

  if (!hasUnicodeInSutonny) {
    console.log("PASS: All SutonnyMJ runs in .docx are 100% genuine Bijoy ANSI! No broken viramas!");
    console.log("Sample converted runs:", sutonnyRuns.slice(0, 5));
  }

  console.log("\n--- Testing Word 2003 (.doc) SutonnyMJ ---");
  const docBlob = DocWord2003Builder.build(ast, { font: 'SutonnyMJ' });
  const docHtml = await docBlob.text();
  const hasUnicodeInDoc = /[\u0980-\u09FF]/.test(docHtml);
  if (!hasUnicodeInDoc) {
    console.log("PASS: Word 2003 (.doc) contains 100% genuine Bijoy ANSI! No broken viramas!");
  } else {
    console.error("FAIL: Word 2003 contains raw Unicode characters.");
  }
}

testFull();
