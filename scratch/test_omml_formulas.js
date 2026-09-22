const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

// Test LaTeX chemical formula conversion to OMML and HTML
const formulas = ['CO_2', 'NO_2', 'O_2', 'H_2O', '\\rightarrow'];

formulas.forEach(f => {
  console.log(`\nFormula: ${f}`);
  console.log("OMML:", EquationConverter.latexToOmml(f, false));
});
