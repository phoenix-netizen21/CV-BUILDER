// js/templates/minimal.js
// Template 1: Minimal — Clean, single-column, strictly ATS-friendly.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    factory(root.CVTemplates);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  const MinimalTemplate = {
    id: 'minimal',
    name: 'Minimal ATS',
    description: 'Ultra-clean single column layout, zero tables or graphics. Highly ATS-compliant.',
    render(cv, utils) {
      const { escapeHtml, formatBullets, formatDateRange } = utils;
      const p = cv.personal || {};

      // Contacts line
      const contactItems = [];
      if (p.email) contactItems.push(escapeHtml(p.email));
      if (p.phone) contactItems.push(escapeHtml(p.phone));
      if (p.location) contactItems.push(escapeHtml(p.location));
      if (p.linkedin) contactItems.push(`<a href="${escapeHtml(p.linkedin)}" target="_blank">${escapeHtml(p.linkedin.replace(/^https?:\/\/(www\.)?/, ''))}</a>`);
      if (p.github) contactItems.push(`<a href="${escapeHtml(p.github)}" target="_blank">${escapeHtml(p.github.replace(/^https?:\/\/(www\.)?/, ''))}</a>`);
      if (p.portfolio) contactItems.push(`<a href="${escapeHtml(p.portfolio)}" target="_blank">${escapeHtml(p.portfolio.replace(/^https?:\/\/(www\.)?/, ''))}</a>`);

      let html = `
        <div class="ats-header" data-section-id="personal">
          <h1 class="ats-name">${escapeHtml(p.fullName || 'Your Name')}</h1>
          ${p.professionalTitle ? `<div class="ats-title">${escapeHtml(p.professionalTitle)}</div>` : ''}
          ${contactItems.length > 0 ? `<div class="ats-contact-row">${contactItems.join(' &nbsp;|&nbsp; ')}</div>` : ''}
        </div>
      `;

      // Render sections in user-defined order
      const order = cv.sectionOrder || [];
      const sectionsMap = new Map((cv.sections || []).map(s => [s.id, s]));

      for (const secId of order) {
        const sec = sectionsMap.get(secId);
        if (!sec || sec.visible === false) continue;

        let secBody = '';

        if (sec.type === 'summary') {
          if (!sec.content) continue;
          secBody = `<div class="ats-summary">${formatBullets(sec.content)}</div>`;
        } else if (sec.type === 'experience') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.company && !item.role && !item.title && !item.description) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="ats-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="ats-item-header">
                  <span class="ats-item-role"><strong>${escapeHtml(item.role || item.title || '')}</strong>${item.company ? `, ${escapeHtml(item.company)}` : ''}</span>
                  <span class="ats-item-date">${dates}</span>
                </div>
                ${item.location ? `<div class="ats-item-sub">${escapeHtml(item.location)}</div>` : ''}
                ${item.description ? `<div class="ats-item-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'education') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.institution && !item.degree) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="ats-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="ats-item-header">
                  <span class="ats-item-role"><strong>${escapeHtml(item.institution || '')}</strong></span>
                  <span class="ats-item-date">${dates}</span>
                </div>
                <div class="ats-item-sub">
                  ${escapeHtml(item.degree || '')}${item.fieldOfStudy ? ` in ${escapeHtml(item.fieldOfStudy)}` : ''}
                  ${item.score ? ` &bull; GPA / Score: ${escapeHtml(item.score)}` : ''}
                  ${item.location ? ` &bull; ${escapeHtml(item.location)}` : ''}
                </div>
                ${item.coursework ? `<div class="ats-item-desc"><p>Relevant Coursework: ${escapeHtml(item.coursework)}</p></div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'projects') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title && !item.description) return '';
            return `
              <div class="ats-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="ats-item-header">
                  <span class="ats-item-role">
                    <strong>${escapeHtml(item.title || '')}</strong>
                    ${item.role ? ` &bull; <em>${escapeHtml(item.role)}</em>` : ''}
                    ${item.technologies ? ` (${escapeHtml(item.technologies)})` : ''}
                  </span>
                  ${item.duration ? `<span class="ats-item-date">${escapeHtml(item.duration)}</span>` : ''}
                </div>
                ${item.link ? `<div class="ats-item-sub"><a href="${escapeHtml(item.link)}" target="_blank">${escapeHtml(item.link)}</a></div>` : ''}
                ${item.description ? `<div class="ats-item-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'skills') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="ats-skills-list">${sec.items.map(group => {
            const skillArray = Array.isArray(group.skills) ? group.skills : (typeof group.skills === 'string' ? group.skills.split(',').map(s => s.trim()) : []);
            if (skillArray.length === 0) return '';
            return `<div class="ats-skill-line"><strong>${escapeHtml(group.category || 'Skills')}:</strong> ${skillArray.map(s => escapeHtml(s)).join(', ')}</div>`;
          }).join('')}</div>`;
        } else if (sec.type === 'certifications') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.name) return '';
            return `
              <div class="ats-item-compact" data-item-id="${escapeHtml(item.id || '')}">
                <strong>${escapeHtml(item.name)}</strong>${item.issuer ? ` &bull; ${escapeHtml(item.issuer)}` : ''}
                ${item.date ? ` (${escapeHtml(item.date)})` : ''}
                ${item.link ? ` &bull; <a href="${escapeHtml(item.link)}" target="_blank">View</a>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'achievements') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title) return '';
            return `
              <div class="ats-item-compact" data-item-id="${escapeHtml(item.id || '')}">
                <strong>${escapeHtml(item.title)}</strong>${item.issuer ? ` &bull; ${escapeHtml(item.issuer)}` : ''}
                ${item.date ? ` (${escapeHtml(item.date)})` : ''}
                ${item.description ? ` &ndash; ${escapeHtml(item.description)}` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'languages') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          const langs = sec.items.filter(l => l.language).map(l => `${escapeHtml(l.language)}${l.proficiency ? ` (${escapeHtml(l.proficiency)})` : ''}`);
          if (langs.length === 0) continue;
          secBody = `<p class="ats-inline-list">${langs.join(', ')}</p>`;
        } else if (sec.type === 'interests') {
          const items = Array.isArray(sec.items) ? sec.items : [];
          if (items.length === 0) continue;
          secBody = `<p class="ats-inline-list">${items.map(i => escapeHtml(i)).join(', ')}</p>`;
        } else {
          // Generic list section (publications, leadership, volunteering, custom)
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            const mainTitle = item.title || item.role || item.activity || item.name || '';
            const subTitle = item.organization || item.institution || item.journal || item.authors || item.subtitle || '';
            const date = item.duration || item.date || '';
            if (!mainTitle && !item.description) return '';
            return `
              <div class="ats-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="ats-item-header">
                  <span class="ats-item-role"><strong>${escapeHtml(mainTitle)}</strong>${subTitle ? `, ${escapeHtml(subTitle)}` : ''}</span>
                  ${date ? `<span class="ats-item-date">${escapeHtml(date)}</span>` : ''}
                </div>
                ${item.description ? `<div class="ats-item-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        }

        if (secBody.trim()) {
          html += `
            <div class="ats-section" data-section-id="${escapeHtml(sec.id)}">
              <h2 class="ats-section-title">${escapeHtml(sec.title.toUpperCase())}</h2>
              <div class="ats-section-body">${secBody}</div>
            </div>
          `;
        }
      }

      return html;
    }
  };

  Engine.registerTemplate('minimal', MinimalTemplate);
  return MinimalTemplate;
});
