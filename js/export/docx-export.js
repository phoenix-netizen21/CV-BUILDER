// js/export/docx-export.js
// Microsoft Word (.docx) export generator using OpenXML or HTML-Word fallback.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVDocxExport = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  async function exportDocx(cvData) {
    if (!cvData) return;
    const p = cvData.personal || {};
    const safeTitle = (cvData.title || p.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeTitle}.docx`;

    // Try loading native docx library
    if (typeof window.docx === 'undefined') {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/docx@8.2.2/build/index.js');
      } catch (e) {
        console.warn('Could not load docx library, falling back to Word-compliant HTML document...', e);
      }
    }

    if (typeof window.docx !== 'undefined') {
      try {
        const doc = buildNativeDocx(cvData);
        const blob = await window.docx.Packer.toBlob(doc);
        downloadBlob(blob, fileName);
        return;
      } catch (err) {
        console.warn('Native docx generation failed, falling back to Word HTML...', err);
      }
    }

    // Word HTML fallback
    generateWordHtml(cvData, fileName);
  }

  function buildNativeDocx(cv) {
    const { Document, Paragraph, TextRun, AlignmentType, BorderStyle } = window.docx;
    const p = cv.personal || {};
    const children = [];

    // Full name
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({
          text: p.fullName || 'Your Name',
          bold: true,
          size: 32, // 16pt
          font: 'Arial'
        })
      ]
    }));

    // Title
    if (p.professionalTitle) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: p.professionalTitle,
            italics: true,
            size: 22,
            color: '475569',
            font: 'Arial'
          })
        ]
      }));
    }

    // Contacts
    const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio].filter(Boolean);
    if (contacts.length > 0) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: contacts.join('   |   '),
            size: 18,
            color: '1e293b',
            font: 'Arial'
          })
        ],
        border: {
          bottom: {
            color: '94a3b8',
            space: 1,
            value: BorderStyle.SINGLE,
            size: 6
          }
        }
      }));
    }

    // Sections
    const order = cv.sectionOrder || [];
    const sectionsMap = new Map((cv.sections || []).map(s => [s.id, s]));

    for (const secId of order) {
      const sec = sectionsMap.get(secId);
      if (!sec || sec.visible === false) continue;

      // Section title header
      children.push(new Paragraph({
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: sec.title.toUpperCase(),
            bold: true,
            size: 22,
            font: 'Arial',
            color: '1e3a8a'
          })
        ],
        border: {
          bottom: {
            color: '1e3a8a',
            space: 1,
            value: BorderStyle.SINGLE,
            size: 8
          }
        }
      }));

      if (sec.type === 'summary' && sec.content) {
        children.push(new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: sec.content,
              size: 20,
              font: 'Arial'
            })
          ]
        }));
      } else if (Array.isArray(sec.items)) {
        sec.items.forEach(item => {
          const mainTitle = item.title || item.role || item.institution || item.company || item.name || '';
          const sub = item.company || item.degree || item.issuer || item.organization || '';
          const date = item.startDate ? `${item.startDate} – ${item.endDate || (item.current ? 'Present' : '')}` : (item.date || item.duration || '');

          if (mainTitle || sub) {
            children.push(new Paragraph({
              spacing: { before: 100, after: 40 },
              children: [
                new TextRun({ text: mainTitle, bold: true, size: 20, font: 'Arial' }),
                sub ? new TextRun({ text: `  |  ${sub}`, italics: true, size: 20, font: 'Arial', color: '475569' }) : new TextRun({ text: '' }),
                date ? new TextRun({ text: `   (${date})`, size: 18, font: 'Arial', color: '64748b' }) : new TextRun({ text: '' })
              ]
            }));
          }

          if (item.description) {
            const lines = item.description.split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(line => {
              const clean = line.replace(/^[-*•]\s*/, '');
              children.push(new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [new TextRun({ text: clean, size: 19, font: 'Arial' })]
              }));
            });
          }
        });
      }
    }

    return new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }
          }
        },
        children
      }]
    });
  }

  function generateWordHtml(cv, fileName) {
    const p = cv.personal || {};
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${cv.title || 'Resume'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.4; font-size: 10pt; }
        h1 { text-align: center; font-size: 18pt; margin-bottom: 2pt; }
        .subhead { text-align: center; color: #475569; font-size: 11pt; font-style: italic; }
        .contacts { text-align: center; font-size: 9pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 8pt; margin-bottom: 12pt; }
        .sec-title { color: #1e3a8a; border-bottom: 1.5pt solid #1e3a8a; font-size: 12pt; margin-top: 14pt; margin-bottom: 6pt; }
      </style></head>
      <body>
        <h1>${p.fullName || 'Your Name'}</h1>
        <div class="subhead">${p.professionalTitle || ''}</div>
        <div class="contacts">${[p.email, p.phone, p.location, p.linkedin].filter(Boolean).join('  |  ')}</div>
      </body></html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    downloadBlob(blob, fileName);
  }

  return {
    exportDocx
  };
});
