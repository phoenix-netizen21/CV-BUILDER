// docx-generator.js
// Exporter module that translates structured CV states into MS Word (.docx) files.
// Utilizes the 'docx' JS library. Employs a formatted HTML-to-doc package fallback for maximum robustness.

async function exportToDocx(data, sectionOrder, hiddenSections) {
  const personal = data.personal || {};
  const firstName = personal.fullName ? personal.fullName.split(" ")[0] : "Firstname";
  const lastName = personal.fullName ? personal.fullName.split(" ").slice(1).join(" ") || "Lastname" : "Lastname";
  const fileName = `${firstName}_${lastName}_CV.docx`;

  // Check if docx library is loaded
  if (typeof window.docx !== "undefined") {
    try {
      const doc = generateNativeDocx(data, sectionOrder, hiddenSections);
      const blob = await window.docx.Packer.toBlob(doc);
      downloadBlob(blob, fileName);
      return;
    } catch (e) {
      console.warn("Failed to generate native docx, falling back to HTML-Word template...", e);
    }
  }

  // Fallback to Word-compliant HTML template
  generateHtmlWordDoc(data, sectionOrder, hiddenSections, fileName);
}

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper to check if object values are all empty
function isEmptyObject(obj) {
  if (!obj) return true;
  return Object.values(obj).every(val => !val || val === "");
}

// Generate an authentic OpenXML Word document using the docx library
function generateNativeDocx(data, sectionOrder, hiddenSections) {
  const { Document, Paragraph, TextRun, AlignmentType, BorderStyle } = window.docx;
  const personal = data.personal || {};
  
  const children = [];

  // Header: Full Name
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: personal.fullName || "Your Name",
        bold: true,
        size: 32, // 16 pt
        font: "Arial"
      })
    ]
  }));

  // Professional Title
  if (personal.professionalTitle) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: personal.professionalTitle,
          italics: true,
          size: 24, // 12 pt
          color: "475569", // Dark Slate Gray
          font: "Arial"
        })
      ]
    }));
  }

  // Contact Info
  const contacts = [];
  if (personal.email) contacts.push(personal.email);
  if (personal.phone) contacts.push(personal.phone);
  if (personal.location) contacts.push(personal.location);
  if (personal.linkedin) contacts.push(personal.linkedin.replace(/^https?:\/\/(www\.)?/, ""));
  if (personal.github) contacts.push(personal.github.replace(/^https?:\/\/(www\.)?/, ""));
  if (personal.portfolio) contacts.push(personal.portfolio.replace(/^https?:\/\/(www\.)?/, ""));

  if (contacts.length > 0) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contacts.join("   |   "),
          size: 18, // 9 pt
          font: "Arial",
          color: "1e293b"
        })
      ]
    }));
  }

  // Horizontal divider
  children.push(new Paragraph({
    spacing: { after: 200 },
    border: {
      bottom: {
        color: "cbd5e1",
        space: 1,
        value: BorderStyle.SINGLE,
        size: 6
      }
    }
  }));

  // Summary Section
  if (personal.summary && !hiddenSections.has("personal-summary")) {
    // Section Header
    children.push(new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({
          text: "PROFESSIONAL SUMMARY",
          bold: true,
          size: 22, // 11 pt
          font: "Arial",
          color: "1e3a8a" // dark blue
        })
      ],
      border: {
        bottom: {
          color: "1e3a8a",
          space: 3,
          value: BorderStyle.SINGLE,
          size: 6
        }
      }
    }));

    // Summary Text
    children.push(new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: personal.summary,
          size: 20, // 10 pt
          font: "Arial"
        })
      ]
    }));
  }

  // Iterate other sections
  for (const secId of sectionOrder) {
    if (secId === "personal") continue;
    if (hiddenSections.has(secId)) continue;

    const secData = data[secId];
    if (!secData || (Array.isArray(secData) && secData.length === 0)) continue;

    const secConfig = window.CV_CATEGORIES[data.category]?.sections.find(s => s.id === secId);
    if (!secConfig) continue;

    // Add Section Title
    children.push(new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: secConfig.title.toUpperCase(),
          bold: true,
          size: 22,
          font: "Arial",
          color: "1e3a8a"
        })
      ],
      border: {
        bottom: {
          color: "1e3a8a",
          space: 3,
          value: BorderStyle.SINGLE,
          size: 6
        }
      }
    }));

    if (secConfig.type === "tags") {
      const tags = Array.isArray(secData) ? secData : (typeof secData === "string" ? secData.split(",").map(t => t.trim()) : []);
      if (tags.length > 0 && tags[0] !== "") {
        children.push(new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: tags.join(", "),
              size: 20,
              font: "Arial"
            })
          ]
        }));
      }
    } else if (secConfig.type === "list" && Array.isArray(secData)) {
      for (const item of secData) {
        if (isEmptyObject(item)) continue;

        const mainTitle = item.companyName || item.collegeName || item.schoolName || item.organization || item.activity || item.title || "";
        const subtitle = item.roleName || item.degree || item.gradeClass || item.activity || item.issuer || item.authors || "";
        const duration = item.duration || item.graduationYear || item.date || "";
        const extraInfo = item.cgpa || item.cgpaScore || item.department || item.thesisTitle || item.journalName || item.amount || "";

        // Header Line
        children.push(new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: mainTitle,
              bold: true,
              size: 20,
              font: "Arial"
            }),
            new TextRun({
              text: duration ? ` (${duration})` : "",
              size: 18,
              font: "Arial",
              color: "475569"
            })
          ]
        }));

        // Subtitle line
        if (subtitle || extraInfo) {
          const subText = [subtitle, extraInfo].filter(x => x).join(" | ");
          children.push(new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: subText,
                italics: true,
                size: 18,
                font: "Arial",
                color: "334155"
              })
            ]
          }));
        }

        // Bullet point mapping
        const responsibilities = item.responsibilities || item.achievements || item.description || item.projectsText || "";
        if (responsibilities) {
          const lines = responsibilities.split("\n").map(l => l.trim()).filter(l => l.length > 0);
          for (const line of lines) {
            let cleanLine = line;
            if (line.startsWith("-") || line.startsWith("*")) {
              cleanLine = line.substring(1).trim();
            }
            children.push(new Paragraph({
              bullet: {
                level: 0
              },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: cleanLine,
                  size: 18,
                  font: "Arial"
                })
              ]
            }));
          }
        }
      }
    }
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      children: children
    }]
  });
}

// Fallback Word Document generation using Word-parseable HTML with standard metadata layout
function generateHtmlWordDoc(data, sectionOrder, hiddenSections, fileName) {
  const personal = data.personal || {};
  
  // Grab the rendered HTML of the preview CV
  const activeTemplate = data.template || "modern_prof";
  const engine = window.TEMPLATE_ENGINES[activeTemplate] || window.TEMPLATE_ENGINES["modern_prof"];
  const cvHtml = engine.render(data, sectionOrder, hiddenSections);

  // We embed some specific MS Word styles inside the template HTML to look elegant
  const wordStyles = `
    @page {
      size: 8.5in 11in;
      margin: 0.75in;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #333333;
      background-color: #ffffff;
    }
    h1 { font-size: 18pt; font-weight: bold; margin-bottom: 2pt; color: #000000; text-align: center; }
    h2 { font-size: 12pt; font-weight: bold; margin-bottom: 4pt; color: #475569; text-align: center; }
    h3.cv-section-title, h2.ats-section-title, h2.exec-section-title, h2.acad-section-title {
      font-size: 11pt;
      font-weight: bold;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 3pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
      color: #1e3a8a;
      text-transform: uppercase;
    }
    .cv-contacts, .ats-contacts, .exec-contacts, .acad-contacts {
      text-align: center;
      font-size: 9pt;
      margin-bottom: 8pt;
      color: #475569;
    }
    .cv-links, .exec-links-row, .acad-links {
      text-align: center;
      font-size: 9pt;
      margin-bottom: 12pt;
    }
    .cv-list-item, .ats-list-item, .exec-list-item, .acad-list-item {
      margin-bottom: 8pt;
      page-break-inside: avoid;
    }
    .cv-item-header, .ats-item-header, .acad-item-row {
      font-weight: bold;
      margin-bottom: 2pt;
    }
    .cv-item-sub, .ats-item-subheader, .exec-item-sub, .acad-sub {
      font-style: italic;
      color: #475569;
      margin-bottom: 4pt;
    }
    .cv-tag-item, .exec-tag {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 6px;
      margin-right: 4px;
      margin-bottom: 4px;
      font-size: 9pt;
      display: inline-block;
    }
    ul.cv-bullets {
      margin-top: 2pt;
      margin-bottom: 4pt;
      padding-left: 20px;
    }
    li {
      margin-bottom: 2pt;
    }
    p {
      margin-top: 0;
      margin-bottom: 4pt;
    }
    a {
      color: #1e3a8a;
      text-decoration: none;
    }
  `;

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(personal.fullName || "CV")}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        ${wordStyles}
      </style>
    </head>
    <body>
      ${cvHtml}
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
  downloadBlob(blob, fileName);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

if (typeof window !== "undefined") {
  window.exportToDocx = exportToDocx;
}
