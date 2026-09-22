const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

const MdLayoutParser = require(path.join(baseDir, 'layout-engine/md-layout-parser.js'));
const DocxLayoutBuilder = require(path.join(baseDir, 'layout-engine/docx-layout-builder.js'));
const DocWord2003Builder = require(path.join(baseDir, 'layout-engine/doc-word2003-builder.js'));

const rawTextFromOcr = `বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল
তৃতীয় সেমিস্টার পরীক্ষা-২০২৩
শ্রেণি: নবম
বিষয়: বাংলা ১ম পত্র
বিষয় কোড: ১০১
সময়: ২ ঘণ্টা ৩০ মিনিট
পূর্ণমান: ৭০
সৃজনশীল অভীক্ষা
[বিশেষ দ্রষ্টব্য: ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপক...]

ক-বিভাগ: গদ্য

১ । নাজমা বেগম স্বামীর মৃত্যুর পর সংসার চালাতে অন্যের বাড়িতে কাজ করে।
ক. হরিহর রায়ের জ্ঞাতিভ্রাতার নাম কী? [১]
খ. দুর্গা পা টিপে টিপে বাড়িতে প্রবেশ করল কেন? [২]
গ. উদ্দীপকে আমআঁটির ভেঁপু গল্পের কোন দিকটিকে তুলে ধরা হয়েছে? [৩]
ঘ. উদ্দীপকের নাজমা বেগম কি আমআঁটির ভেঁপু গল্পের সর্বজয়ার প্রতিচ্ছবি? [৪]

৩ । তরুতলে বসি পান্থ শ্রান্তি করে দূর,
ফল আস্বাদনে পায় আনন্দ প্রচুর।
বিদায়ের কালে হাতে ডাল ভেঙে লয়,
তবু তরু তাহাদের কিছু নাহি কয়।
ক. বনফুলের প্রকৃত নাম কী? [১]
খ. শিকড় অনেক দূরে চলে গেছে এ কথা কেন বলা হয়েছে? [২]
গ. উদ্দীপকের সঙ্গে নিমগাছ রচনার সাদৃশ্যপূর্ণ দিকটি ব্যাখ্যা কর। [৩]
ঘ. উদ্দীপকটিতে নিমগাছ রচনার মূলভাব প্রকাশ পায়নি। [৪]

---SECTION_BREAK:MCQ---
বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল
তৃতীয় সেমিস্টার পরীক্ষা-২০২৩
শ্রেণি: নবম | বিষয়: বাংলা ১ম পত্র
বিষয় কোড: ১০১
সময়: ৩০ মিনিট | পূর্ণমান: ৩০
বহুনির্বাচনি অভীক্ষা-৩০
[বিশেষ দ্রষ্টব্য: সরবরাহকৃত নৈর্ব্যক্তিক অভীক্ষার উত্তরপত্রে...]

১। দুর্গার মুখ রাঙা হয়ে উঠল কেন?
	ক. রৌদ্রের তাপে	খ. মায়ের বকা শুনে	গ. লজ্জায়	ঘ. বনবিড়ালির কামড়ে

২। মিলি বাইরে থেকে বাড়ির দরজায় এলো, তবে মা বকবে বলে বাড়িতে ঢুকতে পারল না। দুর্গা ও মিলি-
	i. মাকে ভয় পায়
	ii. মাকে শ্রদ্ধা করে
	iii. মাকে সমীহ করে
	নিচের কোনটি সঠিক?
	ক. i ও ii	খ. i ও iii	গ. ii ও iii	ঘ. i, ii ও iii
`;

const ast = MdLayoutParser.parse(rawTextFromOcr);
console.log("Metadata:", JSON.stringify(ast.metadata, null, 2));
console.log("Profile:", ast.profile.archetypeId);
console.log("Blocks count:", ast.blocks.length);
ast.blocks.forEach((b, idx) => {
  if (b.type === 'question') {
    console.log(`Block ${idx} (Question ${b.number}): text='${b.text}', stimulus='${b.stimulus || ''}', subQuestions count=${b.subQuestions.length}`);
    b.subQuestions.forEach(sq => {
      console.log(`   Sub ${sq.subId}: text='${sq.text}', marks='${sq.marks}'`);
    });
  } else {
    console.log(`Block ${idx} (${b.type}): ${b.text || b.time || ''}`);
  }
});
