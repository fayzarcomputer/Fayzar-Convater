/**
 * Fayzar Publishing Studio - Document Classifier & Parser
 * Accurately classifies text and extracts structural metadata.
 */

(function(global) {
  'use strict';

  const DocClassifier = {
    DOC_TYPES: {
      EXAM_COMBINED: 'EXAM_COMBINED',
      EXAM_CQ: 'EXAM_CQ',
      EXAM_GENERAL: 'EXAM_GENERAL',
      EXAM_MCQ: 'EXAM_MCQ',
      EXAM_MATH: 'EXAM_MATH',
      STAMP_DEED: 'STAMP_DEED',
      GOVT_APP: 'GOVT_APP',
      PROTTOYON: 'PROTTOYON',
      ADMIT_CARD: 'ADMIT_CARD',
      SALARY_SLIP: 'SALARY_SLIP',
      OFFICE_PAD: 'OFFICE_PAD',
      OFFICIAL_NOTICE: 'OFFICIAL_NOTICE',
      ROUTINE: 'ROUTINE',
      CV_RESUME: 'CV_RESUME',
      GENERAL: 'GENERAL'
    },

    classify(text) {
      if (!text || typeof text !== 'string') return { type: this.DOC_TYPES.GENERAL, confidence: 0 };
      const t = text.trim();

      // 0. EXPLICIT MASTER SECTOR ID (Highest Priority: Zero-hallucination Frontmatter / Tag)
      const frontmatterMatch = t.match(/^---\s*[\r\n]([\s\S]*?)[\r\n]---/);
      let detectedDocType = '';
      if (frontmatterMatch) {
        const fmStr = frontmatterMatch[1];
        const dtMatch = fmStr.match(/(?:doc_type|type|layout)\s*:\s*([^\r\n]+)/i);
        if (dtMatch) detectedDocType = dtMatch[1].trim().toUpperCase();
      }
      if (!detectedDocType) {
        const tagMatch = t.match(/\[(?:LAYOUT|DOC_PROFILE):\s*([^\]]+)\]/i);
        if (tagMatch) {
          const raw = tagMatch[1];
          const typePart = raw.split('|').find(p => /(?:doc_type|type)\s*[:=]/i.test(p));
          if (typePart) {
            detectedDocType = typePart.split(/[:=]/)[1].trim().toUpperCase();
          } else {
            detectedDocType = raw.split('|')[0].trim().toUpperCase();
          }
        }
      }

      if (detectedDocType) {
        if (detectedDocType === 'EXAM_GENERAL' || detectedDocType === 'GENERAL_EXAM' || detectedDocType === 'QUESTION_2COL' || detectedDocType === 'PRIMARY_EXAM') {
          return { type: this.DOC_TYPES.EXAM_GENERAL, confidence: 1.0, reason: 'Sector: EXAM_GENERAL' };
        }
        if (detectedDocType === 'EXAM_CQ' || detectedDocType === 'CREATIVE_EXAM' || detectedDocType === 'CQ_BOOKLET') {
          return { type: this.DOC_TYPES.EXAM_CQ, confidence: 1.0, reason: 'Sector: EXAM_CQ' };
        }
        if (detectedDocType === 'EXAM_MCQ' || detectedDocType === 'MCQ_EXAM' || detectedDocType === 'MCQ_2COL') {
          return { type: this.DOC_TYPES.EXAM_MCQ, confidence: 1.0, reason: 'Sector: EXAM_MCQ' };
        }
        if (detectedDocType === 'EXAM_COMBINED' || detectedDocType === 'COMBINED_EXAM') {
          return { type: this.DOC_TYPES.EXAM_COMBINED, confidence: 1.0, reason: 'Sector: EXAM_COMBINED' };
        }
        if (detectedDocType === 'OFFICE_PAD' || detectedDocType === 'PAD') {
          return { type: this.DOC_TYPES.OFFICE_PAD, confidence: 1.0, reason: 'Sector: OFFICE_PAD' };
        }
        if (detectedDocType === 'PROTTOYON_CERT' || detectedDocType === 'PROTTOYON' || detectedDocType === 'TESTIMONIAL_CERT') {
          return { type: this.DOC_TYPES.PROTTOYON, confidence: 1.0, reason: 'Sector: PROTTOYON' };
        }
        if (detectedDocType === 'GOVT_APP' || detectedDocType === 'APPLICATION') {
          return { type: this.DOC_TYPES.GOVT_APP, confidence: 1.0, reason: 'Sector: GOVT_APP' };
        }
        if (detectedDocType === 'OFFICIAL_NOTICE' || detectedDocType === 'NOTICE') {
          return { type: this.DOC_TYPES.GENERAL, confidence: 1.0, reason: 'Sector: OFFICIAL_NOTICE' };
        }
        if (detectedDocType === 'LEGAL_DEED' || detectedDocType === 'STAMP_DEED' || detectedDocType === 'DEED') {
          return { type: this.DOC_TYPES.STAMP_DEED, confidence: 1.0, reason: 'Sector: LEGAL_DEED' };
        }
      }

      // Count questions and MCQ clusters
      const totalQuestionMatches = t.match(/^[০-৯0-9]+[।\.\)]\s/gm) || [];
      const totalQCount = totalQuestionMatches.length;
      const mcqClusterMatches = t.match(/[ক-ঘ][\)\.]\s+[^\n]+[ক-ঘ][\)\.]/g) || [];
      const mcqCount = mcqClusterMatches.length;
      const isStrictMcq = (mcqCount >= 18) || (totalQCount >= 3 && mcqCount >= totalQCount * 0.85);

      // Combined CQ + MCQ Detection (Highest Priority for Exam Papers)
      const hasCqMarkers = /(?:সৃজনশীল|উদ্দীপক|দৃশ্যকল্প|ক\-বিভাগ|খ\-বিভাগ)/i.test(t) ||
        (/(?:ক\.\s*[^\n]+\s*খ\.\s*[^\n]+\s*গ\.)/.test(t) && /\[[১-৪\d]\]/.test(t));
      const hasExplicitSectionBreak = /---SECTION_BREAK/i.test(t) || /\[LAYOUT:\s*COMBINED/i.test(t);

      let combinedScore = 0;
      if (hasExplicitSectionBreak || (hasCqMarkers && isStrictMcq)) {
        combinedScore = 50;
      }

      // Keyword & Pattern Scoring
      let cqScore = 0;
      let mcqScore = 0;
      let stampScore = 0;
      let appScore = 0;
      let certScore = 0;
      let admitScore = 0;
      let salaryScore = 0;
      let padScore = 0;
      let routineScore = 0;

      // STRICT CQ vs GENERAL GATE:
      // A document is ONLY EXAM_CQ if it explicitly contains 'সৃজনশীল' or 'উদ্দীপক' or has 4-tier sub-questions with marks!
      if (/সৃজনশীল|উদ্দীপক|দৃশ্যকল্প/i.test(t)) {
        cqScore += 30;
      } else if (isStrictMcq) {
        mcqScore += 35; // Pure MCQ paper
      } else if (/শ্রেণি|বিষয়|সময়|পূর্ণমান|পরীক্ষা/.test(t) || totalQCount > 0) {
        // Standard 2-column general question paper (Class 1-5 / short questions / primary)
        // Classified as EXAM_GENERAL so it NEVER gets forced into CQ!
        return { type: this.DOC_TYPES.EXAM_GENERAL, confidence: 0.85, reason: 'সাধারণ/প্রাথমিক প্রশ্নপত্র' };
      }

      if (/ক\.\s*[^\n]+\s*খ\.\s*[^\n]+\s*গ\./.test(t) && !/সৃজনশীল/.test(t)) {
        cqScore += 8;
      }
      if (/[\u09E7-\u09EF\d]+\s*[+\-xX×=]\s*[\u09E7-\u09EF\d]+/.test(t)) cqScore += 3;

      // Stamp patterns
      if (/৩০০|তিনশত|স্ট্যাম্প|অঙ্গীকার\s*নামা|বায়নানামা|চুক্তিপত্র|তফসিল|মৌজা|খতিয়ান|দাগ\s*নং/.test(t)) stampScore += 5;
      if (/১ম\s*পক্ষ|২য়\s*পক্ষ|প্রথম\s*পক্ষ|দ্বিতীয়\s*পক্ষ|লিখিতং|বরাবর/i.test(t)) stampScore += 3;

      // Application patterns
      if (/বরাবর[,:\s]/.test(t) && /বিষয়[:\s]/.test(t)) appScore += 6;
      if (/বিনীত\s*নিবেদন|মহোদয়|জনাব|অতএব,\s*বিনীত|নিবেদক/i.test(t)) appScore += 4;

      // Certificate patterns
      if (/প্রত্যয়নপত্র|অভিজ্ঞতার\s*সনদ|প্রশংসাপত্র|এই\s*মর্মে\s*প্রত্যয়ন|ছাড়পত্র/.test(t)) certScore += 7;

      // Pad patterns
      if (/মেসার্স|প্রোঃ|মোবাইলঃ|সূত্র[:\s\-]|বিসমিল্লাহির/i.test(t) && !/বরাবর/.test(t)) padScore += 5;

      // Routine patterns
      if (/ক্লাস\s*রুটিন|সময়সূচী|পিরিয়ড|১ম-ঘণ্টা|১ম\s*ঘণ্টা/.test(t)) routineScore += 6;

      // Admit card patterns
      if (/প্রবেশপত্র|ADMIT\s*CARD/i.test(t)) admitScore += 8;
      if (/পূর্ণমান.*পাসমান/i.test(t)) admitScore += 5;
      if (/পরীক্ষার্থীর\s*নাম.*রোল|রোল.*সময়/i.test(t)) admitScore += 4;

      // Salary slip patterns
      if (/বেতন\s*স্লিপ|PAY\s*SLIP/i.test(t)) salaryScore += 8;
      if (/মূল\s*বেতন|বাড়ি\s*ভাড়া\s*ভাতা|নিট\s*বেতন/i.test(t)) salaryScore += 6;
      if (/ভবিষ্যৎ\s*তহবিল|আয়কর/i.test(t) && /বেতন|মাস/i.test(t)) salaryScore += 4;

      const scores = [
        { type: this.DOC_TYPES.EXAM_COMBINED, score: combinedScore },
        { type: this.DOC_TYPES.EXAM_CQ, score: cqScore },
        { type: this.DOC_TYPES.EXAM_MCQ, score: mcqScore },
        { type: this.DOC_TYPES.STAMP_DEED, score: stampScore },
        { type: this.DOC_TYPES.GOVT_APP, score: appScore },
        { type: this.DOC_TYPES.PROTTOYON, score: certScore },
        { type: this.DOC_TYPES.ADMIT_CARD, score: admitScore },
        { type: this.DOC_TYPES.SALARY_SLIP, score: salaryScore },
        { type: this.DOC_TYPES.OFFICE_PAD, score: padScore },
        { type: this.DOC_TYPES.ROUTINE, score: routineScore }
      ];

      scores.sort((a, b) => b.score - a.score);

      if (scores[0].score >= 4) {
        return { type: scores[0].type, confidence: scores[0].score, allScores: scores };
      }

      return { type: this.DOC_TYPES.GENERAL, confidence: 1, allScores: scores };
    },

    extractMetadata(text, type) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const meta = {
        title: '',
        subtitle: '',
        institute: '',
        examName: '',
        subject: '',
        className: '',
        time: '',
        marks: '',
        date: '',
        memoNo: '',
        firstParty: '',
        secondParty: '',
        subjectText: ''
      };

      if (!lines.length) return meta;

      // Common extraction
      for (const line of lines.slice(0, 10)) {
        if (/স্কুল|কলেজ|মাদরাসা|বিদ্যালয়|একাডেমী|প্রতিষ্ঠান|মসজিদ|ট্রেডার্স|সমিতি/i.test(line) && !meta.institute) {
          meta.institute = line;
        }
        if (/পরীক্ষা/i.test(line) && !meta.examName) {
          meta.examName = line;
        }
        if (/শ্রেণি[ঃ:]\s*([^\s;]+)/.test(line) && !meta.className) {
          meta.className = line.match(/শ্রেণি[ঃ:]\s*([^\s;]+)/)[1];
        }
        if (/বিষয়[ঃ:]\s*([^\s;]+)/.test(line) && !meta.subject) {
          meta.subject = line.match(/বিষয়[ঃ:]\s*([^\s;]+)/)[1];
        }
        if (/সময়[ঃ:\-]\s*([^\n;]+?)(?:পূর্ণমান|মান|$)/.test(line) && !meta.time) {
          meta.time = line.match(/সময়[ঃ:\-]\s*([^\n;]+?)(?:পূর্ণমান|মান|$)/)[1].trim();
        }
        if (/(?:পূর্ণমান|মান)[ঃ:\-]\s*([\u09E6-\u09EF\d]+)/.test(line) && !meta.marks) {
          meta.marks = line.match(/(?:পূর্ণমান|মান)[ঃ:\-]\s*([\u09E6-\u09EF\d]+)/)[1].trim();
        }
        if (/তারিখ[ঃ:]\s*([^\n]+)/.test(line) && !meta.date) {
          meta.date = line.match(/তারিখ[ঃ:]\s*([^\n]+)/)[1].trim();
        }
        if (/বিষয়[ঃ:]\s*([^\n]+)/.test(line) && !meta.subjectText) {
          meta.subjectText = line.match(/বিষয়[ঃ:]\s*([^\n]+)/)[1].trim();
        }
      }

      return meta;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DocClassifier;
  if (typeof window !== 'undefined') window.DocClassifier = DocClassifier;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
