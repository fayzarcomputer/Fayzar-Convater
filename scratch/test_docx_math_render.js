const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;
const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));

function renderSmartRunsWithMath(text, isBijoy, isBold = false, isItalic = false, sz = '22', isPureEnglish = false, extraRPr = '') {
  if (!text) return '';
  // Pre-clean arrows
  text = text.replace(/\\rightarrow\b|\\to\b/g, '→');

  if (typeof EquationConverter !== 'undefined' && /\$|\\frac|\\sqrt|\^|_/.test(text)) {
    const segments = EquationConverter.splitTextAndMath(text);
    let out = '';
    for (const seg of segments) {
      if (seg.type === 'math') {
        let mVal = seg.value.trim();
        // Check if simple chemical subscript like CO_2
        const subMatch = mVal.match(/^([a-zA-Z0-9]+)_\{?([0-9a-zA-Z]+)\}?$/);
        if (subMatch) {
          // Native Word text run with subscript
          const chemBase = subMatch[1];
          const chemSub = subMatch[2];
          out += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${chemBase}</w:t></w:r>`;
          out += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:vertAlign w:val="subscript"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${chemSub}</w:t></w:r>`;
        } else if (mVal === '→' || mVal.includes('→')) {
          out += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve"> ${mVal} </w:t></w:r>`;
        } else {
          // Complex math -> OMML
          const omml = EquationConverter.latexToOmml(mVal, isBijoy);
          out += omml;
        }
      } else {
        out += DocxLayoutBuilder.renderSmartRuns(seg.value, isBijoy, isBold, isItalic, sz, isPureEnglish, extraRPr);
      }
    }
    return out;
  }
  return DocxLayoutBuilder.renderSmartRuns(text, isBijoy, isBold, isItalic, sz, isPureEnglish, extraRPr);
}

const sample7 = 'ক. $CO_2$ খ. $NO_2$ গ. $O_2$ ঘ. কোনটিই নয়';
const res = renderSmartRunsWithMath(sample7, true);
console.log("=== DOCX Render XML ===");
console.log(res);
