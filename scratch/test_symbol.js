const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));

const s = EquationConverter._convertSymbols('\\rightarrow');
console.log("Converted symbol:", s, "char code:", s.charCodeAt(0).toString(16));
