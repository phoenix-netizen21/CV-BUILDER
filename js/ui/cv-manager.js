// js/ui/cv-manager.js
// Multi-CV document manager: switcher, create, rename, duplicate, delete, and JSON import/export.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config.js'),
      require('../storage.js'),
      require('../state.js'),
      require('../export/json-export.js'),
      require('./toast.js')
    );
  } else {
    root.CVCVManager = factory(
      root.CVConfig,
      root.CVStorage,
      root.CVState,
      root.CVJsonExport,
      root.CVToast
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Config, Storage, State, JsonExport, Toast) {
  'use strict';

  function renderSavedList(containerEl, onSelectCV) {
    if (!containerEl) return;
    const list = Storage.getSavedCVs();

    if (list.length === 0) {
      containerEl.innerHTML = `
        <div class="saved-empty-state">
          <i class="fa-solid fa-folder-open empty-folder-icon"></i>
          <p>No saved resumes yet. Click "Create New CV" above to get started!</p>
        </div>
      `;
      return;
    }

    containerEl.innerHTML = list.map(cv => {
      const dateStr = cv.lastSaved ? new Date(cv.lastSaved).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'Recently';

      return `
        <div class="saved-cv-card" data-cv-id="${escapeAttr(cv.id)}">
          <div class="saved-card-content">
            <h4 class="saved-card-title">${escapeHtml(cv.title || 'Untitled CV')}</h4>
            <div class="saved-card-meta">
              <span class="preset-tag">${escapeHtml(cv.preset || 'General')}</span>
              <span class="date-tag"><i class="fa-solid fa-clock"></i> ${escapeHtml(dateStr)}</span>
            </div>
          </div>
          <div class="saved-card-actions">
            <button class="primary-btn-sm btn-open-cv" title="Open this CV"><i class="fa-solid fa-pen-to-square"></i> Open</button>
            <button class="icon-btn-xs btn-duplicate-cv" title="Duplicate CV"><i class="fa-solid fa-copy"></i></button>
            <button class="icon-btn-xs btn-delete-cv text-danger" title="Delete CV"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    // Event delegation
    containerEl.querySelectorAll('.saved-cv-card').forEach(card => {
      const id = card.dataset.cvId;

      card.querySelector('.btn-open-cv').addEventListener('click', () => {
        if (typeof onSelectCV === 'function') onSelectCV(id);
      });

      card.querySelector('.btn-duplicate-cv').addEventListener('click', () => {
        const newId = Storage.duplicateCV(id);
        if (newId) {
          Toast.success('CV duplicated successfully!');
          renderSavedList(containerEl, onSelectCV);
        }
      });

      card.querySelector('.btn-delete-cv').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this CV? This cannot be undone.')) {
          Storage.deleteCV(id);
          Toast.info('CV deleted.');
          renderSavedList(containerEl, onSelectCV);
        }
      });
    });

    if (typeof MagicBento !== 'undefined' && MagicBento.attach) {
      MagicBento.attach(containerEl, {
        cardSelector: '.saved-cv-card',
        glowColor: '132, 0, 255',
        particleCount: 10,
        spotlightRadius: 400,
        clickEffect: true,
        enableBorderGlow: true,
        enableStars: true
      });
    }
  }

  // Populate header switcher dropdown
  function updateHeaderSwitcher(selectEl) {
    if (!selectEl) return;
    const list = Storage.getSavedCVs();
    const activeId = Storage.getActiveCVId();

    selectEl.innerHTML = list.map(cv => `
      <option value="${escapeAttr(cv.id)}" ${cv.id === activeId ? 'selected' : ''}>
        ${escapeHtml(cv.title || 'Untitled CV')}
      </option>
    `).join('') + `
      <option value="__NEW__">+ Create New CV...</option>
      <option value="__IMPORT__">📥 Import from JSON...</option>
    `;
  }

  // Create new CV modal
  function openCreateModal(onCreated) {
    let modal = document.getElementById('modal-create-cv');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-create-cv';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content medium-modal">
          <div class="modal-header">
            <h2><i class="fa-solid fa-file-circle-plus"></i> Create New CV</h2>
            <button class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom: 20px;">
              <label for="new-cv-title-input">CV Name / Target Role:</label>
              <input type="text" id="new-cv-title-input" class="form-control" placeholder="e.g. Senior Backend Engineer CV" value="My Resume" />
            </div>

            <p class="modal-info-text">Choose a purpose preset to generate an initial set of relevant sections (you can add or remove any section later):</p>
            <div id="create-preset-grid" class="category-preset-grid"></div>
          </div>
        </div>
      `;
      modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('open'));
      modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.classList.remove('open'));
      document.body.appendChild(modal);
    }

    const titleInput = modal.querySelector('#new-cv-title-input');
    const grid = modal.querySelector('#create-preset-grid');
    grid.innerHTML = '';

    Object.values(Config.CATEGORY_PRESETS).forEach(preset => {
      const card = document.createElement('div');
      card.className = 'category-choice-card';
      card.innerHTML = `
        <div class="cat-choice-icon"><i class="fa-solid ${preset.icon}"></i></div>
        <div class="cat-choice-info">
          <h4>${escapeHtml(preset.title)}</h4>
          <p>${escapeHtml(preset.subtitle)}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        const title = (titleInput.value || 'My Resume').trim();
        const newCV = Config.createEmptyCV(preset.id, title);
        Storage.saveCV(newCV.id, newCV);
        State.loadCV(newCV);
        modal.classList.remove('open');
        Toast.success(`Created new ${preset.title}!`);
        if (typeof onCreated === 'function') onCreated(newCV.id);
      });

      grid.appendChild(card);
    });

    if (typeof MagicBento !== 'undefined' && MagicBento.attach) {
      MagicBento.attach(grid, {
        cardSelector: '.category-choice-card',
        glowColor: '132, 0, 255',
        particleCount: 8,
        spotlightRadius: 360,
        clickEffect: true,
        enableBorderGlow: true,
        enableStars: true
      });
    }

    modal.classList.add('open');
  }

  // Handle JSON Import
  function triggerImportFlow(onImported) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const importedCV = await JsonExport.readJsonFile(file);
        importedCV.id = Config.generateId('cv');
        importedCV.title = `${importedCV.title || 'Imported CV'} (Imported)`;

        Storage.saveCV(importedCV.id, importedCV);
        State.loadCV(importedCV);
        Toast.success('CV imported successfully!');
        if (typeof onImported === 'function') onImported(importedCV.id);
      } catch (err) {
        console.error(err);
        Toast.error(err.message || 'Import failed.');
      }
    });
    input.click();
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
    renderSavedList,
    updateHeaderSwitcher,
    openCreateModal,
    triggerImportFlow
  };
});
