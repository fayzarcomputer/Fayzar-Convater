function testParseBodyBlocks(bodyText) {
  const lines = bodyText.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    // Section break
    if (/^---(?:SECTION_BREAK(?::[A-Za-z0-9_\-]+)?|MCQ_SECTION)---$/i.test(line)) {
      blocks.push({ type: 'section_break' });
      i++;
      continue;
    }

    // Question
    const questionMatch = line.match(/^([১-৯1-9]+)\s*([।\.\|\)\:\-])\s*(.*)$/);
    if (questionMatch) {
      const qNum = questionMatch[1];
      const rawDelim = questionMatch[2];
      let qText = questionMatch[3];
      let qMarks = '';

      const marksMatch = qText.match(/\[([০-৯0-9a-zA-Z\s\*\+\-\=\/×÷\.\,\:\;]+)\]\s*$/);
      if (marksMatch) {
        qMarks = marksMatch[1];
        qText = qText.replace(/\[[০-৯0-9a-zA-Z\s\*\+\-\=\/×÷\.\,\:\;]+\]\s*$/, '').trim();
      }

      const questionBlock = {
        type: 'question',
        number: qNum,
        delimiter: rawDelim,
        text: qText,
        marks: qMarks,
        subQuestions: []
      };

      i++;

      let currentStimulusLines = [];

      while (i < lines.length) {
        const subLine = lines[i].trim();
        if (!subLine) { i++; continue; }

        // 1. Next question, heading, hr, table, or section break stops the current question block
        if (/^[১-৯1-9]+[।\.\)]\s/.test(subLine) || /^#{1,6}\s/.test(subLine) || /^(\-{3,}|\={3,}|\*{3,})$/.test(subLine) || subLine.startsWith('|') || /^(?:ক|খ|গ|ঘ|ঙ|চ)\-বিভাগ/i.test(subLine)) {
          break;
        }

        // 2. Sub-question match: ক., খ., গ., ঘ. or (ক), (খ) or a., b. or (a), (b) or i., ii.
        const subMatch = subLine.match(/^(\([ক-ঘa-divx0-9]+\)|[ক-ঘa-divx0-9]+[\.\)]|[১-৪][\.\)])\s*(.*)$/i);
        if (subMatch) {
          const subId = subMatch[1];
          let subText = subMatch[2];
          let subMarks = '';

          // Extract right-aligned marks [১] or trailing digit
          const subMarksMatch = subText.match(/\[([০-৯0-9a-zA-Z\s\*\+\-\=\/×÷\.\,\:\;]+)\]\s*$/)
            || subText.match(/(?:\t|\s{2,})([০-৯0-9]{1,2})\s*$/);
          if (subMarksMatch) {
            subMarks = subMarksMatch[1];
            subText = subText.replace(/\[[০-৯0-9a-zA-Z\s\*\+\-\=\/×÷\.\,\:\;]+\]\s*$/, '')
              .replace(/(?:\t|\s{2,})[০-৯0-9]{1,2}\s*$/, '').trim();
          }

          const isMcqOptionsRow = /(?:[খ-ঘ][\.\)]|\t)/.test(subText) || /^[iIvVxX]+[\.\)]/.test(subId);

          questionBlock.subQuestions.push({
            subId: subId,
            text: subText,
            marks: subMarks,
            isMcqOptionsRow: isMcqOptionsRow
          });
          i++;
          continue;
        }

        // 3. Connector text inside multi-statement MCQ (e.g. 'নিচের কোনটি সঠিক?')
        if (/(?:নিচের\s+কোনটি\s+সঠিক|সঠিক\s+উত্তর|তথ্যের\s+আলোকে)/i.test(subLine)) {
          questionBlock.subQuestions.push({
            subId: '',
            text: subLine,
            marks: '',
            isPromptText: true,
            isMcqOptionsRow: true
          });
          i++;
          continue;
        }

        // 4. If we haven't seen sub-questions yet, lines between question number and sub-questions are the stimulus / poem!
        if (questionBlock.subQuestions.length === 0) {
          currentStimulusLines.push(subLine.replace(/^>\s?/, ''));
          i++;
          continue;
        }

        break;
      }

      if (currentStimulusLines.length > 0) {
        questionBlock.stimulus = currentStimulusLines.join('\n');
      }

      blocks.push(questionBlock);
      continue;
    }

    blocks.push({ type: 'paragraph', text: line });
    i++;
  }

  return blocks;
}

const sampleQ3 = `৩ । তরুতলে বসি পান্থ শ্রান্তি করে দূর,
ফল আস্বাদনে পায় আনন্দ প্রচুর।
বিদায়ের কালে হাতে ডাল ভেঙে লয়,
তবু তরু তাহাদের কিছু নাহি কয়।
ক. বনফুলের প্রকৃত নাম কী? [১]
খ. শিকড় অনেক দূরে চলে গেছে এ কথা কেন বলা হয়েছে? [২]
গ. উদ্দীপকের সঙ্গে নিমগাছ রচনার সাদৃশ্যপূর্ণ দিকটি ব্যাখ্যা কর। [৩]
ঘ. উদ্দীপকটিতে নিমগাছ রচনার মূলভাব প্রকাশ পায়নি। [৪]
৪ । মিনু বহুপ্রয়াসে হাবুলদের বাড়িতে আশ্রয় পায়।
ক. মিনুর সই কে ছিল? [১]
`;

const resBlocks = testParseBodyBlocks(sampleQ3);
console.log("Blocks parsed:", resBlocks.length);
resBlocks.forEach((b, idx) => {
  console.log(`Block ${idx} (Question ${b.number}): text='${b.text}'`);
  console.log(`   stimulus='${b.stimulus}'`);
  console.log(`   subQuestions count=${b.subQuestions.length}`);
  b.subQuestions.forEach(sq => console.log(`      Sub ${sq.subId}: text='${sq.text}', marks='${sq.marks}'`));
});
