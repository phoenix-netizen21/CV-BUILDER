// js/templates/corporate.js
// Template 3: Corporate Executive — Conservative, authoritative, traditional serif style.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    factory(root.CVTemplates);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  const CorporateTemplate = {
    id: 'corporate',
    name: 'Corporate Executive',
    description: 'Traditional, prestigious layout with serif headings, clean divider rules, and tabular alignments.',
    render(cv, utils) {
      const { escapeHtml, formatBullets, formatDateRange } = utils;
      const p = cv.personal || {};

      const contacts = [];
      if (p.email) contacts.push(`<span><i class="fa-solid fa-envelope"></i> ${escapeHtml(p.email)}</span>`);
      if (p.phone) contacts.push(`<span><i class="fa-solid fa-phone"></i> ${escapeHtml(p.phone)}</span>`);
      if (p.location) contacts.push(`<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.location)}</span>`);

      const links = [];
      if (p.linkedin) links.push(`<a href="${escapeHtml(p.linkedin)}" target="_blank"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>`);
      if (p.github) links.push(`<a href="${escapeHtml(p.github)}" target="_blank"><i class="fa-brands fa-github"></i> GitHub</a>`);
      if (p.portfolio) links.push(`<a href="${escapeHtml(p.portfolio)}" target="_blank"><i class="fa-solid fa-globe"></i> Portfolio</a>`);

      let html = `
        <div class="corp-banner"></div>
        <div class="corp-header" data-section-id="personal">
          <h1 class="corp-name">${escapeHtml(p.fullName || 'Your Name')}</h1>
          ${p.professionalTitle ? `<div class="corp-title">${escapeHtml(p.professionalTitle)}</div>` : ''}
          ${contacts.length > 0 ? `<div class="corp-contact-row">${contacts.join(' &nbsp;&bull;&nbsp; ')}</div>` : ''}
          ${links.length > 0 ? `<div class="corp-links-row">${links.join(' &nbsp;|&nbsp; ')}</div>` : ''}
        </div>
      `;

      const order = cv.sectionOrder || [];
      const sectionsMap = new Map((cv.sections || []).map(s => [s.id, s]));

      for (const secId of order) {
        const sec = sectionsMap.get(secId);
        if (!sec || sec.visible === false) continue;

        let secBody = '';

        if (sec.type === 'summary') {
          if (!sec.content) continue;
          secBody = `<div class="corp-summary">${formatBullets(sec.content)}</div>`;
        } else if (sec.type === 'experience') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.company && !item.role && !item.title && !item.description) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="corp-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="corp-item-table">
                  <div class="corp-item-col-left">
                    <span class="corp-main-title">${escapeHtml(item.role || item.title || '')}</span>
                    ${item.company ? `<span class="corp-sub-title"> &bull; ${escapeHtml(item.company)}</span>` : ''}
                    ${item.location ? `<span class="corp-location-tag">(${escapeHtml(item.location)})</span>` : ''}
                  </div>
                  <div class="corp-item-col-right">${dates}</div>
                </div>
                ${item.description ? `<div class="corp-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'education') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.institution && !item.degree) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="corp-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="corp-item-table">
                  <div class="corp-item-col-left">
                    <span class="corp-main-title">${escapeHtml(item.institution || '')}</span>
                    <span class="corp-sub-title"> &bull; ${escapeHtml(item.degree || '')}${item.fieldOfStudy ? `, ${escapeHtml(item.fieldOfStudy)}` : ''}</span>
                    ${item.score ? `<span class="corp-score-tag">(Score: ${escapeHtml(item.score)})</span>` : ''}
                  </div>
                  <div class="corp-item-col-right">${dates}</div>
                </div>
                ${item.coursework ? `<div class="corp-desc"><p>Coursework: ${escapeHtml(item.coursework)}</p></div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'projects') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title && !item.description) return '';
            return `
              <div class="corp-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="corp-item-table">
                  <div class="corp-item-col-left">
                    <span class="corp-main-title">${escapeHtml(item.title || '')}</span>
                    ${item.role ? `<span class="corp-sub-title"> &bull; ${escapeHtml(item.role)}</span>` : ''}
                    ${item.technologies ? `<span class="corp-tech-note">(${escapeHtml(item.technologies)})</span>` : ''}
                  </div>
                  <div class="corp-item-col-right">${escapeHtml(item.duration || '')}</div>
                </div>
                ${item.link ? `<div class="corp-link-line"><a href="${escapeHtml(item.link)}" target="_blank">${escapeHtml(item.link)}</a></div>` : ''}
                ${item.description ? `<div class="corp-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'skills') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="corp-skills-wrap">${sec.items.map(group => {
            const skillArray = Array.isArray(group.skills) ? group.skills : (typeof group.skills === 'string' ? group.skills.split(',').map(s => s.trim()) : []);
            if (skillArray.length === 0) return '';
            return `
              <div class="corp-skill-row">
                <span class="corp-skill-cat">${escapeHtml(group.category || 'Skills')}:</span>
                <span class="corp-skill-list">${skillArray.map(s => escapeHtml(s)).join(' &bull; ')}</span>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'certifications') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.name) return '';
            return `
              <div class="corp-item-table" data-item-id="${escapeHtml(item.id || '')}">
                <div class="corp-item-col-left">
                  <strong>${escapeHtml(item.name)}</strong>${item.issuer ? ` &bull; ${escapeHtml(item.issuer)}` : ''}
                </div>
                <div class="corp-item-col-right">${escapeHtml(item.date || '')}</div>
              </div>
            `;
          }).join('');
        } else if (sec.type === 'achievements') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title) return '';
            return `
              <div class="corp-item-table" data-item-id="${escapeHtml(item.id || '')}">
                <div class="corp-item-col-left">
                  <strong>${escapeHtml(item.title)}</strong>${item.issuer ? ` &bull; ${escapeHtml(item.issuer)}` : ''}
                  ${item.description ? ` &ndash; ${escapeHtml(item.description)}` : ''}
                </div>
                <div class="corp-item-col-right">${escapeHtml(item.date || '')}</div>
              </div>
            `;
          }).join('');
        } else if (sec.type === 'languages') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          const langs = sec.items.filter(l => l.language).map(l => `${escapeHtml(l.language)}${l.proficiency ? ` (${escapeHtml(l.proficiency)})` : ''}`);
          if (langs.length === 0) continue;
          secBody = `<p class="corp-simple-line">${langs.join(' &nbsp;&bull;&nbsp; ')}</p>`;
        } else if (sec.type === 'interests') {
          const items = Array.isArray(sec.items) ? sec.items : [];
          if (items.length === 0) continue;
          secBody = `<p class="corp-simple-line">${items.map(i => escapeHtml(i)).join(' &nbsp;&bull;&nbsp; ')}</p>`;
        } else {
          // Generic
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            const mainTitle = item.title || item.role || item.activity || item.name || '';
            const subTitle = item.organization || item.institution || item.journal || item.authors || item.subtitle || '';
            const date = item.duration || item.date || '';
            if (!mainTitle && !item.description) return '';
            return `
              <div class="corp-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="corp-item-table">
                  <div class="corp-item-col-left">
                    <span class="corp-main-title">${escapeHtml(mainTitle)}</span>
                    ${subTitle ? `<span class="corp-sub-title"> &bull; ${escapeHtml(subTitle)}</span>` : ''}
                  </div>
                  <div class="corp-item-col-right">${escapeHtml(date)}</div>
                </div>
                ${item.description ? `<div class="corp-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        }

        if (secBody.trim()) {
          html += `
            <div class="corp-section" data-section-id="${escapeHtml(sec.id)}">
              <h2 class="corp-section-title"><span>${escapeHtml(sec.title.toUpperCase())}</span></h2>
              <div class="corp-section-body">${secBody}</div>
            </div>
          `;
        }
      }

      return html;
    }
  };

  Engine.registerTemplate('corporate', CorporateTemplate);
  return CorporateTemplate;
});
