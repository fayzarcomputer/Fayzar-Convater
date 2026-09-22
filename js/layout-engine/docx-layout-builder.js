/**
 * ============================================================================
 * Fayzar Layout Engine - Modern Word (.docx) OOXML Layout Builder v2.0
 * ============================================================================
 * Generates genuine, fully compliant modern Word (.docx) packages using OOXML
 * with native 2-column sections (<w:cols>), headers, tables, right-aligned marks,
 * OMML math equations, SutonnyMJ (Bijoy) or Unicode font mappings.
 *
 * FULL ENGLISH & BILINGUAL FIDELITY GUARANTEE:
 * - Pure English documents are automatically detected and kept 100% in Times New Roman.
 * - Bilingual documents keep English words, formulas & marks in Times New Roman,
 *   converting ONLY Bengali words into SutonnyMJ.
 * ============================================================================
 */

(function(global) {
  'use strict';

  class DocxLayoutBuilder {

    /**
     * Detect if the parsed AST contains any Bengali characters
     */
    static hasBengali(parsedAst) {
      const textSamples = [];
      if (parsedAst.metadata) {
        Object.values(parsedAst.metadata).forEach(v => typeof v === 'string' && textSamples.push(v));
      }
      if (parsedAst.blocks) {
        parsedAst.blocks.forEach(b => {
          if (b.text) textSamples.push(b.text);
          if (b.stimulus) textSamples.push(b.stimulus);
          if (b.subQuestions) b.subQuestions.forEach(sq => textSamples.push(sq.text));
          if (b.headers) b.headers.forEach(h => textSamples.push(h));
          if (b.rows) b.rows.forEach(r => r.forEach(c => textSamples.push(c)));
          if (b.items) b.items.forEach(it => textSamples.push(typeof it === 'string' ? it : (it.text || '')));
        });
      }
      const fullSample = textSamples.join(' ');
      if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.hasBengaliText === 'function') {
        return BanglaConverter.hasBengaliText(fullSample);
      }
      return /[\u0980-\u09FF]/.test(fullSample);
    }

    /**
     * Escape XML characters
     */
    static esc(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    /**
     * Helper to convert text if Bijoy selected
     */
    static cvt(str, isBijoy) {
      if (!str) return '';
      if (isBijoy) {
        if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.unicodeToBijoy === 'function') {
          return BanglaConverter.unicodeToBijoy(str);
        }
        if (typeof BanglaConverterEngine !== 'undefined' && typeof BanglaConverterEngine.convertUnicodeToBijoy === 'function') {
          return BanglaConverterEngine.convertUnicodeToBijoy(str);
        }
      }
      return str;
    }

    /**
     * Render Smart Runs supporting mixed Bengali (SutonnyMJ) and English (Times New Roman)
     */
    static renderSmartRuns(text, isBijoy, isBold = false, isItalic = false, sz = '22', isPureEnglish = false, extraRPr = '') {
      if (!text) return '';
      const esc = DocxLayoutBuilder.esc;
      const cvt = DocxLayoutBuilder.cvt;

      const boldTag = isBold ? '<w:b/><w:bCs/>' : '';
      const italicTag = isItalic ? '<w:i/><w:iCs/>' : '';
      const szTag = `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;

      // Clean LaTeX arrows to standard Unicode arrow
      text = text.replace(/\\rightarrow\b|\\to\b/g, '→');

      // Math & Chemical Formula Handling ($CO_2$, $NO_2$, $O_2$, $\rightarrow$, etc.)
      const EqConv = (typeof EquationConverter !== 'undefined') ? EquationConverter : (typeof globalThis !== 'undefined' && globalThis.EquationConverter ? globalThis.EquationConverter : null);
      if (EqConv && /\$|\\frac|\\sqrt|\^|_/.test(text)) {
        const mathSegments = EqConv.splitTextAndMath(text);
        let mathXml = '';
        for (const mSeg of mathSegments) {
          if (mSeg.type === 'math') {
            let mVal = mSeg.value.trim().replace(/\\rightarrow\b|\\to\b/g, '→');
            const chemSubMatch = mVal.match(/^([a-zA-Z0-9]+)_\{?([0-9a-zA-Z]+)\}?$/);
            if (chemSubMatch) {
              const chemBase = chemSubMatch[1];
              const chemSub = chemSubMatch[2];
              mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(chemBase)}</w:t></w:r>`;
              mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:vertAlign w:val="subscript"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(chemSub)}</w:t></w:r>`;
            } else if (mVal === '→' || mVal.includes('→')) {
              mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve"> ${esc(mVal)} </w:t></w:r>`;
            } else if (typeof EqConv.latexToOmml === 'function') {
              mathXml += EqConv.latexToOmml(mVal, isBijoy);
            }
          } else {
            mathXml += DocxLayoutBuilder.renderSmartRuns(mSeg.value, isBijoy, isBold, isItalic, sz, isPureEnglish, extraRPr);
          }
        }
        return mathXml;
      }

      // 1. If Pure English Document: Keep 100% Times New Roman, NEVER apply Bijoy conversion!
      if (isPureEnglish || !isBijoy) {
        const font = isPureEnglish ? 'Times New Roman' : 'Kalpurush';
        const rPr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${boldTag}${italicTag}${szTag}${extraRPr}</w:rPr>`;
        return `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
      }

      // 2. Bilingual Bijoy Mode: Split into Bengali and English segments
      let segments = [];
      if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.splitMixedBengaliAndEnglish === 'function') {
        segments = BanglaConverter.splitMixedBengaliAndEnglish(text);
      } else {
        const hasBn = /[\u0980-\u09FF]/.test(text);
        segments = [{ type: hasBn ? 'bengali' : 'english', text }];
      }

      let xml = '';
      for (const seg of segments) {
        if (!seg.text) continue;
        if (seg.type === 'english') {
          // English Segment: Always Times New Roman, NO Bijoy translation!
          const rPr = `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${boldTag}${italicTag}${szTag}${extraRPr}</w:rPr>`;
          xml += `<w:r>${rPr}<w:t xml:space="preserve">${esc(seg.text)}</w:t></w:r>`;
        } else {
          // Bengali Segment: SutonnyMJ with clean Bijoy translation
          const converted = cvt(seg.text, true);
          const rPr = `<w:rPr><w:rFonts w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ" w:cs="SutonnyMJ"/>${boldTag}${italicTag}${szTag}${extraRPr}</w:rPr>`;
          xml += `<w:r>${rPr}<w:t xml:space="preserve">${esc(converted)}</w:t></w:r>`;
        }
      }
      return xml;
    }

    /**
     * Build Modern Word .docx Blob from parsed AST
     */
    static async build(parsedAst, options = {}) {
      const JSZipLib = (typeof JSZip !== 'undefined') ? JSZip : (typeof globalThis !== 'undefined' && globalThis.JSZip ? globalThis.JSZip : (typeof window !== 'undefined' ? window.JSZip : null));
      if (!JSZipLib) {
        throw new Error('JSZip লাইব্রেরি লোড হয়নি।');
      }

      const opts = Object.assign({
        font: 'SutonnyMJ', // 'SutonnyMJ' (Bijoy) or 'Kalpurush' (Unicode)
        onProgress: (pct, msg) => {}
      }, options);

      opts.onProgress(10, 'আধুনিক ওয়ার্ড প্যাকেজ কাঠামো তৈরি হচ্ছে...');

      // Smart Language & Archetype Profile Detection
      const profile = parsedAst.profile || (parsedAst.layoutSettings && parsedAst.layoutSettings.profile);
      const isPureEnglish = (profile && typeof profile.isPureEnglish === 'boolean')
        ? profile.isPureEnglish
        : !DocxLayoutBuilder.hasBengali(parsedAst);
      const isBijoy = !isPureEnglish && opts.font === 'SutonnyMJ';
      const defaultDocFont = isPureEnglish ? 'Times New Roman' : (isBijoy ? 'SutonnyMJ' : 'Kalpurush');

      const meta = parsedAst.metadata || {};
      const layout = parsedAst.layoutSettings || {};

      opts.onProgress(25, 'ডকুমেন্ট হেডার ও মেটাডাটা এক্সএমএল প্রস্তুত হচ্ছে...');

      // 1. Generate Header Paragraphs
      const headerXml = DocxLayoutBuilder.generateHeaderXml(meta, layout, isBijoy, isPureEnglish);

      // 2. Generate Body Elements
      opts.onProgress(50, 'প্রশ্নপত্র ও সেকশন এক্সএমএল প্রসেসিং হচ্ছে...');
      const bodyElementsXml = [];

      for (const block of parsedAst.blocks) {
        bodyElementsXml.push(DocxLayoutBuilder.renderBlockXml(block, isBijoy, isPureEnglish, layout));
      }

      // 3. Section Properties (Columns, Page Size, Margins)
      opts.onProgress(75, 'কলাম ও মার্জিন স্পেসিফিকেশন যুক্ত হচ্ছে...');
      const sectPrXml = DocxLayoutBuilder.generateSectionProperties(layout);

      // 4. Assemble word/document.xml
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${headerXml}
    ${bodyElementsXml.join('\n')}
    ${sectPrXml}
  </w:body>
</w:document>`;

      // 5. Pack everything into JSZip container
      opts.onProgress(85, 'ওয়ার্ড জিপ কন্টেইনার কম্প্রেস হচ্ছে...');
      const zip = new JSZipLib();

      zip.file('[Content_Types].xml', DocxLayoutBuilder.getContentTypesXml());
      zip.file('_rels/.rels', DocxLayoutBuilder.getRootRelsXml());
      zip.file('word/_rels/document.xml.rels', DocxLayoutBuilder.getDocumentRelsXml());
      zip.file('word/styles.xml', DocxLayoutBuilder.getStylesXml(defaultDocFont));
      zip.file('word/document.xml', documentXml);

      opts.onProgress(95, 'চূড়ান্ত ফাইল ব্লব জেনারেট হচ্ছে...');
      const docxBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      opts.onProgress(100, 'আধুনিক ওয়ার্ড (.docx) ফাইল প্রস্তুত সম্পন্ন!');
      return docxBlob;
    }

    /**
     * Generates header XML for modern Word document
     */
    static generateHeaderXml(meta, layout, isBijoy, isPureEnglish) {
      let xml = '';
      const renderRuns = (txt, isBold, isItalic, sz) => DocxLayoutBuilder.renderSmartRuns(txt, isBijoy, isBold, isItalic, sz, isPureEnglish);

      if (layout.templateId === 'official-notice') {
        const institute = meta.institute || (isPureEnglish ? 'Government of the People\'s Republic of Bangladesh' : 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার');
        const subHeader = meta.subHeader || (isPureEnglish ? 'Office of the Upazila Nirbahi Officer' : 'উপজেলা নির্বাহী অফিসারের কার্যালয়');

        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
          ${renderRuns(institute, true, false, '30')}
        </w:p>
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
          ${renderRuns(subHeader, true, false, '22')}
        </w:p>`;

        if (meta.memoNo || meta.date) {
          const memoLabel = isPureEnglish ? 'Memo No: ' : 'স্মারক নং: ';
          const dateLabel = isPureEnglish ? 'Date: ' : 'তারিখ: ';
          xml += `
          <w:tbl>
            <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>
            <w:tr>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/></w:pPr>${renderRuns(memoLabel, true, false, '22')}${renderRuns(meta.memoNo || '—', false, false, '22')}</w:p></w:tc>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${renderRuns(dateLabel, true, false, '22')}${renderRuns(meta.date || '—', false, false, '22')}</w:p></w:tc>
            </w:tr>
          </w:tbl>`;
        }

        if (meta.subject) {
          const subjLabel = isPureEnglish ? 'Subject: ' : 'বিষয়: ';
          xml += `
          <w:p>
            <w:pPr><w:spacing w:before="180" w:after="140"/></w:pPr>
            ${renderRuns(subjLabel + meta.subject, true, false, '24')}
          </w:p>`;
        }

        return xml;
      }

      // Academic Question Paper Header
      if (meta.institute) {
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
          ${renderRuns(meta.institute, true, false, '30')}
        </w:p>`;
      }

      if (meta.exam) {
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
          ${renderRuns(meta.exam, true, false, '26')}
        </w:p>`;
      }

      if (meta.grade || meta.subject) {
        const gradeText = meta.grade ? (isPureEnglish ? `Class: ${meta.grade}` : `শ্রেণি: ${meta.grade}`) : '';
        const subjText = meta.subject ? (isPureEnglish ? `Subject: ${meta.subject}` : `বিষয়: ${meta.subject}`) : '';
        const middle = (gradeText && subjText) ? '  |  ' : '';
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
          ${renderRuns(gradeText + middle + subjText, true, false, '22')}
        </w:p>`;
      }

      if (meta.subjectCode) {
        const digits = String(meta.subjectCode).replace(/\D/g, '').split('');
        const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
        const cellsXml = codeDigits.map(d => `<w:tc><w:tcPr><w:tcW w:w="320" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>${renderRuns(d, true, false, '20')}</w:p></w:tc>`).join('');
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="20"/></w:pPr>
          ${renderRuns('বিষয় কোড: ', false, false, '20')}
        </w:p>
        <w:tbl>
          <w:tblPr><w:jc w:val="center"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>
          <w:tr>${cellsXml}</w:tr>
        </w:tbl>`;
      }

      if (meta.time || meta.fullMarks) {
        const timeText = meta.time ? (isPureEnglish ? `Time: ${meta.time}` : `সময়: ${meta.time}`) : '';
        const marksText = meta.fullMarks ? (isPureEnglish ? `Full Marks: ${meta.fullMarks}` : `পূর্ণমান: ${meta.fullMarks}`) : '';

        xml += `
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tblBorders>
          </w:tblPr>
          <w:tr>
            <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>${renderRuns(timeText, true, false, '22')}</w:p></w:tc>
            <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="40"/></w:pPr>${renderRuns(marksText, true, false, '22')}</w:p></w:tc>
          </w:tr>
        </w:tbl>`;
      }

      if (meta.note) {
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="120"/></w:pPr>
          ${renderRuns(meta.note, false, true, '19')}
        </w:p>`;
      }

      return xml;
    }

    /**
     * Render an individual AST block to Word XML
     */
    static renderBlockXml(block, isBijoy, isPureEnglish, layout = {}) {
      const renderRuns = (txt, isBold, isItalic, sz, extra = '') => DocxLayoutBuilder.renderSmartRuns(txt, isBijoy, isBold, isItalic, sz, isPureEnglish, extra);

      const is2Col = layout && layout.columns === 2;
      const isLegal = layout && layout.pageSize === 'legal';
      const rightTabPos = is2Col ? (isLegal ? '5130' : '4960') : (isLegal ? '10800' : '10460');

      switch (block.type) {
        case 'header_time_marks': {
          const timeText = block.time || '';
          const marksText = block.marks || '';
          return `
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="5000" w:type="pct"/>
              <w:tblBorders><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>${renderRuns(timeText, true, false, '22')}</w:p></w:tc>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="40"/></w:pPr>${renderRuns(marksText, true, false, '22')}</w:p></w:tc>
            </w:tr>
          </w:tbl>`;
        }

        case 'heading': {
          const sz = block.level === 1 ? '26' : '24';
          return `
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr>
            ${renderRuns(block.text, true, false, sz)}
          </w:p>`;
        }

        case 'section_break': {
          let xml = `
          <w:p>
            <w:pPr>
              <w:sectPr>
                <w:pgSz w:w="11906" w:h="16838"/>
                <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
                <w:cols w:num="1" w:space="720"/>
                <w:docGrid w:linePitch="360"/>
              </w:sectPr>
            </w:pPr>
          </w:p>`;

          // If MCQ Section has header metadata, render it centered across the full page!
          if (block.mcqHeader) {
            const h = block.mcqHeader;
            if (h.institute) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="40"/></w:pPr>
                ${renderRuns(h.institute, true, false, '30')}
              </w:p>`;
            }
            if (h.exam) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                ${renderRuns(h.exam, true, false, '26')}
              </w:p>`;
            }
            if (h.grade) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                ${renderRuns(h.grade, true, false, '22')}
              </w:p>`;
            }
            if (h.subjectCode) {
              const digits = String(h.subjectCode).replace(/\D/g, '').split('');
              const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
              const cellsXml = codeDigits.map(d => `<w:tc><w:tcPr><w:tcW w:w="320" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>${renderRuns(d, true, false, '20')}</w:p></w:tc>`).join('');
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="20"/></w:pPr>
                ${renderRuns('বিষয় কোড: ', false, false, '20')}
              </w:p>
              <w:tbl>
                <w:tblPr><w:jc w:val="center"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>
                <w:tr>${cellsXml}</w:tr>
              </w:tbl>`;
            }
            if (h.title) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="40"/></w:pPr>
                ${renderRuns(h.title, true, false, '26')}
              </w:p>`;
            }
            if (h.timeMarks) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                ${renderRuns(h.timeMarks, true, false, '22')}
              </w:p>`;
            }
            if (h.note) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="60"/></w:pPr>
                ${renderRuns(h.note, false, true, '19')}
              </w:p>`;
            }

            // Continuous break into 2 columns for MCQ questions with divider
            xml += `
            <w:p>
              <w:pPr>
                <w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="000000"/></w:pBdr>
                <w:sectPr>
                  <w:type w:val="continuous"/>
                  <w:pgSz w:w="11906" w:h="16838"/>
                  <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
                  <w:cols w:num="1" w:space="720"/>
                  <w:docGrid w:linePitch="360"/>
                </w:sectPr>
              </w:pPr>
            </w:p>`;
          }

          return xml;
        }

        case 'question': {
          let xml = '';
          const rawDelim = block.delimiter || (isPureEnglish ? '.' : '।');
          const qNumDelim = (isPureEnglish || rawDelim === '.') ? '.' : rawDelim.trim();

          // Question Title with Native Hanging Indent:
          // Left indent 432 dxa with hanging 432 dxa ensures wrapped lines never go under the number!
          const numPrefix = block.number + qNumDelim + ' ';
          const formattedMarks = block.marks
            ? ((isPureEnglish || block.marks.includes('=')) ? `[${block.marks}]` : block.marks)
            : '';

          xml += `
          <w:p>
            <w:pPr>
              <w:ind w:left="432" w:hanging="432"/>
              <w:tabs>
                <w:tab w:val="right" w:pos="${rightTabPos}"/>
              </w:tabs>
              <w:spacing w:before="60" w:after="20" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            ${renderRuns(numPrefix, true, false, '22')}
            ${renderRuns(block.text, false, false, '22')}
            ${formattedMarks ? `<w:r><w:tab/></w:r>${renderRuns(formattedMarks, true, false, '22')}` : ''}
          </w:p>`;

          // Stimulus/Passage if any: Indented cleanly aligned with question text (not under number)
          if (block.stimulus) {
            const stimLines = block.stimulus.split('\n');
            for (const sLine of stimLines) {
              if (!sLine.trim()) continue;
              xml += `
              <w:p>
                <w:pPr>
                  <w:ind w:left="432"/>
                  <w:spacing w:before="15" w:after="20" w:line="240" w:lineRule="auto"/>
                </w:pPr>
                ${renderRuns(sLine, false, false, '22')}
              </w:p>`;
            }
          }

          // Sub-questions (a, b, c, d or ক, খ, গ, ঘ) or MCQ Options Rows
          if (block.subQuestions && block.subQuestions.length > 0) {
            for (const sub of block.subQuestions) {
              const isMcqRow = sub.isMcqOptionsRow || /(?:[খ-ঘ][\.\)]|\t)/.test(sub.text) || (layout.profile && layout.profile.archetypeId === 'bengali_mcq_paper' && !sub.marks);
              const subFormattedMarks = sub.marks
                ? ((isPureEnglish || sub.marks.includes('=')) ? `[${sub.marks}]` : sub.marks)
                : '';

              if (sub.isPromptText) {
                // E.g., 'নিচের কোনটি সঠিক?' inside question block
                xml += `
                <w:p>
                  <w:pPr>
                    <w:ind w:left="432"/>
                    <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  ${renderRuns(sub.text, true, false, '22')}
                </w:p>`;
              } else if (isMcqRow) {
                // MCQ Options: Clean compact indent aligned under question text
                xml += `
                <w:p>
                  <w:pPr>
                    <w:ind w:left="432"/>
                    <w:spacing w:before="10" w:after="20" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  ${renderRuns(sub.subId ? (sub.subId + ' ' + sub.text) : sub.text, false, false, '22')}
                  ${subFormattedMarks ? `<w:r><w:tab/></w:r>${renderRuns(subFormattedMarks, true, false, '22')}` : ''}
                </w:p>`;
              } else {
                // Standard Creative Sub-question: 864 dxa hanging indent
                xml += `
                <w:p>
                  <w:pPr>
                    <w:ind w:left="864" w:hanging="432"/>
                    <w:tabs>
                      <w:tab w:val="right" w:pos="${rightTabPos}"/>
                    </w:tabs>
                    <w:spacing w:before="15" w:after="15" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  ${renderRuns(sub.subId + ' ', true, false, '22')}
                  ${renderRuns(sub.text, false, false, '22')}
                  ${subFormattedMarks ? `<w:r><w:tab/></w:r>${renderRuns(subFormattedMarks, true, false, '22')}` : ''}
                </w:p>`;
              }
            }
          }

          return xml;
        }

        case 'figure': {
          const figText = block.text || (isPureEnglish ? '[Image / Figure Box]' : '[চিত্র/ডায়াগ্রামের স্থান]');
          return `
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="5000" w:type="pct"/>
              <w:jc w:val="center"/>
              <w:tblBorders>
                <w:top w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:left w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:bottom w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:right w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:insideH w:val="none"/><w:insideV w:val="none"/>
              </w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="5000" w:type="pct"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
                  <w:tcMar><w:top w:w="240" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
                  ${renderRuns(figText, false, true, '18', '<w:color w:val="475569"/>')}
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>`;
        }

        case 'stimulus_box': {
          return `
          <w:p>
            <w:pPr>
              <w:pBdr><w:left w:val="single" w:sz="24" w:space="10" w:color="1E3A8A"/></w:pBdr>
              <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
              <w:spacing w:before="60" w:after="60" w:line="240" w:lineRule="auto"/>
              <w:ind w:left="160" w:right="120"/>
            </w:pPr>
            ${renderRuns(block.text, false, true, '21')}
          </w:p>`;
        }

        case 'table': {
          let tblXml = `
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="0" w:type="auto"/>
              <w:jc w:val="left"/>
              <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
              </w:tblBorders>
              <w:tblCellMar>
                <w:top w:w="40" w:type="dxa"/>
                <w:bottom w:w="40" w:type="dxa"/>
                <w:left w:w="100" w:type="dxa"/>
                <w:right w:w="100" w:type="dxa"/>
              </w:tblCellMar>
            </w:tblPr>`;

          // Standard plain Word table: Headers row has NO gray shading and NO tblHeader tag
          if (block.headers && block.headers.length > 0) {
            tblXml += '<w:tr>';
            block.headers.forEach((h, idx) => {
              const align = (block.alignments && block.alignments[idx]) || 'left';
              tblXml += `
              <w:tc>
                <w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${renderRuns(h, false, false, '22')}</w:p>
              </w:tc>`;
            });
            tblXml += '</w:tr>';
          }

          if (block.rows && block.rows.length > 0) {
            block.rows.forEach(row => {
              tblXml += '<w:tr>';
              row.forEach((cell, idx) => {
                const align = (block.alignments && block.alignments[idx]) || 'left';
                tblXml += `
                <w:tc>
                  <w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${renderRuns(cell, false, false, '22')}</w:p>
                </w:tc>`;
              });
              tblXml += '</w:tr>';
            });
          }

          tblXml += '</w:tbl>';
          return tblXml;
        }

        case 'unordered_list': {
          let listXml = '';
          block.items.forEach(item => {
            listXml += `
            <w:p>
              <w:pPr><w:ind w:left="360"/><w:spacing w:after="40"/></w:pPr>
              <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr><w:t>• </w:t></w:r>
              ${renderRuns(item, false, false, '22')}
            </w:p>`;
          });
          return listXml;
        }

        case 'ordered_list': {
          let listXml = '';
          block.items.forEach(item => {
            listXml += `
            <w:p>
              <w:pPr><w:ind w:left="360"/><w:spacing w:after="40"/></w:pPr>
              ${renderRuns(item.number + '. ', true, false, '22')}
              ${renderRuns(item.text, false, false, '22')}
            </w:p>`;
          });
          return listXml;
        }

        case 'hr': {
          return `
          <w:p>
            <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="666666"/></w:pBdr><w:spacing w:before="100" w:after="100"/></w:pPr>
          </w:p>`;
        }

        case 'paragraph':
        default: {
          const txt = block.text || '';
          if (/\[\s*(?:চিত্র|ছবি)\s*আছে[^\]]*\]/i.test(txt)) {
            return `
            <w:tbl>
              <w:tblPr>
                <w:tblW w:w="5000" w:type="pct"/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                  <w:top w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:left w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:bottom w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:right w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:insideH w:val="none"/><w:insideV w:val="none"/>
                </w:tblBorders>
              </w:tblPr>
              <w:tr>
                <w:tc>
                  <w:tcPr>
                    <w:tcW w:w="5000" w:type="pct"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
                    <w:tcMar><w:top w:w="240" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
                    ${renderRuns(txt, false, true, '18', '<w:color w:val="475569"/>')}
                  </w:p>
                </w:tc>
              </w:tr>
            </w:tbl>`;
          }

          return `
          <w:p>
            <w:pPr><w:jc w:val="both"/><w:spacing w:after="60" w:line="240" w:lineRule="auto"/></w:pPr>
            ${renderRuns(txt, false, false, '22')}
          </w:p>`;
        }
      }
    }

    /**
     * Generate OOXML Section Properties (<w:sectPr>) for columns, page size, margins
     */
    static generateSectionProperties(layout) {
      const isLegal = layout.pageSize === 'legal';
      const isLandscape = layout.orientation === 'landscape';

      const pageW = isLegal ? '12240' : (isLandscape ? '16838' : '11906');
      const pageH = isLegal ? '20160' : (isLandscape ? '11906' : '16838');

      const mTop = Math.round(layout.margins.top * 1440);
      const mBottom = Math.round(layout.margins.bottom * 1440);
      const mLeft = Math.round(layout.margins.left * 1440);
      const mRight = Math.round(layout.margins.right * 1440);

      const isTwoCol = layout.columns === 2 || (layout.profile && (layout.profile.archetypeId === 'bengali_combined_exam_paper' || layout.profile.archetypeId === 'bengali_mcq_paper'));
      const colsXml = isTwoCol
        ? '<w:cols w:num="2" w:space="540" w:sep="1" w:equalWidth="1"/>'
        : '<w:cols w:num="1" w:space="720"/>';

      return `
      <w:sectPr>
        <w:pgSz w:w="${pageW}" w:h="${pageH}" ${isLandscape ? 'w:orient="landscape"' : ''}/>
        <w:pgMar w:top="${mTop}" w:right="${mRight}" w:bottom="${mBottom}" w:left="${mLeft}" w:header="720" w:footer="720" w:gutter="0"/>
        ${colsXml}
        <w:docGrid w:linePitch="360"/>
      </w:sectPr>`;
    }

    // --- Standard OOXML Boilerplate Part XMLs ---

    static getContentTypesXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
    }

    static getRootRelsXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    }

    static getDocumentRelsXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    }

    static getStylesXml(defaultFont = 'Times New Roman') {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${defaultFont}" w:hAnsi="${defaultFont}" w:cs="${defaultFont}"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;
    }
  }

  global.DocxLayoutBuilder = DocxLayoutBuilder;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocxLayoutBuilder;
  }

})(typeof window !== 'undefined' ? window : globalThis);
