// js/ui/preview.js
// Live A4 Preview manager with zoom controls, pagination indicators, and click-to-edit synchronization.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../state.js'),
      require('../templates/engine.js')
    );
  } else {
    root.CVPreview = factory(
      root.CVState,
      root.CVTemplates
    );
  }
})(typeof self !== 'undefined' ? self : this, function (State, Templates) {
  'use strict';

  let sheetContainerEl = null;
  let zoomPercentEl = null;
  let pageIndicatorEl = null;
  let currentZoom = 100;

  function init(sheetContainer, zoomDisplay, pageIndicator) {
    sheetContainerEl = sheetContainer;
    zoomPercentEl = zoomDisplay;
    pageIndicatorEl = pageIndicator;

    // Re-render preview on state changes
    State.subscribe((cv) => {
      updatePreview(cv);
    });

    // Initial render
    updatePreview(State.getCV());
  }

  function updatePreview(cv = null) {
    if (!sheetContainerEl) return;
    const cvData = cv || State.getCV();
    if (!cvData) {
      sheetContainerEl.innerHTML = '<div class="preview-empty">No CV loaded to preview</div>';
      return;
    }

    const html = Templates.render(cvData);
    sheetContainerEl.innerHTML = html;

    // Apply current zoom
    applyZoom();

    // Bind click-to-edit interaction
    bindClickToEdit();

    // Compute multi-page count
    updatePageCount();
  }

  function applyZoom() {
    if (!sheetContainerEl) return;
    const scale = currentZoom / 100;
    sheetContainerEl.style.transform = `scale(${scale})`;
    sheetContainerEl.style.transformOrigin = 'top center';

    if (zoomPercentEl) {
      zoomPercentEl.innerText = `${currentZoom}%`;
    }

    // Auto adjust parent container height so it doesn't clip when zoomed
    const baseHeight = sheetContainerEl.scrollHeight || 1120;
    if (sheetContainerEl.parentElement) {
      sheetContainerEl.parentElement.style.height = `${(baseHeight * scale) + 60}px`;
    }
  }

  function zoomIn() {
    if (currentZoom < 160) {
      currentZoom += 10;
      applyZoom();
    }
  }

  function zoomOut() {
    if (currentZoom > 50) {
      currentZoom -= 10;
      applyZoom();
    }
  }

  function resetZoom() {
    currentZoom = 100;
    applyZoom();
  }

  function fitWidth(containerWidth) {
    // 210mm in pixels at 96 DPI is approx 794px
    const a4WidthPx = 794;
    const available = (containerWidth || (window.innerWidth <= 992 ? window.innerWidth : 800)) - 32;
    const computed = Math.min(130, Math.max(30, Math.round((available / a4WidthPx) * 100)));
    currentZoom = computed;
    applyZoom();
  }

  function bindClickToEdit() {
    const clickableSections = sheetContainerEl.querySelectorAll('[data-section-id]');
    clickableSections.forEach(el => {
      el.classList.add('preview-clickable');
      el.title = 'Click to edit this section in editor';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const secId = el.dataset.sectionId;
        scrollToEditorSection(secId);
      });
    });
  }

  function scrollToEditorSection(secId) {
    // On mobile, switch to editor view first
    if (typeof window.switchMobileWorkspaceView === 'function' && window.innerWidth <= 992) {
      window.switchMobileWorkspaceView('editor');
    }

    setTimeout(() => {
      const targetCard = document.querySelector(`.editor-card[data-section-id="${secId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetCard.classList.add('open');

        // Flash highlight border
        targetCard.classList.add('card-highlight-flash');
        setTimeout(() => {
          targetCard.classList.remove('card-highlight-flash');
        }, 1200);
      }
    }, 50);
  }

  function updatePageCount() {
    if (!sheetContainerEl) return;
    // An A4 page height at 96 DPI is approx 1123px (297mm)
    const a4HeightPx = 1123;
    const scrollHeight = sheetContainerEl.scrollHeight || a4HeightPx;
    const pages = Math.max(1, Math.ceil(scrollHeight / a4HeightPx));

    if (pageIndicatorEl) {
      pageIndicatorEl.innerText = `A4 Page${pages > 1 ? `s (approx ${pages})` : ' (1 page)'}`;
    }
  }

  function getSheetElement() {
    return sheetContainerEl;
  }

  return {
    init,
    updatePreview,
    zoomIn,
    zoomOut,
    resetZoom,
    fitWidth,
    getSheetElement
  };
});
