/**
 * Test Master-DOCX-First Pipeline with All 5 Advanced Recommendations (Zero Dependencies)
 */
const fs = require('fs');
const path = require('path');

// Mock browser window and global
const windowMock = {
  LAYOUT_TEMPLATES: {},
  MdLayoutParser: null,
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
  async arrayBuffer() {
    return Buffer.concat(this.chunks.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c)));
  }
};

// Load modules
const baseDir = path.join(__dirname, '../js');
eval(fs.readFileSync(path.join(baseDir, 'bangla-converter-engine.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'equation-converter.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'layout-engine/layout-templates.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'layout-engine/md-layout-parser.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'layout-engine/docx-layout-builder.js'), 'utf8'));

const MdLayoutParser = global.MdLayoutParser || windowMock.MdLayoutParser;
const DocxLayoutBuilder = global.DocxLayoutBuilder || windowMock.DocxLayoutBuilder;

console.log("Modules loaded:");
console.log("- MdLayoutParser:", !!MdLayoutParser);
console.log("- DocxLayoutBuilder:", !!DocxLayoutBuilder);

const sampleMarkdown = `# ফুলবাড়ী সরকারি পাইলট উচ্চ বিদ্যালয়
## প্রাক-নির্বাচনী পরীক্ষা - ২০২৬
### বিষয়: পদার্থবিজ্ঞান (সৃজনশীল)
**সময়: ২ ঘণ্টা ৩০ মিনিট** | **পূর্ণমান: ৫০**
[বিশেষ দ্রষ্টব্য: ডানপাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপক।]

---

> অনুচ্ছেদ: একটি বস্তু $20\\text{ m/s}$ আদিবেগে খাড়া উপরের দিকে নিক্ষেপ করা হলো। একই সাথে অপর একটি বস্তু $100\\text{ m}$ ওপর থেকে মুক্তভাবে নিচে পড়তে দেওয়া হলো। অভিকর্ষজ ত্বরণ $g = 9.8\\text{ m/s}^2$।

১। উদ্দীপকটি বিশ্লেষণ কর এবং উত্তর দাও:
(ক) পরম শূন্য তাপমাত্রা কাকে বলে? [১]
(খ) কোনো বস্তুর জড়তা বলতে কী বোঝায়? ব্যাখ্যা কর। [২]
(গ) প্রথম বস্তুটি কত সময় পর সর্বোচ্চ উচ্চতায় পৌঁছাবে নির্ণয় কর। [৩]
(ঘ) বস্তুদ্বয় ভূমি থেকে কত উচ্চতায় মিলিত হবে? গাণিতিকভাবে বিশ্লেষণ কর। [৪]

[ছবি আছে-পৃ:০১]

২। উদ্দীপকটি পড়ে প্রশ্নগুলোর উত্তর দাও:
(ক) রোধের একক কী? [১]
(খ) ওহমের সূত্রটি ব্যাখ্যা কর। [২]
(গ) বর্তনীর তুল্যরোধ $R_s = R_1 + R_2$ সমীকরণটি প্রতিপাদন কর। [৩]
(ঘ) বর্তনীতে ভোল্টেজ দ্বিগুণ করলে তড়িৎ প্রবাহের পরিবর্তন কিরূপ হবে? [৪]
`;

async function runTest() {
  console.log("\n[1] Parsing Markdown with MdLayoutParser...");
  const ast = MdLayoutParser.parse(sampleMarkdown, { layout: 'question-2col', pageSize: 'a4' });
  console.log("AST Blocks count:", ast.blocks.length);

  console.log("\n[2] Building Master Unicode DOCX (with Column Line, Right Tab Marks, Diagram Box)...");
  const masterDocxBlob = await DocxLayoutBuilder.build(ast, { font: 'Kalpurush' });
  console.log("Master Unicode DOCX size:", masterDocxBlob.size, "bytes");

  console.log("\n[3] Building Bijoy DOCX via DocxLayoutBuilder...");
  const bijoyDocxBlob = await DocxLayoutBuilder.build(ast, { font: 'SutonnyMJ' });
  console.log("Bijoy DOCX size:", bijoyDocxBlob.size, "bytes");

  // Save files to disk for physical inspection
  const outDir = path.join(__dirname, 'output_test');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const masterBuf = await masterDocxBlob.arrayBuffer();
  fs.writeFileSync(path.join(outDir, 'master_unicode.docx'), masterBuf);

  const bijoyBuf = await bijoyDocxBlob.arrayBuffer();
  fs.writeFileSync(path.join(outDir, 'master_bijoy.docx'), bijoyBuf);

  console.log("\nFiles successfully written to output_test/:");
  console.log("- master_unicode.docx:", fs.statSync(path.join(outDir, 'master_unicode.docx')).size, "bytes");
  console.log("- master_bijoy.docx:", fs.statSync(path.join(outDir, 'master_bijoy.docx')).size, "bytes");

  // Inspect XML inside master_unicode.docx to verify features
  const zip = await JSZip.loadAsync(masterBuf);
  const docXml = await zip.file('word/document.xml').async('string');

  console.log("\nFeature Verifications in master_unicode.docx XML:");
  const hasColSep = docXml.includes('w:sep="1"');
  console.log("Feature 1 - Column Separator Line (w:sep=\"1\"): ", hasColSep ? "PASS" : "FAIL");

  const hasRightTab = docXml.includes('<w:tab w:val="right"');
  console.log("Feature 2 - Right-Aligned Tab Stop: ", hasRightTab ? "PASS" : "FAIL");

  const hasAccentBorder = docXml.includes('w:color="1E3A8A"');
  console.log("Feature 3 - Stimulus Left-Accent Border: ", hasAccentBorder ? "PASS" : "FAIL");

  const hasDottedBox = docXml.includes('w:val="dashed"');
  console.log("Feature 4 - Figure Placeholder Dotted Box: ", hasDottedBox ? "PASS" : "FAIL");

  const hasTightSpacing = docXml.includes('w:line="240"');
  console.log("Feature 5 - Auto Page-Fit Micro-Typography: ", hasTightSpacing ? "PASS" : "FAIL");

  if (!hasColSep || !hasRightTab || !hasAccentBorder || !hasDottedBox || !hasTightSpacing) {
    throw new Error("One or more advanced features missing from DOCX XML!");
  }

  console.log("\n>>> ALL 5 ADVANCED RECOMMENDATIONS & MASTER-DOCX PIPELINE VERIFIED 100%! <<<");
}

runTest().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
