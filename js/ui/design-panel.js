// js/ui/design-panel.js
// Right-Panel design controls: templates, colors, typography, margins, and density.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config.js'),
      require('../state.js'),
      require('../templates/engine.js')
    );
  } else {
    root.CVDesignPanel = factory(
      root.CVConfig,
      root.CVState,
      root.CVTemplates
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Config, State, Templates) {
  'use strict';

  let containerEl = null;

  function init(container) {
    containerEl = container;

    State.subscribe((cv, action) => {
      if (action === 'load' || action === 'design') {
        renderPanel();
      }
    });

    renderPanel();
  }

  function renderPanel() {
    if (!containerEl) return;
    const cv = State.getCV();
    if (!cv) return;

    const design = cv.design || { ...Config.DEFAULT_DESIGN };

    containerEl.innerHTML = `
      <div class="design-controls-wrap">

        <!-- 1. TEMPLATE PICKER -->
        <div class="design-section">
          <h4 class="design-section-title"><i class="fa-solid fa-layer-group"></i> Choose Template</h4>
          <div class="template-choice-grid">
            ${Templates.getAllTemplates().map(t => `
              <div class="template-choice-card ${design.template === t.id ? 'active' : ''}" data-template-id="${t.id}">
                <div class="template-mini-thumbnail template-thumb-${t.id}">
                  <div class="mini-bar-header"></div>
                  <div class="mini-line mini-line-title"></div>
                  <div class="mini-line mini-line-body"></div>
                  <div class="mini-line mini-line-body short"></div>
                </div>
                <span class="template-choice-name">${escapeHtml(t.name)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. ACCENT COLOR -->
        <div class="design-section">
          <h4 class="design-section-title"><i class="fa-solid fa-palette"></i> Accent Color</h4>
          <div class="color-swatches-row">
            ${Config.ACCENT_COLORS.map(c => `
              <button class="color-swatch-btn ${design.accentColor === c.value ? 'active' : ''}" style="background-color: ${c.value};" title="${c.label}" data-color="${c.value}"></button>
            `).join('')}
            <div class="custom-color-picker-wrap" title="Custom Hex Color">
              <input type="color" id="custom-accent-color" value="${design.accentColor || '#1e3a8a'}" />
            </div>
          </div>
        </div>

        <!-- 3. TYPOGRAPHY -->
        <div class="design-section">
          <h4 class="design-section-title"><i class="fa-solid fa-font"></i> Typography</h4>
          <div class="design-field-group">
            <label for="design-font-family">Font Family:</label>
            <select id="design-font-family" class="form-control">
              ${Config.FONT_FAMILIES.map(f => `
                <option value="${f.value}" ${design.fontFamily === f.value ? 'selected' : ''}>${f.label}</option>
              `).join('')}
            </select>
          </div>

          <div class="design-field-row">
            <div class="design-field-group">
              <label for="design-font-size">Body Size:</label>
              <select id="design-font-size" class="form-control">
                <option value="small" ${design.fontSize === 'small' ? 'selected' : ''}>Small (9.5pt)</option>
                <option value="normal" ${design.fontSize === 'normal' ? 'selected' : ''}>Standard (10pt)</option>
                <option value="large" ${design.fontSize === 'large' ? 'selected' : ''}>Large (11pt)</option>
              </select>
            </div>
            <div class="design-field-group">
              <label for="design-line-height">Line Height:</label>
              <select id="design-line-height" class="form-control">
                <option value="tight" ${design.lineHeight === 'tight' ? 'selected' : ''}>Tight (1.3)</option>
                <option value="normal" ${design.lineHeight === 'normal' ? 'selected' : ''}>Normal (1.5)</option>
                <option value="relaxed" ${design.lineHeight === 'relaxed' ? 'selected' : ''}>Relaxed (1.7)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 4. SPACING & MARGINS -->
        <div class="design-section">
          <h4 class="design-section-title"><i class="fa-solid fa-arrows-up-down-left-right"></i> Spacing & Margins</h4>
          <div class="design-field-row">
            <div class="design-field-group">
              <label for="design-section-spacing">Section Spacing:</label>
              <select id="design-section-spacing" class="form-control">
                <option value="compact" ${design.sectionSpacing === 'compact' ? 'selected' : ''}>Compact (10px)</option>
                <option value="normal" ${design.sectionSpacing === 'normal' ? 'selected' : ''}>Standard (16px)</option>
                <option value="spacious" ${design.sectionSpacing === 'spacious' ? 'selected' : ''}>Spacious (22px)</option>
              </select>
            </div>
            <div class="design-field-group">
              <label for="design-page-margins">Page Margins:</label>
              <select id="design-page-margins" class="form-control">
                <option value="compact" ${design.pageMargins === 'compact' ? 'selected' : ''}>Compact (10mm)</option>
                <option value="normal" ${design.pageMargins === 'normal' ? 'selected' : ''}>Standard (14mm)</option>
                <option value="spacious" ${design.pageMargins === 'spacious' ? 'selected' : ''}>Spacious (18mm)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    `;

    // Event Bindings

    // Template click
    containerEl.querySelectorAll('.template-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const tId = card.dataset.templateId;
        State.updateDesign('template', tId);
      });
    });

    // Color Swatches
    containerEl.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        State.updateDesign('accentColor', color);
      });
    });

    // Custom Color input
    const customColorInput = containerEl.querySelector('#custom-accent-color');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        State.updateDesign('accentColor', e.target.value);
      });
    }

    // Typography
    containerEl.querySelector('#design-font-family').addEventListener('change', (e) => {
      State.updateDesign('fontFamily', e.target.value);
    });
    containerEl.querySelector('#design-font-size').addEventListener('change', (e) => {
      State.updateDesign('fontSize', e.target.value);
    });
    containerEl.querySelector('#design-line-height').addEventListener('change', (e) => {
      State.updateDesign('lineHeight', e.target.value);
    });

    // Spacing
    containerEl.querySelector('#design-section-spacing').addEventListener('change', (e) => {
      State.updateDesign('sectionSpacing', e.target.value);
    });
    containerEl.querySelector('#design-page-margins').addEventListener('change', (e) => {
      State.updateDesign('pageMargins', e.target.value);
    });
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return {
    init,
    renderPanel
  };
});
