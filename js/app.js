// js/app.js
// Main application controller: lifecycle, routing, 3-panel synchronization, keyboard shortcuts, and exports.

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- MODULE REFERENCES ---
  const Config = window.CVConfig;
  const Storage = window.CVStorage;
  const State = window.CVState;
  const Templates = window.CVTemplates;
  const Toast = window.CVToast;
  const Editor = window.CVEditor;
  const Preview = window.CVPreview;
  const DesignPanel = window.CVDesignPanel;
  const HumanizerPanel = window.CVHumanizerPanel;
  const AnalyzerPanel = window.CVAnalyzerPanel;
  const CVManager = window.CVCVManager;
  const PdfExport = window.CVPdfExport;
  const DocxExport = window.CVDocxExport;
  const JsonExport = window.CVJsonExport;

  // --- DOM ELEMENTS ---
  // Screens
  const screenWelcome = document.getElementById('screen-welcome');
  const screenEditor = document.getElementById('screen-editor');

  // Welcome screen elements
  const btnWelcomeCreate = document.getElementById('btn-welcome-create');
  const btnWelcomeImport = document.getElementById('btn-welcome-import');
  const savedCvsGrid = document.getElementById('saved-cvs-grid');

  // Header Elements
  const headerLogoBtn = document.getElementById('header-logo-btn');
  const cvTitleInput = document.getElementById('cv-title-input');
  const cvSwitcherSelect = document.getElementById('cv-switcher-select');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const saveStatusBadge = document.getElementById('save-status-badge');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const aiConfigBtn = document.getElementById('ai-config-btn');

  // Export Buttons
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportDocx = document.getElementById('btn-export-docx');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnPrint = document.getElementById('btn-print');

  // 3 Panels Containers
  const panelEditor = document.getElementById('panel-editor');
  const previewSheet = document.getElementById('cv-preview-sheet');
  const zoomPercentDisplay = document.getElementById('zoom-percent-display');
  const pageCountDisplay = document.getElementById('page-count-display');
  const panelDesign = document.getElementById('panel-design');
  const panelHumanizer = document.getElementById('panel-humanizer');
  const panelAnalyzer = document.getElementById('panel-analyzer');

  // Right Panel Tabs
  const rightPanelTabs = document.querySelectorAll('.right-tab-btn');
  const rightTabContents = document.querySelectorAll('.right-tab-content');

  // Mobile navigation tabs
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');

  // AI Config Modal Elements
  const modalAiConfig = document.getElementById('modal-ai-config');
  const btnCloseAiConfig = document.getElementById('btn-close-ai-config');
  const aiProviderSelect = document.getElementById('ai-provider-select');
  const geminiKeyGroup = document.getElementById('gemini-key-group');
  const openaiKeyGroup = document.getElementById('openai-key-group');
  const geminiKeyInput = document.getElementById('gemini-key-input');
  const openaiKeyInput = document.getElementById('openai-key-input');
  const formAiConfig = document.getElementById('form-ai-config');

  // --- INITIALIZATION ---
  function init() {
    setupTheme();
    setupAiConfigModal();
    setupRightPanelTabs();
    setupMobileNav();
    setupKeyboardShortcuts();

    // Check if there was an active CV previously opened
    const activeId = Storage.getActiveCVId();
    if (activeId && Storage.getCV(activeId)) {
      loadCVIntoWorkspace(activeId);
    } else {
      const savedList = Storage.getSavedCVs();
      if (savedList.length > 0 && Storage.getCV(savedList[0].id)) {
        loadCVIntoWorkspace(savedList[0].id);
      } else {
        showWelcomeScreen();
      }
    }

    setupEventListeners();

    if (typeof MagicBento !== 'undefined' && MagicBento.initAllOptionMenus) {
      MagicBento.initAllOptionMenus();
    }
  }

  // --- ROUTING / SCREEN TRANSITIONS ---
  function showWelcomeScreen() {
    screenWelcome.classList.add('active');
    screenEditor.classList.remove('active');
    CVManager.renderSavedList(savedCvsGrid, (cvId) => {
      loadCVIntoWorkspace(cvId);
    });
  }

  function showEditorScreen() {
    screenWelcome.classList.remove('active');
    screenEditor.classList.add('active');
  }

  function loadCVIntoWorkspace(cvId) {
    const cv = Storage.getCV(cvId);
    if (!cv) {
      showWelcomeScreen();
      return;
    }

    State.loadCV(cv);
    cvTitleInput.value = cv.title || 'My Resume';
    CVManager.updateHeaderSwitcher(cvSwitcherSelect);

    // Initialize UI components
    Editor.init(panelEditor, {
      onHumanizeRequest: (targetData) => {
        // Switch right panel to Humanizer tab and set target
        switchRightPanelTab('humanizer');
        HumanizerPanel.setTarget(targetData);
      }
    });

    Preview.init(previewSheet, zoomPercentDisplay, pageCountDisplay);
    DesignPanel.init(panelDesign);
    HumanizerPanel.init(panelHumanizer);
    AnalyzerPanel.init(panelAnalyzer);

    showEditorScreen();
  }

  // --- RIGHT PANEL TABS ---
  function setupRightPanelTabs() {
    rightPanelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        switchRightPanelTab(targetId);
      });
    });
  }

  function switchRightPanelTab(tabName) {
    rightPanelTabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    rightTabContents.forEach(content => {
      if (content.id === `tab-content-${tabName}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // If switching to analyzer, re-evaluate
    if (tabName === 'analyzer') {
      AnalyzerPanel.renderPanel();
    }
  }

  // --- MOBILE NAVIGATION BAR ---
  function setupMobileNav() {
    mobileNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        mobileNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelector('.workspace-col-left').classList.remove('mobile-active');
        document.querySelector('.workspace-col-center').classList.remove('mobile-active');
        document.querySelector('.workspace-col-right').classList.remove('mobile-active');

        if (view === 'editor') {
          document.querySelector('.workspace-col-left').classList.add('mobile-active');
        } else if (view === 'preview') {
          document.querySelector('.workspace-col-center').classList.add('mobile-active');
        } else if (view === 'tools') {
          document.querySelector('.workspace-col-right').classList.add('mobile-active');
        }
      });
    });
  }

  // --- THEME SETUP ---
  function setupTheme() {
    const savedTheme = localStorage.getItem(Storage.STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(Storage.STORAGE_KEYS.THEME, next);
        updateThemeIcon(next);
        Toast.info(`Theme set to ${next} mode.`);
      });
    }
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  // --- AI CONFIG MODAL ---
  function setupAiConfigModal() {
    const loadSettings = () => {
      const keys = Storage.getApiKeys();
      aiProviderSelect.value = keys.provider || 'local';
      geminiKeyInput.value = keys.geminiKey || '';
      openaiKeyInput.value = keys.openaiKey || '';
      updateProviderKeyFields(keys.provider || 'local');
    };

    const updateProviderKeyFields = (provider) => {
      geminiKeyGroup.style.display = provider === 'gemini' ? 'block' : 'none';
      openaiKeyGroup.style.display = provider === 'openai' ? 'block' : 'none';
    };

    aiConfigBtn.addEventListener('click', () => {
      loadSettings();
      modalAiConfig.classList.add('open');
    });

    btnCloseAiConfig.addEventListener('click', () => {
      modalAiConfig.classList.remove('open');
    });

    aiProviderSelect.addEventListener('change', (e) => {
      updateProviderKeyFields(e.target.value);
    });

    formAiConfig.addEventListener('submit', (e) => {
      e.preventDefault();
      Storage.saveApiKeys({
        provider: aiProviderSelect.value,
        geminiKey: geminiKeyInput.value.trim(),
        openaiKey: openaiKeyInput.value.trim()
      });
      modalAiConfig.classList.remove('open');
      Toast.success('AI configuration saved successfully!');
    });
  }

  // --- AUTOSAVE & UNDO/REDO STATUS LISTENERS ---
  State.subscribeStatus((status) => {
    if (!saveStatusBadge) return;
    if (status === 'saved') {
      saveStatusBadge.innerHTML = '<i class="fa-solid fa-check"></i> Saved just now';
      saveStatusBadge.className = 'save-status-badge status-saved';
    } else if (status === 'saving') {
      saveStatusBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      saveStatusBadge.className = 'save-status-badge status-saving';
    } else if (status === 'dirty') {
      saveStatusBadge.innerHTML = '<i class="fa-solid fa-pen"></i> Unsaved changes';
      saveStatusBadge.className = 'save-status-badge status-dirty';
    }
  });

  State.subscribe(() => {
    if (btnUndo) btnUndo.disabled = !State.canUndo();
    if (btnRedo) btnRedo.disabled = !State.canRedo();
  });

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Header Logo -> Return to Welcome
    headerLogoBtn.addEventListener('click', () => {
      State.saveNow();
      showWelcomeScreen();
    });

    // Welcome Screen Buttons
    btnWelcomeCreate.addEventListener('click', () => {
      CVManager.openCreateModal((newId) => {
        loadCVIntoWorkspace(newId);
      });
    });

    btnWelcomeImport.addEventListener('click', () => {
      CVManager.triggerImportFlow((importedId) => {
        loadCVIntoWorkspace(importedId);
      });
    });

    // Title input in Header
    cvTitleInput.addEventListener('change', (e) => {
      State.updateTitle(e.target.value);
      CVManager.updateHeaderSwitcher(cvSwitcherSelect);
    });

    // CV Switcher Select
    cvSwitcherSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === '__NEW__') {
        CVManager.openCreateModal((newId) => {
          loadCVIntoWorkspace(newId);
        });
      } else if (val === '__IMPORT__') {
        CVManager.triggerImportFlow((importedId) => {
          loadCVIntoWorkspace(importedId);
        });
      } else {
        loadCVIntoWorkspace(val);
      }
    });

    // Undo / Redo
    btnUndo.addEventListener('click', () => {
      if (State.undo()) {
        Toast.info('Undo action applied.');
      }
    });

    btnRedo.addEventListener('click', () => {
      if (State.redo()) {
        Toast.info('Redo action applied.');
      }
    });

    // Zoom Controls in Preview Toolbar
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => Preview.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => Preview.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => Preview.resetZoom());
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
      const centerCol = document.querySelector('.workspace-col-center');
      if (centerCol) Preview.fitWidth(centerCol.clientWidth);
    });

    // Export Handlers
    btnExportPdf.addEventListener('click', async () => {
      const cv = State.getCV();
      Toast.info('Generating high-quality A4 PDF...');
      try {
        await PdfExport.exportPdf(Preview.getSheetElement(), cv.title);
        Toast.success('PDF downloaded successfully!');
      } catch (err) {
        console.error(err);
        Toast.error('PDF export failed. Opening print window.');
        PdfExport.triggerPrint();
      }
    });

    btnExportDocx.addEventListener('click', async () => {
      const cv = State.getCV();
      Toast.info('Generating Word document (.docx)...');
      try {
        await DocxExport.exportDocx(cv);
        Toast.success('Word document download started!');
      } catch (err) {
        console.error(err);
        Toast.error('Word export failed.');
      }
    });

    btnExportJson.addEventListener('click', () => {
      const cv = State.getCV();
      JsonExport.exportCV(cv);
      Toast.success('CV JSON exported!');
    });

    btnPrint.addEventListener('click', () => {
      PdfExport.triggerPrint();
    });
  }

  // --- KEYBOARD SHORTCUTS ---
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+Z or Cmd+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // If not in a standard text field, run state undo
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          State.undo();
        }
      }

      // Ctrl+Y or Ctrl+Shift+Z -> Redo
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          State.redo();
        }
      }

      // Ctrl+S -> Manual Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        State.saveNow();
        Toast.success('Progress saved to storage.');
      }
    });
  }

  // Launch application
  init();
});
