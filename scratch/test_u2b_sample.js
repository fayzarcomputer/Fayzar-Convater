const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';
const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));

const str = '১। শ্বসন কী ধরনের শারীরবৃত্তীয়?';
console.log("Original:", str);
console.log("Converted:", BanglaConverter.unicodeToBijoy(str));
