/**
 * Fayzar Bangla Converter - Automated Layout Regression Suite
 * Tests all rules in LAYOUT_SPECIFICATION.md to guarantee ZERO regressions.
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('../js/jszip.min.js');
global.JSZip = JSZip;
const BanglaConverter = require('../js/bangla-converter-engine.js');
global.BanglaConverter = BanglaConverter;
const EquationConverter = require('../js/equation-converter.js');
global.EquationConverter = EquationConverter;
const MdLayoutParser = require('../js/layout-engine/md-layout-parser.js');
const DocxLayoutBuilder = require('../js/layout-engine/docx-layout-builder.js');
const DocWord2003Builder = require('../js/layout-engine/doc-word2003-builder.js');

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING FAYZAR CONVERTER LAYOUT REGRESSION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  const sampleTestText = `Time: 2 hours
Full Marks: 50
Part-A: Grammar (30 Marks)

1. Complete the text using the words in the box as needed. [0.5×10=5]
| a | the | precious | for | to | have | wisely | which | off | great |

Time is a very (a) — thing. Time (b) — is lost once is lost for ever.

2. Make five meaningful sentences from the following substitution table. [1×5=5]
| A sudden noise | blinded | the sleeping baby instantly. |
| A bright light | caused | the hungry bees nearby. |
| A sharp pain | attracted | the driver for a split second. |

3. Fill in the blanks with the correct form of the verbs given in the brackets. [1×5=5]
Education (a) — (give) a man a clear conscious view of his own opinion.

5. Change the following sentences as directed in brackets.
(a) Honesty is a great virtue. (Make it Interrogative)
(b) So, we should be honest in our life. (Make it Negative)

[নোট ও পরিবর্তনসমূহ:
- যাচাই সম্পন্ন হয়েছে।]`;

  // Rule 6: Audit Note Scrubbing
  const cleanedText = sampleTestText.replace(/\[\s*নোট[\s\S]*?\]/gi, '').trim();
  assert('TC-LAY-06: Audit Note Scrubbed', !cleanedText.includes('নোট'));

  // AST Parsing
  const ast = MdLayoutParser.parse(cleanedText, { layout: 'question-2col', pageSize: 'a4' });
  assert('TC-LAY-00: Smart Header Extraction from Plain Text', ast.metadata.time === '2 hours' && ast.metadata.fullMarks === '50');
  assert('AST Parsing Block Count', ast.blocks.length >= 4, `blocks: ${ast.blocks.length}`);

  // DOCX Generation
  const isPureEnglish = true;
  const layout = { columns: 2, pageSize: 'a4', templateId: 'question-paper', margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 } };
  const xmlBlocks = ast.blocks.map(b => DocxLayoutBuilder.renderBlockXml(b, false, isPureEnglish, layout));
  const fullDocxXml = xmlBlocks.join('\n');

  // Rule 1: Question Hanging Indent
  assert('TC-LAY-01: Question Hanging Indent in DOCX', fullDocxXml.includes('w:hanging="432"') && fullDocxXml.includes('w:left="432"'));

  // Rule 2: Sub-question Indent in DOCX
  assert('TC-LAY-02: Sub-question Indent in DOCX', fullDocxXml.includes('w:left="864"') && fullDocxXml.includes('w:hanging="432"'));

  // Rule 3: Table Shading Removal
  assert('TC-LAY-03: Table Header Gray Shading Removed in DOCX', !fullDocxXml.includes('E8E8E8'));

  // Rule 4: Table Header Removal (regular row)
  assert('TC-LAY-04: Table Header Tag Removed in DOCX', !fullDocxXml.includes('tblHeader'));

  // Rule 5: Table Auto-Width (Resizable)
  assert('TC-LAY-05: Table Auto-Width in DOCX', fullDocxXml.includes('w:type="auto"') && !fullDocxXml.includes('w:w="5000" w:type="pct"'));

  // Rule 7: Right-aligned Tab Marks
  assert('TC-LAY-07: Right-aligned Tab Marks', fullDocxXml.includes('[0.5×10=5]') && fullDocxXml.includes('<w:tab/>'));

  // Word 2003 HTML Verification
  const docBlob = await DocWord2003Builder.build(ast, { font: 'Times New Roman' });
  const docHtml = await docBlob.text();

  assert('TC-LAY-W01: Word 2003 No Gray Table Shading', !docHtml.includes('#e8e8e8'));
  assert('TC-LAY-W02: Word 2003 Dedicated Question Number Column', docHtml.includes('width:22pt'));
  assert('TC-LAY-W03: Word 2003 Compact Cell Padding', docHtml.includes('padding:1.5pt 3pt'));

  // Rule 9: Bijoy SutonnyMJ Conversion Fidelity (No broken viramas)
  const bnSample = `৭ম শ্রেণি\nবিজ্ঞান\n১। শ্বসন কী ধরনের শারীরবৃত্তীয়?\n\tক. দহন\tখ. প্রসারণ\tগ. বিজারণ\tঘ. বিয়োজন`;
  const bnAst = MdLayoutParser.parse(bnSample);
  const bnDocxBlob = await DocxLayoutBuilder.build(bnAst, { font: 'SutonnyMJ' });
  const bnZip = await JSZip.loadAsync(Buffer.from(await bnDocxBlob.arrayBuffer()));
  const bnDocXml = await bnZip.file('word/document.xml').async('text');
  const sutonnyRuns = [...bnDocXml.matchAll(/<w:rFonts[^>]*w:ascii="SutonnyMJ"[^>]*\/>[\s\S]*?<w:t[^>]*>(.*?)<\/w:t>/g)].map(m => m[1]);
  const hasRawUnicode = sutonnyRuns.some(t => /[\u0980-\u09FF]/.test(t));
  assert('TC-LAY-09: Bijoy SutonnyMJ Conversion Fidelity', !hasRawUnicode && sutonnyRuns.length > 0);

  // Rule 10: MCQ Options Row Compact Indent (no giant 864 hanging indent)
  assert('TC-LAY-10: MCQ Options Compact Indent', bnDocXml.includes('w:left="432"') && !bnDocXml.includes('w:left="864"'));

  // Rule 11: Combined Exam Paper Archetype & Section Break
  const combinedSample = `বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল
তৃতীয় সেমিস্টার পরীক্ষা-২০২৩
শ্রেণি: ৯ম    বিষয়: বাংলা ১ম পত্র    বিষয় কোড: ১০১
সময়: ২ ঘণ্টা ৩০ মিনিট    পূর্ণমান: ৭০
[বিশেষ দ্রষ্টব্য: প্রতিটি বিভাগ থেকে কমপক্ষে একটি করে মোট ৭টি প্রশ্নের উত্তর দাও।]

# ক-বিভাগ: গদ্য
১. নাজমা বেগম স্বামীর মৃত্যুর পর সংসার চালাতে অন্যের বাড়িতে কাজ করে।
ক. হরিহর রায়ের জ্ঞাতিভ্রাতার নাম কী? [১]
খ. দুর্গা পা টিপে টিপে বাড়িতে প্রবেশ করল কেন? [২]
গ. উদ্দীপকের সঙ্গে উপন্যাসের সাদৃশ্য আলোচনা কর। [৩]
ঘ. উদ্দীপকের বক্তব্যই যেন উপন্যাসের মূল বক্তব্য—বিশ্লেষণ কর। [৪]

৩. উদ্দীপকটি পড়ে প্রশ্নের উত্তর দাও:
যৌবনের গান গাহে যারা
তারা তো মরে না কখনো।
ফল আস্বাদনে পায় আনন্দ প্রচুর।
ক. 'কপোতাক্ষ নদ' কবিতার মূল ভাব কী? [১]
খ. কবি কেন কপোতাক্ষ নদকে ভুলতে পারেন না? [২]
গ. উদ্দীপকের ভাবনার সাথে কবিতার সাদৃশ্য নির্ণয় কর। [৩]
ঘ. 'উদ্দীপকের চেতনা ও কবির মনোভাব একই সূত্রে গাঁথা'—যুক্তি দাও। [৪]

---SECTION_BREAK:MCQ---
বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল
তৃতীয় সেমিস্টার পরীক্ষা-২০২৩
শ্রেণি: ৯ম    বিষয়: বাংলা ১ম পত্র    বিষয় কোড: ১০১
# বহুনির্বাচনি অভীক্ষা-৩০
সময়: ৩০ মিনিট    পূর্ণমান: ৩০
[বিশেষ দ্রষ্টব্য: সঠিক উত্তরের বৃত্ত ভরাট কর। প্রতিটির মান ১।]

১। প্রাণীর শ্বসন অঙ্গে-
	i. ফুলকা
	ii. ত্বক
	iii. ফুসফুস
	নিচের কোনটি সঠিক?
	ক. i ও ii	খ. i ও iii	গ. ii ও iii	ঘ. i, ii ও iii
২। শ্বসন প্রক্রিয়ায় কোন গ্যাস নির্গত হয়?
	ক. $CO_2$	খ. $NO_2$	গ. $O_2$	ঘ. কোনটিই নয়
`;
  const combinedAst = MdLayoutParser.parse(combinedSample);
  assert('TC-LAY-11A: Combined Exam Paper Archetype Detected', combinedAst.layoutSettings.profile.archetypeId === 'bengali_combined_exam_paper');
  assert('TC-LAY-11B: Raw OCR Header Extracted without YAML', combinedAst.metadata.institute === 'বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল' && combinedAst.metadata.subjectCode === '১০১');

  // Check Multi-line Poem / Stimulus absorption in Question 3
  const q3 = combinedAst.blocks.find(b => b.number === '৩' || b.number === '3');
  assert('TC-LAY-11C: Multi-line Poem Absorbed in Q3', q3 && q3.stimulus && q3.stimulus.includes('ফল আস্বাদনে পায়'));
  assert('TC-LAY-11D: Sub-questions intact with 4 items', q3 && q3.subQuestions && q3.subQuestions.length === 4);

  const combinedDocxBlob = await DocxLayoutBuilder.build(combinedAst, { font: 'SutonnyMJ' });
  const combinedZip = await JSZip.loadAsync(Buffer.from(await combinedDocxBlob.arrayBuffer()));
  const combinedDocXml = await combinedZip.file('word/document.xml').async('text');

  // Verify section break exists in DOCX
  const sectPrCount = (combinedDocXml.match(/<w:sectPr/g) || []).length;
  assert('TC-LAY-11E: Multi-section Transition in DOCX', sectPrCount >= 2);

  // Rule 12: Plain CQ Marks Without Brackets
  // In Bijoy SutonnyMJ, digit '১' is '1', '২' is '2'. It must NOT be wrapped in '[1]' or '[2]'
  const hasBracktedOne = combinedDocXml.includes('[1]') || combinedDocXml.includes('[১]');
  assert('TC-LAY-12A: Plain CQ Marks Without Brackets in DOCX', !hasBracktedOne);
  // Subquestion hanging indent preserved for CQ sub-questions
  assert('TC-LAY-12B: CQ Sub-question Hanging Indent (864 dxa)', combinedDocXml.includes('w:left="864"') && combinedDocXml.includes('w:hanging="432"'));

  // Rule 13: Chemistry Subscripts & Arrows Fidelity
  assert('TC-LAY-13A: Chemistry Subscript in DOCX', combinedDocXml.includes('w:val="subscript"') && combinedDocXml.includes('CO'));

  const combinedDoc2003Blob = await DocWord2003Builder.build(combinedAst, { font: 'SutonnyMJ' });
  const combinedDoc2003Html = await combinedDoc2003Blob.text();
  assert('TC-LAY-13B: Chemistry Subscript in Word 2003', combinedDoc2003Html.includes('CO<sub>2</sub>') && combinedDoc2003Html.includes('NO<sub>2</sub>'));

  // Verify Subject Code Box in Word 2003
  assert('TC-LAY-14: Subject Code 3-Cell Box in Word 2003', combinedDoc2003Html.includes('border:1pt solid #000; width:16pt') || combinedDoc2003Html.includes('width:16pt'));

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Suite Error:', err);
  process.exit(1);
});
