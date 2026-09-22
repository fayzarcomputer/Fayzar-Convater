/**
 * Automated Verification for Fayzar Auto-Layout Engine
 */
const fs = require('fs');
const path = require('path');

// Mock browser window and global
const windowMock = {
  LAYOUT_TEMPLATES: {},
  MdLayoutParser: null,
  DocWord2003Builder: null,
  DocxLayoutBuilder: null,
  JSZip: require(path.join(__dirname, '../js/jszip.min.js'))
};
global.window = windowMock;
global.JSZip = windowMock.JSZip;

// Mock Blob
global.Blob = class Blob {
  constructor(chunks, options) {
    this.chunks = chunks;
    this.type = options?.type || '';
    this.size = chunks.reduce((acc, c) => acc + (c.length || c.byteLength || 0), 0);
  }
};

// 1. Load layout modules
const baseDir = path.join(__dirname, '../js/layout-engine');
eval(fs.readFileSync(path.join(baseDir, 'layout-templates.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'md-layout-parser.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'doc-word2003-builder.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'docx-layout-builder.js'), 'utf8'));

const MdLayoutParser = global.MdLayoutParser || windowMock.MdLayoutParser;
const DocWord2003Builder = global.DocWord2003Builder || windowMock.DocWord2003Builder;
const DocxLayoutBuilder = global.DocxLayoutBuilder || windowMock.DocxLayoutBuilder;

console.log("Module loading check:");
console.log("- MdLayoutParser:", !!MdLayoutParser);
console.log("- DocWord2003Builder:", !!DocWord2003Builder);
console.log("- DocxLayoutBuilder:", !!DocxLayoutBuilder);

// Sample realistic Bengali Question Paper input
const sampleMarkdown = `# ফুলবাড়ী সরকারি পাইলট উচ্চ বিদ্যালয়
## অর্ধ-বার্ষিক পরীক্ষা - ২০২৬
### বিষয়: বাংলা প্রথম পত্র (সৃজনশীল)
**সময়: ২ ঘণ্টা ৩০ মিনিট** | **পূর্ণমান: ৭০**
[বিশেষ দ্রষ্টব্য: ডানপাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপক।]

---

> অনুচ্ছেদ: ১৯৭১ সালে বাঙালি জাতি এক রক্তক্ষয়ী মুক্তিযুদ্ধের মাধ্যমে স্বাধীনতা অর্জন করে। লক্ষ প্রাণের আত্মত্যাগে এই লাল-সবুজের পতাকা অর্জিত হয়।

১। উদ্দীপকটি পড়ে নিচের প্রশ্নগুলোর উত্তর দাও:
(ক) মুক্তিযুদ্ধ জাদুঘর কোথায় অবস্থিত? [১]
(খ) স্বাধীনতা অর্জনে সাধারণ মানুষের ভূমিকা কী ছিল ব্যাখ্যা কর। [২]
(গ) উদ্দীপকের সাথে তোমার পাঠ্যবইয়ের কবিতার সাদৃশ্য আলোচনা কর। [৩]
(ঘ) 'বাঙালির আত্মত্যাগই আমাদের জাতীয় প্রেরণা'—উক্তিটি বিশ্লেষণ কর। [৪]

> অনুচ্ছেদ: রহিম সাহেব একজন সচেতন কৃষক। তিনি কীটনাশক পরিহার করে প্রাকৃতিক জৈব সার ব্যবহারের মাধ্যমে ফসলের ফলন বৃদ্ধি করেছেন।

২। উদ্দীপকটি পর্যালোচনা কর এবং উত্তর দাও:
(ক) জৈব সার তৈরিতে কী কী উপাদান ব্যবহার করা হয়? [১]
(খ) রাসায়নিক সারের অপকারিতা উল্লেখ কর। [২]
(গ) রহিম সাহেবের পদক্ষেপ পরিবেশের ওপর কী রূপ প্রভাব ফেলবে? [৩]
(ঘ) সামগ্রিক কৃষি অর্থনীতিতে এ ধরণের উদ্যোগের তাৎপর্য মূল্যায়ন কর। [৪]
`;

async function runTests() {
  console.log("\n--- Testing MdLayoutParser ---");
  const ast = MdLayoutParser.parse(sampleMarkdown, { layout: 'question-2col' });
  console.log("Parsed AST blocks count:", ast.blocks.length);
  
  const questionBlocks = ast.blocks.filter(b => b.type === 'question');
  console.log("Found question blocks:", questionBlocks.length);
  if (questionBlocks.length !== 2) throw new Error("Expected 2 question blocks!");
  
  const q1 = questionBlocks[0];
  console.log(`Q1: ${q1.number}। Sub-questions: ${q1.subQuestions.length}`);
  q1.subQuestions.forEach(sq => {
    console.log(`  ${sq.id} (Marks: ${sq.marks}) - ${sq.text}`);
  });
  if (q1.subQuestions.length !== 4) throw new Error("Expected 4 sub-questions for Q1!");
  if (q1.subQuestions[3].marks !== '৪') throw new Error("Expected mark [৪] for Q1(ঘ)!");

  console.log("\n--- Testing DocWord2003Builder (Word 2003 .doc) ---");
  const docBlob = DocWord2003Builder.build(ast, { font: 'SutonnyMJ' });
  console.log("Word 2003 .doc Blob generated, size:", docBlob.size, "bytes");
  if (docBlob.size < 5000) throw new Error("Word 2003 .doc blob too small!");

  console.log("\n--- Testing DocxLayoutBuilder (Modern Word .docx) ---");
  const docxBlob = await DocxLayoutBuilder.build(ast, { font: 'Kalpurush' });
  console.log("Modern Word .docx Blob generated, size:", docxBlob.size, "bytes");
  if (docxBlob.size < 2000) throw new Error("Modern Word .docx blob too small!");

  // Save generated files for physical inspection
  const outDir = path.join(__dirname, 'output_test');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const docBuffer = Buffer.concat(docBlob.chunks.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c)));
  fs.writeFileSync(path.join(outDir, 'test_question_paper_word2003.doc'), docBuffer);

  const docxBuffer = Buffer.concat(docxBlob.chunks.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c)));
  fs.writeFileSync(path.join(outDir, 'test_question_paper_modern.docx'), docxBuffer);

  console.log("\nFiles written successfully to output_test/:");
  console.log("- test_question_paper_word2003.doc:", fs.statSync(path.join(outDir, 'test_question_paper_word2003.doc')).size, "bytes");
  console.log("- test_question_paper_modern.docx:", fs.statSync(path.join(outDir, 'test_question_paper_modern.docx')).size, "bytes");

  console.log("\n>>> ALL AUTO-LAYOUT ENGINE VERIFICATIONS PASSED 100%! <<<");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
