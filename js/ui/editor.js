// js/ui/editor.js
// Dynamic Left-Panel form editor, section manager, repeating cards, and inline Humanize triggers.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config.js'),
      require('../state.js'),
      require('./toast.js')
    );
  } else {
    root.CVEditor = factory(
      root.CVConfig,
      root.CVState,
      root.CVToast
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Config, State, Toast) {
  'use strict';

  let containerEl = null;
  let onHumanizeRequestCallback = null;

  function init(container, options = {}) {
    containerEl = container;
    onHumanizeRequestCallback = options.onHumanizeRequest || null;

    // Subscribe to state changes to refresh form when sections or items are added/removed/reordered
    State.subscribe((cv, action) => {
      // Avoid re-rendering whole form on keystrokes in active input
      if (action && (action.startsWith('updatePersonal') || action.startsWith('updateItemField') || action === 'sectionContent' || action === 'title' || action === 'design')) {
        return;
      }
      renderForm();
    });

    renderForm();
  }

  function setOnHumanizeRequest(callback) {
    onHumanizeRequestCallback = callback;
  }

  function renderForm() {
    if (!containerEl) return;
    const cv = State.getCV();
    if (!cv) {
      containerEl.innerHTML = '<div class="editor-empty">No CV loaded.</div>';
      return;
    }

    containerEl.innerHTML = '';

    // 1. Section Management Quick Toolbar (Reorder & Add Section)
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-sections-toolbar';
    toolbar.innerHTML = `
      <span class="sections-count-tag"><i class="fa-solid fa-layer-group"></i> ${cv.sections.length} Sections</span>
      <div class="sections-toolbar-actions">
        <button id="btn-open-reorder-modal" class="ghost-btn icon-text-btn" title="Reorder sections">
          <i class="fa-solid fa-arrow-down-up-across-line"></i> Reorder
        </button>
        <button id="btn-open-add-section-modal" class="primary-btn-sm icon-text-btn" title="Add a new section">
          <i class="fa-solid fa-plus"></i> Add Section
        </button>
      </div>
    `;

    toolbar.querySelector('#btn-open-reorder-modal').addEventListener('click', openReorderModal);
    toolbar.querySelector('#btn-open-add-section-modal').addEventListener('click', openAddSectionModal);
    containerEl.appendChild(toolbar);

    // 2. Personal Information Card (Always first)
    const personalCard = buildPersonalCard(cv.personal || {});
    containerEl.appendChild(personalCard);

    // 3. Render Sections in user's sectionOrder
    const order = cv.sectionOrder || [];
    const sectionsMap = new Map((cv.sections || []).map(s => [s.id, s]));

    order.forEach(secId => {
      const sec = sectionsMap.get(secId);
      if (!sec) return;

      const card = buildSectionCard(sec);
      containerEl.appendChild(card);
    });
  }

  // --- BUILD PERSONAL DETAILS CARD ---
  function buildPersonalCard(p) {
    const card = document.createElement('div');
    card.className = 'editor-card accordion-card open';
    card.dataset.sectionId = 'personal';

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
      <div class="accordion-header-left">
        <i class="fa-solid fa-user icon-accent"></i>
        <h3 class="accordion-title">Personal Details</h3>
      </div>
      <i class="fa-solid fa-chevron-down accordion-arrow"></i>
    `;
    header.addEventListener('click', () => card.classList.toggle('open'));

    const body = document.createElement('div');
    body.className = 'accordion-body';

    const grid = document.createElement('div');
    grid.className = 'form-grid-two-col';

    const createInput = (field, label, type, placeholder, value, icon, colSpan = 1) => {
      const group = document.createElement('div');
      group.className = `form-group ${colSpan === 2 ? 'col-span-2' : ''}`;
      group.innerHTML = `
        <label for="p_${field}">
          <i class="fa-solid ${icon} field-icon"></i> ${label}
        </label>
        <input id="p_${field}" type="${type}" class="form-control" placeholder="${placeholder}" value="${escapeAttr(value || '')}" />
      `;
      const input = group.querySelector('input');
      input.addEventListener('input', (e) => {
        State.updatePersonal(field, e.target.value);
      });
      return group;
    };

    grid.appendChild(createInput('fullName', 'Full Name *', 'text', 'Jane Doe', p.fullName, 'fa-id-card'));
    grid.appendChild(createInput('professionalTitle', 'Professional Title *', 'text', 'Senior Software Engineer', p.professionalTitle, 'fa-briefcase'));
    grid.appendChild(createInput('email', 'Email Address *', 'email', 'jane.doe@example.com', p.email, 'fa-envelope'));
    grid.appendChild(createInput('phone', 'Phone Number', 'tel', '+1 (555) 234-5678', p.phone, 'fa-phone'));
    grid.appendChild(createInput('location', 'Location (City, Country)', 'text', 'New York, USA', p.location, 'fa-location-dot'));
    grid.appendChild(createInput('profilePhoto', 'Profile Photo URL (Optional)', 'url', 'https://example.com/photo.jpg', p.profilePhoto, 'fa-camera'));
    grid.appendChild(createInput('linkedin', 'LinkedIn Profile URL', 'url', 'https://linkedin.com/in/username', p.linkedin, 'fa-brands fa-linkedin'));
    grid.appendChild(createInput('github', 'GitHub Profile URL', 'url', 'https://github.com/username', p.github, 'fa-brands fa-github'));
    grid.appendChild(createInput('portfolio', 'Portfolio / Website URL', 'url', 'https://mywebsite.com', p.portfolio, 'fa-globe', 2));

    body.appendChild(grid);
    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  // --- BUILD SECTION CARD (ACCORDION) ---
  function buildSectionCard(sec) {
    const card = document.createElement('div');
    card.className = `editor-card accordion-card ${sec.visible ? '' : 'section-hidden'}`;
    card.dataset.sectionId = sec.id;

    const catalogEntry = Config.SECTION_CATALOG[sec.type] || Config.SECTION_CATALOG.custom;
    const iconClass = catalogEntry.icon || 'fa-folder';

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
      <div class="accordion-header-left">
        <i class="fa-solid ${iconClass} icon-accent"></i>
        <span class="accordion-title-text">${escapeHtml(sec.title)}</span>
      </div>
      <div class="accordion-header-right">
        <button class="icon-btn-xs sec-visibility-btn" title="${sec.visible ? 'Hide section from CV' : 'Show section on CV'}">
          <i class="fa-solid ${sec.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
        </button>
        <button class="icon-btn-xs sec-delete-btn" title="Delete section">
          <i class="fa-solid fa-trash"></i>
        </button>
        <i class="fa-solid fa-chevron-down accordion-arrow"></i>
      </div>
    `;

    // Toggle open/collapse when header (except buttons) is clicked
    header.addEventListener('click', (e) => {
      if (e.target.closest('.icon-btn-xs')) return;
      card.classList.toggle('open');
    });

    // Toggle visibility
    header.querySelector('.sec-visibility-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      State.toggleSectionVisibility(sec.id);
    });

    // Delete section
    header.querySelector('.sec-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete the "${sec.title}" section?`)) {
        State.removeSection(sec.id);
        Toast.info(`Removed "${sec.title}" section.`);
      }
    });

    const body = document.createElement('div');
    body.className = 'accordion-body';

    // Rename title inline control
    const renameRow = document.createElement('div');
    renameRow.className = 'section-rename-row';
    renameRow.innerHTML = `
      <label for="sec_title_${sec.id}" class="rename-label">Section Heading:</label>
      <input id="sec_title_${sec.id}" type="text" class="form-control rename-input" value="${escapeAttr(sec.title)}" />
    `;
    renameRow.querySelector('input').addEventListener('change', (e) => {
      State.updateSectionTitle(sec.id, e.target.value);
    });
    body.appendChild(renameRow);

    // Render section content based on type
    if (sec.type === 'summary') {
      body.appendChild(buildSummaryEditor(sec));
    } else if (sec.type === 'skills') {
      body.appendChild(buildSkillsEditor(sec));
    } else if (sec.type === 'interests') {
      body.appendChild(buildInterestsEditor(sec));
    } else {
      body.appendChild(buildRepeatingListEditor(sec));
    }

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  // --- SUMMARY EDITOR ---
  function buildSummaryEditor(sec) {
    const wrap = document.createElement('div');
    wrap.className = 'summary-editor-wrap';

    const aiTriggerBar = document.createElement('div');
    aiTriggerBar.className = 'field-top-bar';
    aiTriggerBar.innerHTML = `
      <label for="sum_text_${sec.id}">Write your professional pitch or background:</label>
      <button type="button" class="ai-inline-polish-btn" title="Send text to AI Humanizer">
        <i class="fa-solid fa-wand-magic-sparkles"></i> AI Humanize
      </button>
    `;

    const textarea = document.createElement('textarea');
    textarea.id = `sum_text_${sec.id}`;
    textarea.className = 'form-control textarea-summary';
    textarea.placeholder = 'Results-driven software engineer with 5+ years of experience designing scalable microservices...';
    textarea.rows = 5;
    textarea.value = sec.content || '';

    textarea.addEventListener('input', (e) => {
      State.updateSectionContent(sec.id, e.target.value);
    });

    aiTriggerBar.querySelector('.ai-inline-polish-btn').addEventListener('click', () => {
      triggerHumanizeForTextarea(textarea, sec.id, 'content');
    });

    wrap.appendChild(aiTriggerBar);
    wrap.appendChild(textarea);
    return wrap;
  }

  // --- SKILLS EDITOR ---
  function buildSkillsEditor(sec) {
    const wrap = document.createElement('div');
    wrap.className = 'skills-editor-wrap';

    const items = Array.isArray(sec.items) ? sec.items : [];

    items.forEach((group, groupIdx) => {
      const groupCard = document.createElement('div');
      groupCard.className = 'skill-group-card';
      groupCard.innerHTML = `
        <div class="skill-group-header">
          <input type="text" class="form-control skill-cat-input" value="${escapeAttr(group.category || 'Skills')}" placeholder="Category Name (e.g. Languages, Cloud, Frameworks)" />
          ${items.length > 1 ? `<button class="icon-btn-xs remove-skill-group" title="Delete Group"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
        <div class="skill-tags-input-box">
          <div class="skill-tags-list"></div>
          <input type="text" class="skill-tag-add-input" placeholder="Type a skill and press Enter or comma (e.g. React, Python)" />
        </div>
      `;

      // Category name update
      groupCard.querySelector('.skill-cat-input').addEventListener('change', (e) => {
        State.updateSectionItem(sec.id, group.id, 'category', e.target.value);
      });

      // Remove group
      if (items.length > 1) {
        groupCard.querySelector('.remove-skill-group').addEventListener('click', () => {
          State.removeSectionItem(sec.id, group.id);
        });
      }

      // Render tags
      const tagsList = groupCard.querySelector('.skill-tags-list');
      const addInput = groupCard.querySelector('.skill-tag-add-input');

      const renderTags = () => {
        tagsList.innerHTML = '';
        const currentSkills = Array.isArray(group.skills) ? group.skills : [];
        currentSkills.forEach((skill, sIdx) => {
          const badge = document.createElement('span');
          badge.className = 'editor-skill-tag';
          badge.innerHTML = `
            ${escapeHtml(skill)}
            <i class="fa-solid fa-xmark remove-tag-btn" title="Remove"></i>
          `;
          badge.querySelector('.remove-tag-btn').addEventListener('click', () => {
            currentSkills.splice(sIdx, 1);
            State.updateSectionItem(sec.id, group.id, 'skills', currentSkills);
            renderTags();
          });
          tagsList.appendChild(badge);
        });
      };

      addInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const val = addInput.value.trim().replace(/,/g, '');
          if (val) {
            const arr = Array.isArray(group.skills) ? [...group.skills] : [];
            if (!arr.includes(val)) {
              arr.push(val);
              State.updateSectionItem(sec.id, group.id, 'skills', arr);
              group.skills = arr;
              renderTags();
            }
            addInput.value = '';
          }
        }
      });

      renderTags();
      wrap.appendChild(groupCard);
    });

    // Button to add another skill category
    const addGroupBtn = document.createElement('button');
    addGroupBtn.className = 'secondary-btn-sm add-item-btn';
    addGroupBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Skill Group';
    addGroupBtn.addEventListener('click', () => {
      State.addSectionItem(sec.id, {
        id: Config.generateId('skill_group'),
        category: 'New Category',
        skills: []
      });
    });

    wrap.appendChild(addGroupBtn);
    return wrap;
  }

  // --- INTERESTS EDITOR ---
  function buildInterestsEditor(sec) {
    const wrap = document.createElement('div');
    wrap.className = 'interests-editor-wrap';

    const tagsBox = document.createElement('div');
    tagsBox.className = 'skill-tags-input-box';
    tagsBox.innerHTML = `
      <div class="skill-tags-list"></div>
      <input type="text" class="skill-tag-add-input" placeholder="Type a hobby/interest and press Enter (e.g. Chess, Marathon Running)" />
    `;

    const tagsList = tagsBox.querySelector('.skill-tags-list');
    const input = tagsBox.querySelector('.skill-tag-add-input');

    const renderTags = () => {
      tagsList.innerHTML = '';
      const items = Array.isArray(sec.items) ? sec.items : [];
      items.forEach((item, idx) => {
        const badge = document.createElement('span');
        badge.className = 'editor-skill-tag';
        badge.innerHTML = `
          ${escapeHtml(item)}
          <i class="fa-solid fa-xmark remove-tag-btn"></i>
        `;
        badge.querySelector('.remove-tag-btn').addEventListener('click', () => {
          items.splice(idx, 1);
          State.updateSectionItem(sec.id, null, 'items', items);
          renderTags();
        });
        tagsList.appendChild(badge);
      });
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          const items = Array.isArray(sec.items) ? [...sec.items] : [];
          if (!items.includes(val)) {
            items.push(val);
            sec.items = items;
            State.updateSectionContent(sec.id, items);
            renderTags();
          }
          input.value = '';
        }
      }
    });

    renderTags();
    wrap.appendChild(tagsBox);
    return wrap;
  }

  // --- REPEATING LIST EDITOR (Experience, Education, Projects, etc.) ---
  function buildRepeatingListEditor(sec) {
    const wrap = document.createElement('div');
    wrap.className = 'repeating-list-wrap';

    const items = Array.isArray(sec.items) ? sec.items : [];

    items.forEach((item, itemIdx) => {
      const itemCard = document.createElement('div');
      itemCard.className = 'repeating-entry-card';
      itemCard.dataset.itemId = item.id;

      // Entry Card Header
      const cardHeader = document.createElement('div');
      cardHeader.className = 'entry-card-header';
      const mainLabel = item.title || item.role || item.institution || item.company || item.name || `Entry #${itemIdx + 1}`;

      cardHeader.innerHTML = `
        <span class="entry-card-title"><i class="fa-solid fa-grip-lines-vertical handle-icon"></i> ${escapeHtml(mainLabel)}</span>
        <div class="entry-card-actions">
          <button class="icon-btn-xs btn-duplicate-item" title="Duplicate entry"><i class="fa-solid fa-copy"></i></button>
          <button class="icon-btn-xs btn-move-up" title="Move Up" ${itemIdx === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
          <button class="icon-btn-xs btn-move-down" title="Move Down" ${itemIdx === items.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
          <button class="icon-btn-xs btn-delete-item text-danger" title="Delete entry"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      cardHeader.querySelector('.btn-duplicate-item').addEventListener('click', () => {
        State.duplicateSectionItem(sec.id, item.id);
        Toast.success('Entry duplicated.');
      });

      cardHeader.querySelector('.btn-move-up').addEventListener('click', () => {
        State.reorderSectionItems(sec.id, itemIdx, itemIdx - 1);
      });

      cardHeader.querySelector('.btn-move-down').addEventListener('click', () => {
        State.reorderSectionItems(sec.id, itemIdx, itemIdx + 1);
      });

      cardHeader.querySelector('.btn-delete-item').addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          State.removeSectionItem(sec.id, item.id);
          Toast.info('Entry deleted.');
        }
      });

      itemCard.appendChild(cardHeader);

      // Entry Card Form Fields
      const formGrid = document.createElement('div');
      formGrid.className = 'entry-fields-grid';

      const addField = (fieldName, label, type, placeholder, val, colSpan = 1) => {
        const group = document.createElement('div');
        group.className = `form-group ${colSpan === 2 ? 'col-span-2' : ''}`;
        group.innerHTML = `
          <label for="f_${sec.id}_${item.id}_${fieldName}">${label}</label>
          <input id="f_${sec.id}_${item.id}_${fieldName}" type="${type}" class="form-control" placeholder="${placeholder}" value="${escapeAttr(val || '')}" />
        `;
        group.querySelector('input').addEventListener('input', (e) => {
          State.updateSectionItem(sec.id, item.id, fieldName, e.target.value);
        });
        return group;
      };

      const addTextareaWithAI = (fieldName, label, placeholder, val) => {
        const group = document.createElement('div');
        group.className = 'form-group col-span-2';

        const topBar = document.createElement('div');
        topBar.className = 'field-top-bar';
        topBar.innerHTML = `
          <label for="ta_${sec.id}_${item.id}_${fieldName}">${label}</label>
          <button type="button" class="ai-inline-polish-btn" title="Send description to AI Humanizer">
            <i class="fa-solid fa-wand-magic-sparkles"></i> AI Humanize
          </button>
        `;

        const textarea = document.createElement('textarea');
        textarea.id = `ta_${sec.id}_${item.id}_${fieldName}`;
        textarea.className = 'form-control';
        textarea.rows = 4;
        textarea.placeholder = placeholder;
        textarea.value = val || '';

        textarea.addEventListener('input', (e) => {
          State.updateSectionItem(sec.id, item.id, fieldName, e.target.value);
        });

        topBar.querySelector('.ai-inline-polish-btn').addEventListener('click', () => {
          triggerHumanizeForTextarea(textarea, sec.id, fieldName, item.id);
        });

        group.appendChild(topBar);
        group.appendChild(textarea);
        return group;
      };

      // Specific field configurations per section type
      if (sec.type === 'experience') {
        formGrid.appendChild(addField('role', 'Job Title / Role *', 'text', 'Staff Software Engineer', item.role));
        formGrid.appendChild(addField('company', 'Company / Organization *', 'text', 'Stripe Inc.', item.company));
        formGrid.appendChild(addField('location', 'Location', 'text', 'San Francisco, CA (or Remote)', item.location));
        formGrid.appendChild(addField('startDate', 'Start Date', 'text', 'Jan 2022', item.startDate));
        formGrid.appendChild(addField('endDate', 'End Date (or blank if Current)', 'text', 'Present', item.endDate));
        formGrid.appendChild(addTextareaWithAI('description', 'Key Responsibilities & Deliverables (Use - for bullets)', '- Architected real-time payment checkout microservice...\n- Optimized PostgreSQL queries reducing latency by 40%', item.description));
      } else if (sec.type === 'education') {
        formGrid.appendChild(addField('institution', 'School / University *', 'text', 'Stanford University', item.institution));
        formGrid.appendChild(addField('degree', 'Degree *', 'text', 'B.S. in Computer Science', item.degree));
        formGrid.appendChild(addField('fieldOfStudy', 'Major / Field of Study', 'text', 'Computer Systems', item.fieldOfStudy));
        formGrid.appendChild(addField('location', 'Location', 'text', 'Stanford, CA', item.location));
        formGrid.appendChild(addField('startDate', 'Start Date', 'text', '2018', item.startDate));
        formGrid.appendChild(addField('endDate', 'Graduation Date', 'text', '2022', item.endDate));
        formGrid.appendChild(addField('score', 'GPA / Honors', 'text', '3.89 / 4.0 (Dean\'s List)', item.score));
        formGrid.appendChild(addField('coursework', 'Relevant Coursework', 'text', 'Distributed Systems, Operating Systems, Machine Learning', item.coursework, 2));
      } else if (sec.type === 'projects') {
        formGrid.appendChild(addField('title', 'Project Name *', 'text', 'Distributed Cache Key-Value Store', item.title));
        formGrid.appendChild(addField('role', 'Your Role', 'text', 'Lead Creator', item.role));
        formGrid.appendChild(addField('technologies', 'Technologies Used', 'text', 'Go, Raft Consensus, Docker, gRPC', item.technologies, 2));
        formGrid.appendChild(addField('duration', 'Timeline / Year', 'text', 'Fall 2023', item.duration));
        formGrid.appendChild(addField('link', 'Project Link / Repo URL', 'url', 'https://github.com/username/project', item.link));
        formGrid.appendChild(addTextareaWithAI('description', 'Project Description & Impact', '- Implemented Raft consensus protocol for reliable distributed node state\n- Achieved 50k QPS with sub-millisecond p99 latency', item.description));
      } else if (sec.type === 'certifications') {
        formGrid.appendChild(addField('name', 'Certification Name *', 'text', 'AWS Certified Solutions Architect - Professional', item.name, 2));
        formGrid.appendChild(addField('issuer', 'Issuing Organization', 'text', 'Amazon Web Services', item.issuer));
        formGrid.appendChild(addField('date', 'Issue Date / Year', 'text', 'Dec 2023', item.date));
        formGrid.appendChild(addField('link', 'Verification URL / Credential ID', 'url', 'https://credly.com/badges/...', item.link, 2));
      } else if (sec.type === 'achievements') {
        formGrid.appendChild(addField('title', 'Award / Achievement *', 'text', '1st Place Winner - MIT Hackathon', item.title, 2));
        formGrid.appendChild(addField('issuer', 'Awarding Body / Organization', 'text', 'MIT EECS Department', item.issuer));
        formGrid.appendChild(addField('date', 'Date / Year', 'text', '2023', item.date));
        formGrid.appendChild(addTextareaWithAI('description', 'Achievement Details', 'Built an autonomous drone mapping tool selected 1st out of 80 competing university teams.', item.description));
      } else if (sec.type === 'publications') {
        formGrid.appendChild(addField('title', 'Paper / Article Title *', 'text', 'Efficient Consensus in Byzantine Distributed Networks', item.title, 2));
        formGrid.appendChild(addField('authors', 'Authors List', 'text', 'Jane Doe, John Smith, Alice Cooper', item.authors, 2));
        formGrid.appendChild(addField('journal', 'Journal / Conference Name', 'text', 'IEEE Transactions on Computers', item.journal));
        formGrid.appendChild(addField('date', 'Date Published', 'text', '2024', item.date));
        formGrid.appendChild(addField('link', 'DOI / Article Link', 'url', 'https://doi.org/...', item.link, 2));
        formGrid.appendChild(addTextareaWithAI('description', 'Short Abstract / Summary', 'Investigated new quorum topologies reducing message complexity.', item.description));
      } else if (sec.type === 'languages') {
        formGrid.appendChild(addField('language', 'Language *', 'text', 'English', item.language));
        formGrid.appendChild(addField('proficiency', 'Proficiency Level', 'text', 'Native / Fluent / Conversational', item.proficiency));
      } else {
        // Generic / Custom section
        formGrid.appendChild(addField('title', 'Title / Heading *', 'text', 'Role or Activity Name', item.title));
        formGrid.appendChild(addField('subtitle', 'Subheading / Organization', 'text', 'Organization or Context', item.subtitle));
        formGrid.appendChild(addField('date', 'Date / Duration', 'text', '2023 – Present', item.date));
        formGrid.appendChild(addField('location', 'Location', 'text', 'City, Country', item.location));
        formGrid.appendChild(addTextareaWithAI('description', 'Description / Details', '- Spearheaded key deliverables...\n- Coordinated operations with stakeholders', item.description));
      }

      itemCard.appendChild(formGrid);
      wrap.appendChild(itemCard);
    });

    // Add Item button
    const addBtn = document.createElement('button');
    addBtn.className = 'secondary-btn-sm add-item-btn';
    addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Add ${sec.title.replace(/s$/, '')} Entry`;
    addBtn.addEventListener('click', () => {
      State.addSectionItem(sec.id);
    });

    wrap.appendChild(addBtn);
    return wrap;
  }

  // Helper to trigger Humanize workflow from any textarea
  function triggerHumanizeForTextarea(textarea, sectionId, fieldName, itemId = null) {
    const text = textarea.value.trim();
    if (!text) {
      Toast.warning('Please enter some text in the field first.');
      return;
    }

    if (typeof onHumanizeRequestCallback === 'function') {
      onHumanizeRequestCallback({
        text: text,
        sectionId: sectionId,
        fieldName: fieldName,
        itemId: itemId,
        targetInput: textarea
      });
    }
  }

  // --- REORDER SECTIONS MODAL ---
  function openReorderModal() {
    let modal = document.getElementById('modal-reorder-sections');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-reorder-sections';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content medium-modal">
          <div class="modal-header">
            <h2><i class="fa-solid fa-arrow-down-up-across-line"></i> Reorder CV Sections</h2>
            <button class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-info-text">Use the arrows to change the vertical layout order of sections on your CV.</p>
            <ul id="reorder-modal-list" class="reorder-sections-list"></ul>
          </div>
        </div>
      `;
      modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('open'));
      modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.classList.remove('open'));
      document.body.appendChild(modal);
    }

    const listEl = modal.querySelector('#reorder-modal-list');
    listEl.innerHTML = '';

    const cv = State.getCV();
    const order = cv.sectionOrder || [];
    const sectionsMap = new Map((cv.sections || []).map(s => [s.id, s]));

    order.forEach((secId, idx) => {
      const sec = sectionsMap.get(secId);
      if (!sec) return;

      const li = document.createElement('li');
      li.className = 'reorder-list-item';
      li.innerHTML = `
        <span class="reorder-item-label"><i class="fa-solid fa-bars"></i> ${escapeHtml(sec.title)}</span>
        <div class="reorder-btn-group">
          <button class="icon-btn-xs" ${idx === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
          <button class="icon-btn-xs" ${idx === order.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
        </div>
      `;

      li.querySelectorAll('button')[0].addEventListener('click', () => {
        const newOrder = [...order];
        const temp = newOrder[idx];
        newOrder[idx] = newOrder[idx - 1];
        newOrder[idx - 1] = temp;
        State.reorderSections(newOrder);
        openReorderModal(); // refresh modal
      });

      li.querySelectorAll('button')[1].addEventListener('click', () => {
        const newOrder = [...order];
        const temp = newOrder[idx];
        newOrder[idx] = newOrder[idx + 1];
        newOrder[idx + 1] = temp;
        State.reorderSections(newOrder);
        openReorderModal(); // refresh modal
      });

      listEl.appendChild(li);
    });

    modal.classList.add('open');
  }

  // --- ADD SECTION MODAL ---
  function openAddSectionModal() {
    let modal = document.getElementById('modal-add-section');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-add-section';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content medium-modal">
          <div class="modal-header">
            <h2><i class="fa-solid fa-plus-circle"></i> Add a Section</h2>
            <button class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-info-text">Choose from built-in section types or add a custom section.</p>
            <div id="add-section-grid" class="add-sections-grid"></div>
          </div>
        </div>
      `;
      modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('open'));
      modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.classList.remove('open'));
      document.body.appendChild(modal);
    }

    const grid = modal.querySelector('#add-section-grid');
    grid.innerHTML = '';

    const cv = State.getCV();
    const existingTypes = new Set((cv.sections || []).map(s => s.type));

    Object.values(Config.SECTION_CATALOG).forEach(cat => {
      if (cat.type === 'personal') return;

      const isAdded = cat.isSingular && existingTypes.has(cat.type);

      const card = document.createElement('div');
      card.className = `add-section-card ${isAdded ? 'disabled' : ''}`;
      card.innerHTML = `
        <i class="fa-solid ${cat.icon} add-card-icon"></i>
        <div class="add-card-info">
          <h4>${escapeHtml(cat.title)}</h4>
          <span class="add-card-status">${isAdded ? 'Already in CV' : '+ Add to CV'}</span>
        </div>
      `;

      if (!isAdded) {
        card.addEventListener('click', () => {
          State.addSection(cat.type);
          modal.classList.remove('open');
          Toast.success(`Added "${cat.title}" section.`);
        });
      }

      grid.appendChild(card);
    });

    modal.classList.add('open');
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    renderForm,
    setOnHumanizeRequest
  };
});
