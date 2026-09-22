const path = require('path');
const baseDir = 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js';

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

function extractHeaderAndBody(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const metadata = {};
  let bodyLines = [];
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (!inHeader) bodyLines.push('');
      continue;
    }

    if (inHeader) {
      // Check if header stopped: First question, section heading (#), or category division
      if (/^[১-৯1-9]+[।\.\)]\s/.test(line) || /^#{1,6}\s/.test(line) || /^(?:ক|খ|গ|ঘ|ঙ|চ)\-বিভাগ/i.test(line) || /^Part\s*[-–—:]/i.test(line)) {
        inHeader = false;
        bodyLines.push(line);
        continue;
      }

      // Check header patterns
      if (!metadata.institute && /(?:স্কুল|বিদ্যালয়|মডেল|কলেজ|মাদরাসা|মাদ্রাসা|ইনস্টিটিউট|School|College|Academy)/i.test(line)) {
        metadata.institute = line;
        continue;
      }
      if (!metadata.exam && /(?:পরীক্ষা|সেমিস্টার|মূল্যায়ন|Exam|Examination|Test)/i.test(line)) {
        metadata.exam = line;
        continue;
      }
      if (!metadata.subjectCode && /(?:বিষয়\s*কোড|Subject\s*Code)\s*[:\-]?\s*([০-৯0-9]+)/i.test(line)) {
        const m = line.match(/(?:বিষয়\s*কোড|Subject\s*Code)\s*[:\-]?\s*([০-৯0-9]+)/i);
        metadata.subjectCode = m[1];
        continue;
      }
      if (!metadata.grade && /(?:শ্রেণি|Class)\s*[:\-]?\s*([^|\n\r]+)/i.test(line)) {
        const m = line.match(/(?:শ্রেণি|Class)\s*[:\-]?\s*([^|\n\r]+)/i);
        metadata.grade = m[1].trim();
        // Check if subject is on same line
        const subjMatch = line.match(/(?:বিষয়|Subject)\s*[:\-]?\s*([^|\n\r]+)/i);
        if (subjMatch) metadata.subject = subjMatch[1].trim();
        continue;
      }
      if (!metadata.subject && /(?:বিষয়|Subject)\s*[:\-]?\s*([^|\n\r]+)/i.test(line)) {
        const m = line.match(/(?:বিষয়|Subject)\s*[:\-]?\s*([^|\n\r]+)/i);
        metadata.subject = m[1].trim();
        continue;
      }
      if (!metadata.time && /(?:সময়|Time)\s*[:\-]?\s*([^|\n\r]+)/i.test(line)) {
        const m = line.match(/(?:সময়|Time)\s*[:\-]?\s*([^|\n\r]+)/i);
        metadata.time = m[1].trim();
        // Check if marks is on same line
        const marksMatch = line.match(/(?:পূর্ণমান|Full\s*Marks|Marks)\s*[:\-]?\s*([^|\n\r]+)/i);
        if (marksMatch) metadata.fullMarks = marksMatch[1].trim();
        continue;
      }
      if (!metadata.fullMarks && /(?:পূর্ণমান|Full\s*Marks|Marks)\s*[:\-]?\s*([^|\n\r]+)/i.test(line)) {
        const m = line.match(/(?:পূর্ণমান|Full\s*Marks|Marks)\s*[:\-]?\s*([^|\n\r]+)/i);
        metadata.fullMarks = m[1].trim();
        continue;
      }
      if (!metadata.subHeader && /(?:সৃজনশীল\s*অভীক্ষা|বহুনির্বাচনি\s*অভীক্ষা|রচনামূলক)/i.test(line)) {
        metadata.subHeader = line;
        continue;
      }
      if (!metadata.note && /^(?:\[?বিশেষ\s*দ্রষ্টব্য|\[\s*নোট|\bদ্রষ্টব্য)/i.test(line)) {
        metadata.note = line;
        continue;
      }

      // If unmatched, keep in body
      bodyLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  return { metadata, bodyText: bodyLines.join('\n') };
}

const res = extractHeaderAndBody(rawTextFromOcr);
console.log("=== Extracted Metadata ===");
console.log(JSON.stringify(res.metadata, null, 2));
console.log("\n=== First 10 lines of Cleaned Body ===");
console.log(res.bodyText.split('\n').slice(0, 10).join('\n'));
