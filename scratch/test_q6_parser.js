const testQ6 = `৬। প্রাণীর শ্বসন অঙ্গে-
	i. ফুলকা
	ii. ত্বক
	iii. ফুসফুস
নিচের কোনটি সঠিক?
	ক. i ও ii	খ. i ও iii	গ. ii ও iii	ঘ. i, ii ও iii
৭। শ্বসন প্রক্রিয়ায় কোন গ্যাস নির্গত হয়?
	ক. $CO_2$	খ. $NO_2$	গ. $O_2$	ঘ. কোনটিই নয়`;

function testParser(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  const blocks = [];
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const questionMatch = line.match(/^([১-৯1-9]+)\s*([।\.\|\)\:\-])\s*(.*)$/);
    if (questionMatch) {
      const qBlock = {
        number: questionMatch[1],
        text: questionMatch[3],
        subQuestions: []
      };
      i++;
      while (i < lines.length) {
        const subLine = lines[i].trim();
        if (!subLine) { i++; continue; }
        // Stop if next question
        if (/^[১-৯1-9]+[।\.]\s/.test(subLine)) break;

        const subMatch = subLine.match(/^(\([ক-ঘa-divx]+\)|[ক-ঘa-divx]+[\.\)]|[১-৪][\.\)])\s*(.*)$/i);
        if (subMatch) {
          qBlock.subQuestions.push({
            subId: subMatch[1],
            text: subMatch[2]
          });
          i++;
          continue;
        }
        if (/(?:নিচের\s+কোনটি\s+সঠিক|সঠিক\s+উত্তর)/i.test(subLine)) {
          qBlock.subQuestions.push({
            subId: '',
            text: subLine,
            isPromptText: true
          });
          i++;
          continue;
        }
        break;
      }
      blocks.push(qBlock);
      continue;
    }
    i++;
  }
  return blocks;
}

const res = testParser(testQ6);
console.log("Parsed blocks count:", res.length);
res.forEach(b => {
  console.log(`\nQ ${b.number}: ${b.text}`);
  console.log(`Subquestions (${b.subQuestions.length}):`);
  b.subQuestions.forEach(s => console.log(`  - [${s.subId}] ${s.text} (isPrompt=${!!s.isPromptText})`));
});
