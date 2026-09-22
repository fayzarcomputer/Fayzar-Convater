const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;

function formatMathForWord2003(text, cvt) {
  if (!text) return '';
  // Pre-replace LaTeX arrows
  let s = text.replace(/\\rightarrow\b|\\to\b/g, '→');

  if (typeof EquationConverter !== 'undefined' && /\$|\\frac|\\sqrt|\^|_/.test(s)) {
    const segments = EquationConverter.splitTextAndMath(s);
    let out = '';
    for (const seg of segments) {
      if (seg.type === 'math') {
        let mVal = seg.value.trim();
        // Clean arrows
        mVal = mVal.replace(/\\rightarrow\b|\\to\b/g, '→');
        // Subscripts: e.g. CO_2 -> CO<sub>2</sub>
        mVal = mVal.replace(/([a-zA-Z0-9]+)_\{?([0-9a-zA-Z]+)\}?/g, '$1<sub>$2</sub>');
        // Superscripts: e.g. x^2 -> x<sup>2</sup>
        mVal = mVal.replace(/([a-zA-Z0-9]+)\^\{?([0-9a-zA-Z]+)\}?/g, '$1<sup>$2</sup>');
        out += mVal;
      } else {
        out += cvt(seg.value);
      }
    }
    return out;
  }
  return cvt(s);
}

const sample7 = 'ক. $CO_2$ খ. $NO_2$ গ. $O_2$ ঘ. কোনটিই নয়';
const sample3 = 'কার্বন ডাইঅক্সাইড + পানি $ \\rightarrow ($ আলো $) $ গ্লুকোজ + অক্সিজেন';

console.log("=== Word 2003 HTML Output ===");
console.log("Sample 7:", formatMathForWord2003(sample7, BanglaConverter.unicodeToBijoy));
console.log("Sample 3:", formatMathForWord2003(sample3, BanglaConverter.unicodeToBijoy));
