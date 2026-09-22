const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;

const sample1 = 'ক. $CO_2$ খ. $NO_2$ গ. $O_2$ ঘ. কোনটিই নয়';
const sample2 = 'কার্বন ডাইঅক্সাইড + পানি $ \\rightarrow ($ আলো $) $ গ্লুকোজ + অক্সিজেন';

console.log("=== Split Text and Math Sample 1 ===");
const segs1 = EquationConverter.splitTextAndMath(sample1);
console.log(segs1);

console.log("\n=== Split Text and Math Sample 2 ===");
const segs2 = EquationConverter.splitTextAndMath(sample2);
console.log(segs2);

console.log("\n=== LaTeX to OMML for CO_2 ===");
console.log(EquationConverter.latexToOmml('CO_2', false));

console.log("\n=== LaTeX to EqField for CO_2 ===");
console.log(EquationConverter.latexToEqField('CO_2', true));
