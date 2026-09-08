// js/templates/engine.js
// Template registry, shared rendering primitives, bullet parsing, and layout dispatcher.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVTemplates = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const templatesRegistry = {};

  function registerTemplate(id, templateObj) {
    templatesRegistry[id] = templateObj;
  }

  function getTemplate(id) {
    return templatesRegistry[id] || templatesRegistry['modern'] || Object.values(templatesRegistry)[0];
  }

  function getAllTemplates() {
    return Object.values(templatesRegistry);
  }

  // --- SHARED RENDERING PRIMITIVES ---

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Parses multiline bullet points or paragraphs cleanly
  function formatBullets(text) {
    if (!text) return '';
    const lines = String(text).split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return '';

    let hasBullets = false;
    const formatted = [];

    lines.forEach(line => {
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        hasBullets = true;
        const cleanText = line.replace(/^[-•*]\s*/, '');
        formatted.push(`<li>${escapeHtml(cleanText)}</li>`);
      } else {
        formatted.push(`<p class="cv-paragraph">${escapeHtml(line)}</p>`);
      }
    });

    if (hasBullets) {
      let output = '';
      let insideUl = false;

      formatted.forEach(item => {
        if (item.startsWith('<li>')) {
          if (!insideUl) {
            output += '<ul class="cv-bullet-list">';
            insideUl = true;
          }
          output += item;
        } else {
          if (insideUl) {
            output += '</ul>';
            insideUl = false;
          }
          output += item;
        }
      });

      if (insideUl) output += '</ul>';
      return output;
    }

    return formatted.join('');
  }

  // Formats date ranges (e.g. "Jun 2021 - Present")
  function formatDateRange(startDate, endDate, isCurrent = false) {
    if (!startDate && !endDate && !isCurrent) return '';
    if (startDate && (endDate || isCurrent)) {
      const end = isCurrent ? 'Present' : (endDate || '');
      return `${escapeHtml(startDate)} – ${escapeHtml(end)}`;
    }
    return escapeHtml(startDate || endDate || (isCurrent ? 'Present' : ''));
  }

  // Builds CSS inline custom variables based on design settings
  function getDesignCssVariables(design = {}) {
    const fontSizeMap = {
      small: '9pt',
      normal: '10pt',
      large: '11pt'
    };
    const headingSizeMap = {
      compact: '0.9',
      normal: '1.0',
      prominent: '1.15'
    };
    const lineHeightMap = {
      tight: '1.3',
      normal: '1.5',
      relaxed: '1.7'
    };
    const spacingMap = {
      compact: '10px',
      normal: '16px',
      spacious: '22px'
    };
    const marginMap = {
      compact: '10mm',
      normal: '14mm',
      spacious: '18mm'
    };

    const fontVal = design.fontFamily || 'Inter, sans-serif';
    const baseFont = fontSizeMap[design.fontSize] || '10pt';
    const headingScale = headingSizeMap[design.headingSize] || '1.0';
    const lineH = lineHeightMap[design.lineHeight] || '1.5';
    const secSpacing = spacingMap[design.sectionSpacing] || '16px';
    const margin = marginMap[design.pageMargins] || '14mm';
    const accent = design.accentColor || '#1e3a8a';
    const text = design.textColor || '#0f172a';

    return `
      --cv-font: ${fontVal};
      --cv-font-size: ${baseFont};
      --cv-heading-scale: ${headingScale};
      --cv-line-height: ${lineH};
      --cv-section-spacing: ${secSpacing};
      --cv-page-margin: ${margin};
      --cv-accent: ${accent};
      --cv-text: ${text};
    `;
  }

  // Master render dispatcher
  function render(cvData) {
    if (!cvData) return '<div class="cv-empty-notice">No CV data provided</div>';

    const design = cvData.design || {};
    const templateId = design.template || 'modern';
    const template = getTemplate(templateId);

    const cssVars = getDesignCssVariables(design);
    const contentHtml = template.render(cvData, {
      escapeHtml,
      formatBullets,
      formatDateRange
    });

    return `
      <div class="cv-sheet-wrapper cv-template-${escapeHtml(templateId)}" style="${cssVars}">
        ${contentHtml}
      </div>
    `;
  }

  return {
    registerTemplate,
    getTemplate,
    getAllTemplates,
    escapeHtml,
    formatBullets,
    formatDateRange,
    getDesignCssVariables,
    render
  };
});
