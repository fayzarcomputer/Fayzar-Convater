/**
 * ============================================================================
 * Fayzar Layout Engine - Microsoft Word 2003 (.doc) High-Fidelity Builder v1.0
 * ============================================================================
 * Generates genuine, beautifully styled Microsoft Word 2003 (.doc) documents
 * with exact 2-column questions, right-aligned marks, header blocks, tables,
 * and seamless SutonnyMJ (Bijoy) or Unicode font rendering.
 * 100% Compatible with Word 2003, 2007, 2010, 2013, 2016, 2019, 2021 & Office 365.
 * ============================================================================
 */

(function(global) {
  'use strict';

  class DocWord2003Builder {

    /**
     * Build Word 2003 .doc Blob from parsed AST
     * @param {Object} parsedAst - Output of MdLayoutParser.parse()
     * @param {Object} options - { font: 'SutonnyMJ' | 'Kalpurush', onProgress: Function }
     * @returns {Blob} Binary Blob with MIME 'application/msword'
     */
    static build(parsedAst, options = {}) {
      const opts = Object.assign({
        font: 'SutonnyMJ', // 'SutonnyMJ' (Bijoy) or 'Kalpurush' (Unicode)
        onProgress: (pct, msg) => {}
      }, options);

      opts.onProgress(10, 'ওয়ার্ড ২০০৩ আর্কিটেকচার প্রস্তুত হচ্ছে...');

      const meta = parsedAst.metadata || {};
      const layout = parsedAst.layoutSettings || {};
      const profile = parsedAst.profile || (parsedAst.layoutSettings && parsedAst.layoutSettings.profile);
      const docHasBengali = (typeof DocxLayoutBuilder !== 'undefined' && typeof DocxLayoutBuilder.hasBengali === 'function')
        ? DocxLayoutBuilder.hasBengali(parsedAst)
        : /[\u0980-\u09FF]/.test(JSON.stringify(parsedAst));
      const isPureEnglish = (profile && typeof profile.isPureEnglish === 'boolean')
        ? profile.isPureEnglish
        : !docHasBengali;
      const isBijoy = !isPureEnglish && opts.font === 'SutonnyMJ';
      const targetFont = isPureEnglish ? 'Times New Roman' : (isBijoy ? 'SutonnyMJ' : 'Kalpurush');

      // Helper to convert text if Bijoy selected
      const cvt = (str) => {
        if (!str) return '';
        if (isPureEnglish) return str;
        if (isBijoy) {
          if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.unicodeToBijoy === 'function') {
            return BanglaConverter.unicodeToBijoy(str);
          }
          if (typeof BanglaConverterEngine !== 'undefined' && typeof BanglaConverterEngine.convertUnicodeToBijoy === 'function') {
            return BanglaConverterEngine.convertUnicodeToBijoy(str);
          }
        }
        return str;
      };

      opts.onProgress(30, 'হেডার, মার্জিন ও লেআউট বিন্যাস তৈরি হচ্ছে...');

      // 1. Build Header HTML
      const headerHtml = DocWord2003Builder.buildHeaderHtml(meta, layout, cvt);

      // 2. Build Body Content (Combined, 1-Column, or 2-Column)
      opts.onProgress(60, 'প্রশ্নপত্র ও কলাম কাঠামো বিন্যাস হচ্ছে...');
      let bodyHtml = '';

      if (layout.profile && layout.profile.archetypeId === 'bengali_combined_exam_paper') {
        const breakIdx = parsedAst.blocks.findIndex(b => b.type === 'section_break');
        if (breakIdx !== -1) {
          const cqBlocks = parsedAst.blocks.slice(0, breakIdx);
          const mcqBlocks = parsedAst.blocks.slice(breakIdx + 1);
          bodyHtml = DocWord2003Builder.buildSingleColumnContent(cqBlocks, cvt, targetFont)
            + `<div style="page-break-before:always; margin:10pt 0 6pt 0; border-top:1.5pt solid #000; padding-top:4pt;">&nbsp;</div>`
            + DocWord2003Builder.buildTwoColumnContent(mcqBlocks, cvt, targetFont);
        } else {
          bodyHtml = DocWord2003Builder.buildSingleColumnContent(parsedAst.blocks, cvt, targetFont);
        }
      } else if (layout.columns === 2) {
        bodyHtml = DocWord2003Builder.buildTwoColumnContent(parsedAst.blocks, cvt, targetFont);
      } else {
        bodyHtml = DocWord2003Builder.buildSingleColumnContent(parsedAst.blocks, cvt, targetFont);
      }

      // 3. Stamp Margin for Legal Deeds
      let stampGapHtml = '';
      if (layout.stampMarginInches > 0) {
        stampGapHtml = `<div style="height:${(layout.stampMarginInches * 72).toFixed(0)}pt; mso-height-rule:exactly;">&nbsp;</div>`;
      }

      // 4. Construct Full Word 2003 Mso HTML Document
      opts.onProgress(85, 'ওয়ার্ড ২০০৩ স্পেসিফিকেশন প্যাকেজিং হচ্ছে...');
      const fullHtml = DocWord2003Builder.assembleWordDocument({
        headerHtml: headerHtml,
        bodyHtml: bodyHtml,
        stampGapHtml: stampGapHtml,
        meta: meta,
        layout: layout,
        fontFamily: targetFont
      });

      opts.onProgress(100, 'ওয়ার্ড ২০০৩ (.doc) ফাইল প্রস্তুত সম্পন্ন!');

      return new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
    }

    /**
     * Builds standard institutional/exam header
     */
    static buildHeaderHtml(meta, layout, cvt) {
      if (layout.templateId === 'official-notice') {
        return `
        <div style="text-align:center; margin-bottom:12pt;">
          <p style="font-size:15pt; font-weight:bold; margin:0 0 2pt 0;">${cvt(meta.institute || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার')}</p>
          <p style="font-size:12pt; font-weight:bold; margin:0 0 8pt 0;">${cvt(meta.subHeader || 'উপজেলা নির্বাহী অফিসারের কার্যালয়')}</p>
          <table style="width:100%; border:none; border-bottom:1pt solid #000; padding-bottom:4pt; margin-bottom:10pt;">
            <tr>
              <td style="text-align:left; border:none; font-size:11pt;"><b>${cvt('স্মারক নং:')}</b> ${cvt(meta.memoNo || '—')}</td>
              <td style="text-align:right; border:none; font-size:11pt;"><b>${cvt('তারিখ:')}</b> ${cvt(meta.date || '—')}</td>
            </tr>
          </table>
          ${meta.subject ? `<p style="text-align:left; font-size:12pt; font-weight:bold; margin:8pt 0 12pt 0;">${cvt('বিষয়: ' + meta.subject)}</p>` : ''}
        </div>`;
      }

      if (layout.templateId === 'legal-deed') {
        return `
        <div style="text-align:center; margin-bottom:14pt;">
          <p style="font-size:16pt; font-weight:bold; margin:0 0 4pt 0;">${cvt(meta.title || 'চুক্তিপত্র দলিল')}</p>
          <p style="font-size:11pt; margin:0 0 4pt 0;">${cvt(meta.stampValue || '')}</p>
          <p style="font-size:11pt; margin:0 0 10pt 0;">${cvt('তারিখ: ' + (meta.deedDate || ''))}</p>
          <hr style="border:0; border-top:1pt solid #000; margin:4pt 0 12pt 0;"/>
        </div>`;
      }

      // Academic Question Paper Header (Default)
      const institute = cvt(meta.institute || '');
      const exam = cvt(meta.exam || '');
      const grade = cvt(meta.grade ? `শ্রেণি: ${meta.grade}` : '');
      const subject = cvt(meta.subject ? `বিষয়: ${meta.subject}` : '');
      const time = cvt(meta.time ? `সময়: ${meta.time}` : '');
      const fullMarks = cvt(meta.fullMarks ? `পূর্ণমান: ${meta.fullMarks}` : '');
      const note = cvt(meta.note || '');

      return `
      <div style="text-align:center; margin-bottom:8pt;">
        ${institute ? `<p style="font-size:15pt; font-weight:bold; margin:0 0 2pt 0; line-height:1.2;">${institute}</p>` : ''}
        ${exam ? `<p style="font-size:13pt; font-weight:bold; margin:0 0 3pt 0; line-height:1.2;">${exam}</p>` : ''}
        
        ${(grade || subject) ? `
        <p style="font-size:11.5pt; font-weight:bold; margin:0 0 3pt 0;">
          ${grade ? `<span>${grade}</span>` : ''}
          ${(grade && subject) ? '&nbsp;&nbsp;|&nbsp;&nbsp;' : ''}
          ${subject ? `<span>${subject}</span>` : ''}
        </p>` : ''}

        ${meta.subjectCode ? (() => {
          const digits = String(meta.subjectCode).replace(/\D/g, '').split('');
          const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
          const cells = codeDigits.map(d => `<td style="border:1pt solid #000; width:16pt; text-align:center; font-size:10pt; font-weight:bold; padding:1pt;">${cvt(d)}</td>`).join('');
          return `<div style="text-align:center; margin:3pt 0 4pt 0;"><span style="font-size:10pt;">${cvt('বিষয় কোড: ')}</span><table align="center" style="display:inline-table; border-collapse:collapse; margin-left:4pt;"><tr>${cells}</tr></table></div>`;
        })() : ''}

        ${(time || fullMarks) ? `
        <table style="width:100%; border:none; margin:4pt 0 2pt 0; border-bottom:0.75pt solid #000; padding-bottom:2pt;">
          <tr>
            <td style="text-align:left; border:none; font-size:10.5pt; font-weight:bold;">${time}</td>
            <td style="text-align:right; border:none; font-size:10.5pt; font-weight:bold;">${fullMarks}</td>
          </tr>
        </table>` : ''}

        ${note ? `<p style="font-size:9.5pt; font-style:italic; margin:3pt 0 6pt 0; text-align:center;">${note}</p>` : ''}
      </div>`;
    }

    /**
     * Builds 2-Column Content using a balanced 2-column table for 100% Word 2003 fidelity
     */
    static buildTwoColumnContent(blocks, cvt, targetFont) {
      // Divide blocks into 2 roughly equal groups
      const col1 = [];
      const col2 = [];
      let totalWeight = 0;

      // Estimate weight of each block
      const weights = blocks.map(b => {
        if (b.type === 'question') return 3 + (b.subQuestions ? b.subQuestions.length * 2 : 0);
        if (b.type === 'table') return 6 + (b.rows ? b.rows.length : 0);
        if (b.type === 'heading') return 2;
        return 1;
      });

      const halfWeight = weights.reduce((a, b) => a + b, 0) / 2;
      let currentWeight = 0;

      for (let i = 0; i < blocks.length; i++) {
        if (currentWeight < halfWeight || col1.length === 0) {
          col1.push(blocks[i]);
          currentWeight += weights[i];
        } else {
          col2.push(blocks[i]);
        }
      }

      const col1Html = col1.map(b => DocWord2003Builder.renderBlock(b, cvt, targetFont)).join('\n');
      const col2Html = col2.map(b => DocWord2003Builder.renderBlock(b, cvt, targetFont)).join('\n');

      return `
      <table class="MsoTwoColumnTable" style="width:100%; border-collapse:collapse; border:none; mso-table-layout-alt:fixed; margin:0; padding:0;">
        <tr>
          <!-- Column 1 -->
          <td style="width:48.5%; vertical-align:top; border:none; padding-right:8pt; mso-padding-right-alt:8pt;">
            ${col1Html}
          </td>
          <!-- Column Divider Space -->
          <td style="width:3%; vertical-align:top; border:none; border-right:0.5pt dashed #999; mso-border-right-alt:0.5pt dashed #999;">
            &nbsp;
          </td>
          <!-- Column 2 -->
          <td style="width:48.5%; vertical-align:top; border:none; padding-left:8pt; mso-padding-left-alt:8pt;">
            ${col2Html}
          </td>
        </tr>
      </table>`;
    }

    /**
     * Builds 1-Column Content
     */
    static buildSingleColumnContent(blocks, cvt, targetFont) {
      return blocks.map(b => DocWord2003Builder.renderBlock(b, cvt, targetFont)).join('\n');
    }

    /**
     * Format math and chemical formulas into Word 2003 compatible HTML
     */
    static formatMath(text, cvt) {
      if (!text) return '';
      let s = text.replace(/\\rightarrow\b|\\to\b/g, '→');
      const EqConv = (typeof EquationConverter !== 'undefined') ? EquationConverter : (typeof globalThis !== 'undefined' && globalThis.EquationConverter ? globalThis.EquationConverter : null);
      if (EqConv && /\$|\\frac|\\sqrt|\^|_/.test(s)) {
        const segments = EqConv.splitTextAndMath(s);
        let out = '';
        for (const seg of segments) {
          if (seg.type === 'math') {
            let mVal = seg.value.trim().replace(/\\rightarrow\b|\\to\b/g, '→');
            mVal = mVal.replace(/([a-zA-Z0-9]+)_\{?([0-9a-zA-Z]+)\}?/g, '$1<sub>$2</sub>');
            mVal = mVal.replace(/([a-zA-Z0-9]+)\^\{?([0-9a-zA-Z]+)\}?/g, '$1<sup>$2</sup>');
            out += mVal;
          } else {
            out += cvt(seg.value);
          }
        }
        return out;
      }
      return cvt(s);
    }

    /**
     * Renders an individual block to Word 2003 compatible HTML
     */
    static renderBlock(block, cvt, targetFont) {
      if (!block) return '';
      const isPureEnglish = (targetFont === 'Times New Roman');
      const formatMath = (t) => DocWord2003Builder.formatMath(t, cvt);

      switch (block.type) {
        case 'section_break': {
          let hHtml = '<div style="page-break-before:always; margin:10pt 0 6pt 0; border-top:1.5pt solid #000; padding-top:4pt;">&nbsp;</div>';
          if (block.mcqHeader) {
            const h = block.mcqHeader;
            hHtml += '<div style="text-align:center; margin-bottom:8pt;">';
            if (h.institute) hHtml += `<p style="font-size:14pt; font-weight:bold; margin:0 0 2pt 0;">${cvt(h.institute)}</p>`;
            if (h.exam) hHtml += `<p style="font-size:12pt; font-weight:bold; margin:0 0 2pt 0;">${cvt(h.exam)}</p>`;
            if (h.grade) hHtml += `<p style="font-size:11pt; font-weight:bold; margin:0 0 2pt 0;">${cvt(h.grade)}</p>`;
            if (h.subjectCode) {
              const digits = String(h.subjectCode).replace(/\D/g, '').split('');
              const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
              const cells = codeDigits.map(d => `<td style="border:1pt solid #000; width:16pt; text-align:center; font-size:10pt; font-weight:bold; padding:1pt;">${cvt(d)}</td>`).join('');
              hHtml += `<div style="text-align:center; margin:3pt 0 4pt 0;"><span style="font-size:10pt;">${cvt('বিষয় কোড: ')}</span><table align="center" style="display:inline-table; border-collapse:collapse; margin-left:4pt;"><tr>${cells}</tr></table></div>`;
            }
            if (h.title) hHtml += `<p style="font-size:13pt; font-weight:bold; margin:3pt 0 2pt 0;">${cvt(h.title)}</p>`;
            if (h.timeMarks) hHtml += `<p style="font-size:10.5pt; font-weight:bold; margin:2pt 0 4pt 0;">${cvt(h.timeMarks)}</p>`;
            if (h.note) hHtml += `<p style="font-size:9.5pt; font-style:italic; margin:2pt 0 6pt 0;">${cvt(h.note)}</p>`;
            hHtml += '<hr style="border:0; border-top:1pt solid #000; margin:4pt 0 8pt 0;"/></div>';
          }
          return hHtml;
        }
        case 'header_time_marks': {
          const timeText = block.time || '';
          const marksText = block.marks || '';
          return `
          <table style="width:100%; border:none; border-bottom:0.75pt solid #000; padding-bottom:2pt; margin:4pt 0 6pt 0;">
            <tr>
              <td style="text-align:left; border:none; font-size:10.5pt; font-weight:bold;">${cvt(timeText)}</td>
              <td style="text-align:right; border:none; font-size:10.5pt; font-weight:bold;">${cvt(marksText)}</td>
            </tr>
          </table>`;
        }

        case 'heading': {
          const size = block.level === 1 ? '13pt' : (block.level === 2 ? '12pt' : '11pt');
          return `<p class="MsoHeading" style="font-size:${size}; font-weight:bold; margin:6pt 0 3pt 0; text-align:center; border-bottom:0.5pt solid #ccc; padding-bottom:1pt;">${cvt(block.text)}</p>`;
        }

        case 'question': {
          let html = '<div class="MsoQuestionBlock" style="margin-bottom:6pt;">';
          const rawDelim = block.delimiter || (isPureEnglish ? '.' : '।');
          const qNumDelim = (isPureEnglish || rawDelim === '.') ? '. ' : (rawDelim.trim() + ' ');
          const formattedMarks = block.marks ? ((isPureEnglish || block.marks.includes('=')) ? `[${block.marks}]` : cvt(block.marks)) : '';

          // Question header row with hanging indent (number in dedicated column)
          html += `
          <table style="width:100%; border:none; border-collapse:collapse; margin:0; padding:0;">
            <tr>
              <td style="width:22pt; vertical-align:top; border:none; font-size:11pt; font-weight:bold; white-space:nowrap; padding:0;">
                ${cvt(block.number + qNumDelim)}
              </td>
              <td style="text-align:left; vertical-align:top; border:none; font-size:11pt; line-height:1.25; padding:0 4pt;">
                ${formatMath(block.text)}
              </td>
              ${formattedMarks ? `
              <td style="text-align:right; vertical-align:top; border:none; width:36pt; white-space:nowrap; font-size:11pt; font-weight:bold; padding:0;">
                ${formattedMarks}
              </td>` : ''}
            </tr>
          </table>`;

          // Stimulus if any
          if (block.stimulus) {
            const stimLines = block.stimulus.split('\n');
            for (const sLine of stimLines) {
              if (!sLine.trim()) continue;
              html += `<p style="font-size:10.5pt; margin:1pt 0 2pt 22pt; line-height:1.2;">${formatMath(sLine)}</p>`;
            }
          }

          // Sub-questions (ক, খ, গ, ঘ) or MCQ options
          if (block.subQuestions && block.subQuestions.length > 0) {
            for (const sub of block.subQuestions) {
              const isMcqRow = sub.isMcqOptionsRow || /(?:[খ-ঘ][\.\)]|\t)/.test(sub.text);
              const subFormattedMarks = sub.marks ? ((isPureEnglish || sub.marks.includes('=')) ? `[${sub.marks}]` : cvt(sub.marks)) : '';

              if (sub.isPromptText) {
                html += `<p style="font-size:10.5pt; font-weight:bold; margin:2pt 0 2pt 22pt;">${formatMath(sub.text)}</p>`;
              } else if (isMcqRow) {
                // MCQ Options: Aligned cleanly under question text without double indent
                html += `
                <table style="width:100%; border:none; border-collapse:collapse; margin:1pt 0; padding:0;">
                  <tr>
                    <td style="width:22pt; border:none; padding:0;">&nbsp;</td>
                    <td style="text-align:left; vertical-align:top; border:none; font-size:10.5pt; line-height:1.25; padding:0 4pt;">
                      ${formatMath((sub.subId ? sub.subId + ' ' : '') + sub.text)}
                    </td>
                    ${subFormattedMarks ? `
                    <td style="text-align:right; vertical-align:top; border:none; width:36pt; white-space:nowrap; font-size:10.5pt; font-weight:bold; padding:0;">
                      ${subFormattedMarks}
                    </td>` : ''}
                  </tr>
                </table>`;
              } else {
                // Standard Creative Sub-question: Hanging indent
                html += `
                <table style="width:100%; border:none; border-collapse:collapse; margin:1pt 0; padding:0;">
                  <tr>
                    <td style="width:22pt; border:none; padding:0;">&nbsp;</td>
                    <td style="width:22pt; vertical-align:top; border:none; font-size:10.5pt; font-weight:bold; white-space:nowrap; padding:0;">
                      ${cvt(sub.subId)}
                    </td>
                    <td style="text-align:left; vertical-align:top; border:none; font-size:10.5pt; line-height:1.25; padding:0 4pt;">
                      ${formatMath(sub.text)}
                    </td>
                    ${subFormattedMarks ? `
                    <td style="text-align:right; vertical-align:top; border:none; width:36pt; white-space:nowrap; font-size:10.5pt; font-weight:bold; padding:0;">
                      ${subFormattedMarks}
                    </td>` : ''}
                  </tr>
                </table>`;
              }
            }
          }

          html += '</div>';
          return html;
        }

        case 'stimulus_box': {
          return `
          <div style="border:0.75pt solid #666; background:#f9f9f9; padding:4pt 6pt; margin:4pt 0 5pt 0; font-size:10.5pt; line-height:1.25; border-radius:2pt;">
            ${cvt(block.text).replace(/\n/g, '<br/>')}
          </div>`;
        }

        case 'table': {
          let tblHtml = '<table class="MsoNormalTable" style="border-collapse:collapse; border:0.5pt solid #000; margin:4pt 0;">';

          // Plain normal header row without gray background
          if (block.headers && block.headers.length > 0) {
            tblHtml += '<tr>';
            block.headers.forEach((h, idx) => {
              const align = (block.alignments && block.alignments[idx]) || 'left';
              tblHtml += `<td style="border:0.5pt solid #000; padding:1.5pt 3pt; font-size:10.5pt; text-align:${align}; line-height:1.15;">${cvt(h)}</td>`;
            });
            tblHtml += '</tr>';
          }

          // Rows
          if (block.rows && block.rows.length > 0) {
            block.rows.forEach(row => {
              tblHtml += '<tr>';
              row.forEach((cell, idx) => {
                const align = (block.alignments && block.alignments[idx]) || 'left';
                tblHtml += `<td style="border:0.5pt solid #000; padding:1.5pt 3pt; font-size:10.5pt; text-align:${align}; line-height:1.15;">${cvt(cell)}</td>`;
              });
              tblHtml += '</tr>';
            });
          }

          tblHtml += '</table>';
          return tblHtml;
        }

        case 'unordered_list': {
          let listHtml = '<ul style="margin:2pt 0 4pt 15pt; padding:0;">';
          block.items.forEach(item => {
            listHtml += `<li style="font-size:11pt; margin-bottom:1.5pt; line-height:1.25;">${cvt(item)}</li>`;
          });
          listHtml += '</ul>';
          return listHtml;
        }

        case 'ordered_list': {
          let listHtml = '<ol style="margin:2pt 0 4pt 15pt; padding:0;">';
          block.items.forEach(item => {
            listHtml += `<li style="font-size:11pt; margin-bottom:1.5pt; line-height:1.25;">${cvt(item.text)}</li>`;
          });
          listHtml += '</ol>';
          return listHtml;
        }

        case 'hr': {
          return '<hr style="border:0; border-top:0.75pt solid #666; margin:6pt 0;"/>';
        }

        case 'paragraph':
        default: {
          return `<p style="font-size:11pt; margin:0 0 4pt 0; line-height:1.25; text-align:justify;">${cvt(block.text)}</p>`;
        }
      }
    }

    /**
     * Assembles the complete Word 2003 Mso HTML structure
     */
    static assembleWordDocument({ headerHtml, bodyHtml, stampGapHtml, meta, layout, fontFamily }) {
      const pageW = layout.pageSize === 'legal' ? '612.0pt' : (layout.orientation === 'landscape' ? '841.9pt' : '595.3pt');
      const pageH = layout.pageSize === 'legal' ? '1008.0pt' : (layout.orientation === 'landscape' ? '595.3pt' : '841.9pt');
      const mTop = (layout.margins.top * 72).toFixed(1) + 'pt';
      const mBottom = (layout.margins.bottom * 72).toFixed(1) + 'pt';
      const mLeft = (layout.margins.left * 72).toFixed(1) + 'pt';
      const mRight = (layout.margins.right * 72).toFixed(1) + 'pt';

      return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 11">
<meta name="Originator" content="Microsoft Word 11">
<!--[if gte mso 9]>
<xml>
 <o:DocumentProperties>
  <o:Author>Fayzar Computer</o:Author>
  <o:Company>Fayzar Computer & Photostat</o:Company>
  <o:Title>${meta.title || meta.exam || 'Document'}</o:Title>
  <o:Created>${new Date().toISOString()}</o:Created>
 </o:DocumentProperties>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:SpellingState>Clean</w:SpellingState>
  <w:GrammarState>Clean</w:GrammarState>
  <w:Compatibility>
   <w:BreakWrappedTables/>
   <w:SnapToGridInCell/>
   <w:WrapTextWithPunct/>
   <w:UseAsianBreakRules/>
   <w:DontGrowAutofit/>
  </w:Compatibility>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
<!--
 @font-face {
   font-family: "${fontFamily}";
   mso-font-alt: "Arial";
 }
 @page Section1 {
   size: ${pageW} ${pageH};
   margin: ${mTop} ${mRight} ${mBottom} ${mLeft};
   mso-header-margin: 36.0pt;
   mso-footer-margin: 36.0pt;
   mso-paper-source: 0;
 }
 div.Section1 {
   page: Section1;
 }
 body {
   font-family: "${fontFamily}", "Times New Roman", Arial, sans-serif;
   font-size: 11.0pt;
   color: #000000;
   background: #ffffff;
 }
 p, div, td, th {
   font-family: "${fontFamily}", "Times New Roman", Arial, sans-serif;
 }
 table {
   border-collapse: collapse;
   mso-table-layout-alt: fixed;
 }
-->
</style>
</head>
<body lang="BN">
<div class="Section1">
  ${stampGapHtml}
  ${headerHtml}
  ${bodyHtml}
</div>
</body>
</html>`;
    }
  }

  // Export to global scope
  global.DocWord2003Builder = DocWord2003Builder;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocWord2003Builder;
  }
})(typeof window !== 'undefined' ? window : this);
