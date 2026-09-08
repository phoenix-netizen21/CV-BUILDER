// js/templates/creative.js
// Template 5: Creative Portfolio — Visual, modern accent headers, timeline cards.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    factory(root.CVTemplates);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  const CreativeTemplate = {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Dynamic visual design with modern headers, timeline details, and project spotlight cards.',
    render(cv, utils) {
      const { escapeHtml, formatBullets, formatDateRange } = utils;
      const p = cv.personal || {};

      const photoHtml = p.profilePhoto
        ? `<div class="creative-photo-box"><img src="${escapeHtml(p.profilePhoto)}" alt="${escapeHtml(p.fullName)}" class="creative-photo" /></div>`
        : '';

      const contacts = [];
      if (p.email) contacts.push(`<span class="creative-badge"><i class="fa-solid fa-envelope"></i> ${escapeHtml(p.email)}</span>`);
      if (p.phone) contacts.push(`<span class="creative-badge"><i class="fa-solid fa-phone"></i> ${escapeHtml(p.phone)}</span>`);
      if (p.location) contacts.push(`<span class="creative-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.location)}</span>`);
      if (p.linkedin) contacts.push(`<a href="${escapeHtml(p.linkedin)}" target="_blank" class="creative-badge"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>`);
      if (p.github) contacts.push(`<a href="${escapeHtml(p.github)}" target="_blank" class="creative-badge"><i class="fa-brands fa-github"></i> GitHub</a>`);
      if (p.portfolio) contacts.push(`<a href="${escapeHtml(p.portfolio)}" target="_blank" class="creative-badge"><i class="fa-solid fa-arrow-up-right-from-square"></i> Portfolio</a>`);

      let html = `
        <div class="creative-hero" data-section-id="personal">
          <div class="creative-hero-inner">
            ${photoHtml}
            <div class="creative-hero-info">
              <h1 class="creative-name">${escapeHtml(p.fullName || 'Your Name')}</h1>
              ${p.professionalTitle ? `<div class="creative-title">${escapeHtml(p.professionalTitle)}</div>` : ''}
              ${contacts.length > 0 ? `<div class="creative-badges-wrap">${contacts.join('')}</div>` : ''}
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
          secBody = `<div class="creative-summary-box">${formatBullets(sec.content)}</div>`;
        } else if (sec.type === 'experience') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="creative-timeline">${sec.items.map(item => {
            if (!item.company && !item.role && !item.title && !item.description) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="creative-timeline-node" data-item-id="${escapeHtml(item.id || '')}">
                <div class="creative-node-marker"></div>
                <div class="creative-node-content">
                  <div class="creative-node-header">
                    <span class="creative-role">${escapeHtml(item.role || item.title || '')}</span>
                    <span class="creative-date-tag">${dates}</span>
                  </div>
                  <div class="creative-company-line">
                    <span class="creative-company">${escapeHtml(item.company || '')}</span>
                    ${item.location ? `<span class="creative-location">&bull; ${escapeHtml(item.location)}</span>` : ''}
                  </div>
                  ${item.description ? `<div class="creative-desc">${formatBullets(item.description)}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'education') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="creative-timeline">${sec.items.map(item => {
            if (!item.institution && !item.degree) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="creative-timeline-node" data-item-id="${escapeHtml(item.id || '')}">
                <div class="creative-node-marker"></div>
                <div class="creative-node-content">
                  <div class="creative-node-header">
                    <span class="creative-role">${escapeHtml(item.degree || '')}${item.fieldOfStudy ? ` in ${escapeHtml(item.fieldOfStudy)}` : ''}</span>
                    <span class="creative-date-tag">${dates}</span>
                  </div>
                  <div class="creative-company-line">
                    <span class="creative-company">${escapeHtml(item.institution || '')}</span>
                    ${item.score ? `<span class="creative-location">&bull; GPA: ${escapeHtml(item.score)}</span>` : ''}
                  </div>
                  ${item.coursework ? `<div class="creative-desc"><p>Coursework: ${escapeHtml(item.coursework)}</p></div>` : ''}
                </div>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'projects') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="creative-projects-grid">${sec.items.map(item => {
            if (!item.title && !item.description) return '';
            return `
              <div class="creative-project-card" data-item-id="${escapeHtml(item.id || '')}">
                <div class="creative-card-top">
                  <strong class="creative-project-title">${escapeHtml(item.title || '')}</strong>
                  ${item.duration ? `<span class="creative-project-date">${escapeHtml(item.duration)}</span>` : ''}
                </div>
                ${item.role ? `<div class="creative-project-role">${escapeHtml(item.role)}</div>` : ''}
                ${item.technologies ? `<div class="creative-tech-pill">${escapeHtml(item.technologies)}</div>` : ''}
                ${item.description ? `<div class="creative-desc">${formatBullets(item.description)}</div>` : ''}
                ${item.link ? `<div class="creative-card-link"><a href="${escapeHtml(item.link)}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Project Link</a></div>` : ''}
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'skills') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="creative-skills-area">${sec.items.map(group => {
            const skillArray = Array.isArray(group.skills) ? group.skills : (typeof group.skills === 'string' ? group.skills.split(',').map(s => s.trim()) : []);
            if (skillArray.length === 0) return '';
            return `
              <div class="creative-skill-block">
                <span class="creative-skill-heading">${escapeHtml(group.category || 'Skills')}</span>
                <div class="creative-skill-tags">${skillArray.map(s => `<span class="creative-tag">${escapeHtml(s)}</span>`).join('')}</div>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'certifications' || sec.type === 'achievements') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="creative-compact-grid">${sec.items.map(item => {
            const title = item.name || item.title || '';
            if (!title) return '';
            return `
              <div class="creative-badge-card" data-item-id="${escapeHtml(item.id || '')}">
                <i class="fa-solid fa-award creative-accent-icon"></i>
                <div>
                  <strong>${escapeHtml(title)}</strong>
                  <div class="creative-sub-text">${escapeHtml(item.issuer || '')}${item.date ? ` (${escapeHtml(item.date)})` : ''}</div>
                </div>
              </div>
            `;
          }).join('')}</div>`;
        } else if (sec.type === 'languages') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          const langs = sec.items.filter(l => l.language);
          if (langs.length === 0) continue;
          secBody = `<div class="creative-skill-tags">${langs.map(l => `<span class="creative-tag">${escapeHtml(l.language)}${l.proficiency ? ` (${escapeHtml(l.proficiency)})` : ''}</span>`).join('')}</div>`;
        } else {
          // Generic
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            const mainTitle = item.title || item.role || item.activity || item.name || '';
            const subTitle = item.organization || item.institution || item.journal || item.authors || item.subtitle || '';
            const date = item.duration || item.date || '';
            if (!mainTitle && !item.description) return '';
            return `
              <div class="creative-item-box" data-item-id="${escapeHtml(item.id || '')}">
                <div class="creative-node-header">
                  <span class="creative-role">${escapeHtml(mainTitle)}</span>
                  ${date ? `<span class="creative-date-tag">${escapeHtml(date)}</span>` : ''}
                </div>
                ${subTitle ? `<div class="creative-company-line">${escapeHtml(subTitle)}</div>` : ''}
                ${item.description ? `<div class="creative-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        }

        if (secBody.trim()) {
          html += `
            <div class="creative-section" data-section-id="${escapeHtml(sec.id)}">
              <h2 class="creative-section-title">${escapeHtml(sec.title)}</h2>
              <div class="creative-section-body">${secBody}</div>
            </div>
          `;
        }
      }

      return html;
    }
  };

  Engine.registerTemplate('creative', CreativeTemplate);
  return CreativeTemplate;
});
