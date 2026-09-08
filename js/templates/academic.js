// js/templates/academic.js
// Template 4: Academic & Research — Spacious, scholarly, publications-focused layout.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    factory(root.CVTemplates);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  const AcademicTemplate = {
    id: 'academic',
    name: 'Academic & Research',
    description: 'Scholarly format optimized for publications, conferences, grants, and detailed academic citations.',
    render(cv, utils) {
      const { escapeHtml, formatBullets, formatDateRange } = utils;
      const p = cv.personal || {};

      const contacts = [];
      if (p.email) contacts.push(`<span>${escapeHtml(p.email)}</span>`);
      if (p.phone) contacts.push(`<span>${escapeHtml(p.phone)}</span>`);
      if (p.location) contacts.push(`<span>${escapeHtml(p.location)}</span>`);

      const links = [];
      if (p.linkedin) links.push(`<a href="${escapeHtml(p.linkedin)}" target="_blank">LinkedIn</a>`);
      if (p.github) links.push(`<a href="${escapeHtml(p.github)}" target="_blank">GitHub</a>`);
      if (p.portfolio) links.push(`<a href="${escapeHtml(p.portfolio)}" target="_blank">Web</a>`);

      let html = `
        <div class="acad-header" data-section-id="personal">
          <h1 class="acad-name">${escapeHtml(p.fullName || 'Your Name')}</h1>
          <div class="acad-title">${escapeHtml(p.professionalTitle || 'Curriculum Vitae')}</div>
          ${contacts.length > 0 ? `<div class="acad-contact-row">${contacts.join(' &bull; ')}</div>` : ''}
          ${links.length > 0 ? `<div class="acad-links-row">${links.join(' &nbsp;|&nbsp; ')}</div>` : ''}
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
          secBody = `<div class="acad-summary">${formatBullets(sec.content)}</div>`;
        } else if (sec.type === 'education') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.institution && !item.degree) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="acad-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="acad-item-row">
                  <span class="acad-item-main"><strong>${escapeHtml(item.institution || '')}</strong>, ${escapeHtml(item.location || '')}</span>
                  <span class="acad-item-date">${dates}</span>
                </div>
                <div class="acad-item-sub">
                  <em>${escapeHtml(item.degree || '')}${item.fieldOfStudy ? ` in ${escapeHtml(item.fieldOfStudy)}` : ''}</em>
                  ${item.score ? ` &bull; GPA / Marks: ${escapeHtml(item.score)}` : ''}
                </div>
                ${item.coursework ? `<div class="acad-desc"><p>Specialization & Coursework: ${escapeHtml(item.coursework)}</p></div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'publications') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<ol class="acad-pub-list">${sec.items.map(item => {
            if (!item.title) return '';
            return `
              <li class="acad-pub-item" data-item-id="${escapeHtml(item.id || '')}">
                ${item.authors ? `<span class="acad-authors">${escapeHtml(item.authors)}.</span> ` : ''}
                <strong class="acad-pub-title">"${escapeHtml(item.title)}"</strong>.
                ${item.journal ? `<em>${escapeHtml(item.journal)}</em>, ` : ''}
                ${item.date ? `${escapeHtml(item.date)}. ` : ''}
                ${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" class="acad-pub-link">[DOI/Link]</a>` : ''}
                ${item.description ? `<div class="acad-desc">${formatBullets(item.description)}</div>` : ''}
              </li>
            `;
          }).join('')}</ol>`;
        } else if (sec.type === 'experience') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.company && !item.role && !item.title && !item.description) return '';
            const dates = formatDateRange(item.startDate, item.endDate, item.current);
            return `
              <div class="acad-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="acad-item-row">
                  <span class="acad-item-main"><strong>${escapeHtml(item.role || item.title || '')}</strong>, ${escapeHtml(item.company || '')}</span>
                  <span class="acad-item-date">${dates}</span>
                </div>
                ${item.location ? `<div class="acad-item-sub"><em>${escapeHtml(item.location)}</em></div>` : ''}
                ${item.description ? `<div class="acad-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'projects') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            if (!item.title && !item.description) return '';
            return `
              <div class="acad-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="acad-item-row">
                  <span class="acad-item-main"><strong>${escapeHtml(item.title || '')}</strong>${item.role ? ` (${escapeHtml(item.role)})` : ''}</span>
                  <span class="acad-item-date">${escapeHtml(item.duration || '')}</span>
                </div>
                ${item.technologies ? `<div class="acad-item-sub">Methodology / Stack: ${escapeHtml(item.technologies)}</div>` : ''}
                ${item.description ? `<div class="acad-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        } else if (sec.type === 'skills') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<div class="acad-skills-wrap">${sec.items.map(group => {
            const skillArray = Array.isArray(group.skills) ? group.skills : (typeof group.skills === 'string' ? group.skills.split(',').map(s => s.trim()) : []);
            if (skillArray.length === 0) return '';
            return `<div class="acad-skill-line"><strong>${escapeHtml(group.category || 'Skills')}:</strong> ${skillArray.map(s => escapeHtml(s)).join(', ')}</div>`;
          }).join('')}</div>`;
        } else if (sec.type === 'certifications' || sec.type === 'achievements') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = `<ul class="acad-compact-list">${sec.items.map(item => {
            const title = item.name || item.title || '';
            if (!title) return '';
            return `
              <li data-item-id="${escapeHtml(item.id || '')}">
                <strong>${escapeHtml(title)}</strong>${item.issuer ? ` &bull; ${escapeHtml(item.issuer)}` : ''}
                ${item.date ? ` (${escapeHtml(item.date)})` : ''}
                ${item.description ? ` &ndash; ${escapeHtml(item.description)}` : ''}
              </li>
            `;
          }).join('')}</ul>`;
        } else if (sec.type === 'languages') {
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          const langs = sec.items.filter(l => l.language).map(l => `${escapeHtml(l.language)}${l.proficiency ? ` (${escapeHtml(l.proficiency)})` : ''}`);
          if (langs.length === 0) continue;
          secBody = `<p class="acad-inline-list">${langs.join(' &bull; ')}</p>`;
        } else {
          // Generic
          if (!Array.isArray(sec.items) || sec.items.length === 0) continue;
          secBody = sec.items.map(item => {
            const mainTitle = item.title || item.role || item.activity || item.name || '';
            const subTitle = item.organization || item.institution || item.journal || item.authors || item.subtitle || '';
            const date = item.duration || item.date || '';
            if (!mainTitle && !item.description) return '';
            return `
              <div class="acad-item" data-item-id="${escapeHtml(item.id || '')}">
                <div class="acad-item-row">
                  <span class="acad-item-main"><strong>${escapeHtml(mainTitle)}</strong>${subTitle ? `, ${escapeHtml(subTitle)}` : ''}</span>
                  ${date ? `<span class="acad-item-date">${escapeHtml(date)}</span>` : ''}
                </div>
                ${item.description ? `<div class="acad-desc">${formatBullets(item.description)}</div>` : ''}
              </div>
            `;
          }).join('');
        }

        if (secBody.trim()) {
          html += `
            <div class="acad-section" data-section-id="${escapeHtml(sec.id)}">
              <h2 class="acad-section-title">${escapeHtml(sec.title)}</h2>
              <div class="acad-section-body">${secBody}</div>
            </div>
          `;
        }
      }

      return html;
    }
  };

  Engine.registerTemplate('academic', AcademicTemplate);
  return AcademicTemplate;
});
