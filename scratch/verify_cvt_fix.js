const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';
const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;

function cvtFixed(str, isBijoy) {
  if (!str) return '';
  if (isBijoy) {
    if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.unicodeToBijoy === 'function') {
      return BanglaConverter.unicodeToBijoy(str);
    }
  }
  return str;
}

const testText = `৭ম শ্রেণি
বিজ্ঞান
১। শ্বসন কী ধরনের শারীরবৃত্তীয়?
	ক. দহন	খ. প্রসারণ	গ. বিজারণ	ঘ. বিয়োজন
২। ব্যাঙাচি কিসের সাহায্যে শ্বাস নেয়?
	ক. লেন্টিসেলে	খ. ফুলকা	গ. ত্বক	ঘ. ফুসফুস
নিচের বিক্রিয়াটি পড়ে ৩ ও ৪ নং প্রশ্নের উত্তর দাও:`;

const converted = cvtFixed(testText, true);
console.log("Converted Bijoy Text:\n", converted);
// Check if converted has any unicode bangla
const hasUnicode = /[\u0980-\u09FF]/.test(converted);
console.log("Has remaining Unicode Bangla?", hasUnicode);
