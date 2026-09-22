const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

const BanglaConverter = require(path.join(baseDir, 'bangla-converter-engine.js'));
global.BanglaConverter = BanglaConverter;
const EquationConverter = require(path.join(baseDir, 'equation-converter.js'));
global.EquationConverter = EquationConverter;
const JSZip = require(path.join(baseDir, 'jszip.min.js'));
global.JSZip = JSZip;

// Let's test how a combined CQ + MCQ document can be parsed and represented
const sampleCombined = `---
institute: বিজ্ঞান রেসিডেন্সিয়াল মডেল স্কুল
exam: তৃতীয় সেমিস্টার পরীক্ষা-২০২৩
grade: নবম
subject: বাংলা ১ম পত্র
subjectCode: ১০১
time: ২ ঘণ্টা ৩০ মিনিট
fullMarks: ৭০
note: ডান পাশে প্রশ্নের পূর্ণমান জ্ঞাপক। কবিতাংশ গদ্যাংশ থেকে ন্যূনতম ২টি...
layout: combined-exam-paper
---

# ক-বিভাগ: গদ্য

১. নাজমা বেগম স্বামীর মৃত্যুর পর সংসার চালাতে অন্যের বাড়িতে কাজ করে। থাকার ঘর ছাড়া তার অন্য কোনো সম্পদ নেই। সংসারে অভাবঅনটন লেগেই থাকে। ছেলেমেয়েদের ঠিকমতো খেতে দিতে না পারলেও তাদের স্কুলে পাঠায় এবং স্বপ্ন দেখে একদিন তার দুঃখকষ্টের অবসান হবে।
ক. হরিহর রায়ের জ্ঞাতিভ্রাতার নাম কী? [১]
খ. দুর্গা পা টিপে টিপে বাড়িতে প্রবেশ করল কেন? [২]
গ. উদ্দীপকে 'আমআঁটির ভেঁপু' গল্পের কোন দিকটিকে তুলে ধরা হয়েছে? [৩]
ঘ. উদ্দীপকের নাজমা বেগম কি 'আমআঁটির ভেঁপু' গল্পের সর্বজয়ার প্রতিচ্ছবি? তোমার মতামত উপস্থাপন করো। [৪]

---SECTION_BREAK:MCQ---
# বহুনির্বাচনি অভীক্ষা-৩০
সময়: ৩০ মিনিট | পূর্ণমান: ৩০
[বিশেষ দ্রষ্টব্য:- সরবরাহকৃত নৈর্ব্যক্তিক অভীক্ষার উত্তরপত্রে...]

১। দুর্গার মুখ রাঙা হয়ে উঠল কেন?
	ক. রৌদ্রের তাপে	খ. মায়ের বকা শুনে
	গ. লজ্জায়	ঘ. বনবিড়ালির কামড়ে

২। মিলি বাইরে থেকে বাড়ির দরজায় এলো, তবে মা বকবে বলে বাড়িতে ঢুকতে পারল না। দুর্গা ও মিলি-
	i. মাকে ভয় পায়	ii. মাকে শ্রদ্ধা করে
	iii. মাকে সমীহ করে
	নিচের কোনটি সঠিক?
	ক. i	খ. ii	গ. i ও ii	ঘ. i ও iii

৭। বলাইচাঁদ মুখোপাধ্যায় কত খ্রিস্টাব্দে জন্মগ্রহণ করেন?
	ক. ১৮৯৭	খ. ১৮৯৯	গ. ১৯০১	ঘ. ১৯০৩
`;

console.log("Combined sample length:", sampleCombined.length);
