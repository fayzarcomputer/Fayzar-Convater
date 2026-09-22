const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

// Let's test how DocxLayoutBuilder will assemble the document XML
// with Section 1 (CQ, 1-col), MCQ Header (1-col), and MCQ Body (2-col)

function testDocxSectionFlow() {
  const cqXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল</w:t></w:r></w:p>
<w:p><w:r><w:t>১. সৃজনশীল প্রশ্ন ১...</w:t></w:r></w:p>
<w:p><w:r><w:t>২. সৃজনশীল প্রশ্ন ২...</w:t></w:r></w:p>`;

  // Section break at end of CQ (defines CQ section properties: 1-col, next page)
  const cqSectPr = `<w:p>
  <w:pPr>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:num="1" w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:pPr>
</w:p>`;

  // MCQ Header (Full width, centered)
  const mcqHeaderXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল (বহুনির্বাচনি অভীক্ষা)</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>[বিশেষ দ্রষ্টব্য: ...]</w:t></w:r></w:p>`;

  // Continuous section break after MCQ header (defines MCQ header section properties: 1-col, continuous)
  const mcqHeaderSectPr = `<w:p>
  <w:pPr>
    <w:sectPr>
      <w:type w:val="continuous"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:num="1" w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:pPr>
</w:p>`;

  // MCQ Questions (2-column body)
  const mcqQuestionsXml = `<w:p><w:r><w:t>১। বহুনির্বাচনী প্রশ্ন ১...</w:t></w:r></w:p>
<w:p><w:r><w:t>২। বহুনির্বাচনী প্রশ্ন ২...</w:t></w:r></w:p>`;

  // Final section properties for MCQ body (2-columns)
  const finalSectPr = `<w:sectPr>
  <w:pgSz w:w="11906" w:h="16838"/>
  <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
  <w:cols w:num="2" w:space="432" w:sep="1" w:equalWidth="1"/>
  <w:docGrid w:linePitch="360"/>
</w:sectPr>`;

  const fullDocXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${cqXml}
    ${cqSectPr}
    ${mcqHeaderXml}
    ${mcqHeaderSectPr}
    ${mcqQuestionsXml}
    ${finalSectPr}
  </w:body>
</w:document>`;

  console.log("Full Doc XML generated successfully. Length:", fullDocXml.length);
}

testDocxSectionFlow();
