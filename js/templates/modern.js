// js/templates/modern.js
// Template 2: Modern Professional — Contemporary, high-visual-hierarchy layout.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    factory(root.CVTemplates);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  const ModernTemplate = {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Contemporary layout with subtle accents, icon-enhanced contacts, and modern skill badges.',
    render(cv, utils) {
      const { escapeHtml, formatBullets, formatDateRange } = utils;
      const p = cv.personal || {};

      // Photo
      const photoHtml = p.profilePhoto
        ? `<div class="modern-photo-container"><img src="${escapeHtml(p.profilePhoto)}" alt="${escapeHtml(p.fullName)}" class="modern-photo" /></div>`
        : '';

      // Contact badges
      const contacts = [];
      if (p.email) contacts.push(`<span class="modern-contact"><i class="fa-solid fa-envelope"></i> ${escapeHtml(p.email)}</span>`);
      if (p.phone) contacts.push(`<span class="modern-contact"><i class="fa-solid fa-phone"></i> ${escapeHtml(p.phone)}</span>`);
      if (p.location) contacts.push(`<span class="modern-contact"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.location)}</span>`);
      if (p.linkedin) contacts.push(`<a href="${escapeHtml(p.linkedin)}" target="_blank" class="modern-link"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>`);
      if (p.github) contacts.push(`<a href="${escapeHtml(p.github)}" target="_blank" class="modern-link"><i class="fa-brands fa-github"></i> GitHub</a>`);
      if (p.portfolio) contacts.push(`<a href="${escapeHtml(p.portfolio)}" target="_blank" class="modern-link"><i class="fa-solid fa-globe"></i> Portfolio</a>`);

      let html = `
        <div class="modern-header" data-section-id="personal">
          <div class="modern-header-main">
            ${photoHtml}
            <div class="modern-header-text">
              <h1 class="modern-name">${escapeHtml(p.fullName || 'Your Name')}</h1>
              ${p.professionalTitle ? `<h2 class="modern-title">${escapeHtml(p.professionalTitle)}</h2>` : ''}
              ${contacts.length > 0 ? `<div class="modern-contacts-wrap">${contacts.join('')}</div>` : ''}
            </div>
          </div>
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
          secBody = `<div class="modern-summary">${formatBullets(sec.content)}</div>`;
        } else if (sec.type === 'experience') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.company && !item.role && !item.title && !item.description) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="modern-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="modern-item-top">
                  <div class="modern-item-titles">
                    <span class="modern-role">${escapeHtml(item.role || item.title || '')}</span>
                    ${item.company ? `<span class="modern-company">${escapeHtml(item.company)}</span>` : ''}
                    ${item.location ? `<span class="modern-location">&bull; ${escapeHtml(item.location)}</span>` : ''}
                  </div>
                  ${dates ? `<div class="modern-date-badge">${dates}</div>` : ''}
                </div>
                ${item.description ? `<div class="modern-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'education') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.institution && !item.degree) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="modern-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="modern-item-top">
                  <div class="modern-item-titles">
                    <span class="modern-role">${escapeHtml(item.degree || '')}${item.fieldOfStudy ? ` in ${escapeHtml(item.fieldOfStudy)}` : ''}</span>
                    <span class="modern-company">${escapeHtml(item.institution || '')}</span>
                    ${item.score ? `<span class="modern-score">&bull; GPA: ${escapeHtml(item.score)}</span>` : ''}
                  </div>
                  ${dates ? `<div class="modern-date-badge">${dates}</div>` : ''}
                </div>
                ${item.coursework ? `<div class="modern-desc"><p>Coursework: ${escapeHtml(item.coursework)}</p></div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'projects') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title && !item.description) return '';
            return `
              <div class="modern-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="modern-item-top">
                  <div class="modern-item-titles">
                    <span class="modern-role">${escapeHtml(item.title || '')}</span>
                    ${item.role ? `<span class="modern-company">${escapeHtml(item.role)}</span>` : ''}
                    ${item.technologies ? `<span class="modern-tech-tag">${escapeHtml(item.technologies)}</span>` : ''}
                  </div>
                  ${item.duration ? `<div class="modern-date-badge">${escapeHtml(item.duration)}</div>` : ''}
                </div>
                ${item.link ? `<div class="modern-link-row"><a href="${escapeHtml(item.link)}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHtml(item.link)}</a></div>` : ''}
                ${item.description ? `<div class="modern-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'skills') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="modern-skills-grid">${sec.items.map(group => {
            const skillArray = Array.isArray(group.skills) ? group.skills : (typeof group.skills === 'string' ? group.skills.split(',').map(s => s.trim()) : []);
            if (skillArray.length === 0) return '';
            return `
              <div class="modern-skill-group">
                <span class="modern-skill-cat">${escapeHtml(group.category || 'Skills')}:</span>
                <div class="modern-pills">${skillArray.map(s => `<span class="modern-pill">${escapeHtml(s)}</span>`).join('')}</div>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'certifications') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="modern-grid-two-col">${sec.items.map(item => {
            if (!item.name) return '';
            return `
              <div class="modern-compact-card" data-item-id="${escapeHtml(item.id || '')}">
                <i class="fa-solid fa-certificate modern-icon-accent"></i>
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <div class="modern-sub-meta">${escapeHtml(item.issuer || '')}${item.date ? ` &bull; ${escapeHtml(item.date)}` : ''}</div>
                </div>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'achievements') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title) return '';
            return `
              <div class="modern-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="modern-item-top">
                  <span class="modern-role"><i class="fa-solid fa-trophy modern-icon-accent"></i> ${escapeHtml(item.title)}</span>
                  ${item.date ? `<span class="modern-date-badge">${escapeHtml(item.date)}</span>` : ''}
                </div>
                ${item.issuer ? `<div class="modern-company">${escapeHtml(item.issuer)}</div>` : ''}
                ${item.description ? `<div class="modern-desc"><p>${escapeHtml(item.description)}</p></div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'languages') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          const langs = sec.items.filter(l => l.language);
          if (langs.length === 0) continue;
          secBody = `<div class="modern-pills">${langs.map(l => `<span class="modern-pill">${escapeHtml(l.language)}${l.proficiency ? ` &bull; <small>${escapeHtml(l.proficiency)}</small>` : ''}</span>`).join('')}</div>`;
        } else if (sec.type === 'interests') {
          const items = Array.isArray(sec.items) ? sec.items : [];
          if (items.length === 0) continue;
          secBody = `<div class="modern-pills">${items.map(i => `<span class="modern-pill">${escapeHtml(i)}</span>`).join('')}</div>`;
        } else {
          // Other / Custom sections
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            const mainTitle = item.title || item.role || item.activity || item.name || '';
            const subTitle = item.organization || item.institution || item.journal || item.authors || item.subtitle || '';
            const date = item.duration || item.date || '';
            if (!mainTitle && !item.description) return '';
            return `
              <div class="modern-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="modern-item-top">
                  <div class="modern-item-titles">
                    <span class="modern-role">${escapeHtml(mainTitle)}</span>
                    ${subTitle ? `<span class="modern-company">${escapeHtml(subTitle)}</span>` : ''}
                  </div>
                  ${date ? `<span class="modern-date-badge">${escapeHtml(date)}</span>` : ''}
                </div>
                ${item.description ? `<div class="modern-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        }

        if (secBody.trim()) {
          html += `
            <div class="modern-section" data-section-id="${escapeHtml(sec.id)}">
              <h3 class="modern-section-title">
                <span class="modern-section-title-text">${escapeHtml(sec.title)}</span>
                <span class="modern-title-line"></span>
              </h3>
              <div class="modern-section-body">${secBody}</div>
            </div>
          `;
        }
      }

      return html;
    }
  };

  Engine.registerTemplate('modern', ModernTemplate);
  return ModernTemplate;
});
