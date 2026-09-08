// js/state.js
// Reactive single source of truth for active CV document with Undo/Redo and Autosave.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./config.js'), require('./storage.js'));
  } else {
    root.CVState = factory(root.CVConfig, root.CVStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Config, Storage) {
  'use strict';

  let currentCV = null;
  const listeners = new Set();
  const statusListeners = new Set();

  // History stacks for Undo / Redo
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 40;

  // Autosave tracking
  let autosaveTimer = null;
  let saveStatus = 'saved'; // 'saved' | 'saving' | 'dirty' | 'error'

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function notify(actionName = 'update') {
    const stateSnapshot = clone(currentCV);
    listeners.forEach(fn => {
      try {
        fn(stateSnapshot, actionName);
      } catch (e) {
        console.error('Error in state subscriber:', e);
      }
    });
  }

  function setSaveStatus(newStatus) {
    saveStatus = newStatus;
    statusListeners.forEach(fn => {
      try {
        fn(newStatus);
      } catch (e) {
        console.error('Error in status subscriber:', e);
      }
    });
  }

  function triggerAutosave() {
    setSaveStatus('dirty');
    if (autosaveTimer) clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(() => {
      saveNow();
    }, 700);
  }

  function saveNow() {
    if (!currentCV) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);

    setSaveStatus('saving');
    const success = Storage.saveCV(currentCV.id, currentCV);
    if (success) {
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
    }
  }

  // Record a state change to the Undo stack
  function recordChange(actionName = 'edit') {
    if (!currentCV) return;
    undoStack.push({
      action: actionName,
      cv: clone(currentCV)
    });
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    // Any new change clears the Redo stack
    redoStack.length = 0;
  }

  // Load a CV into the state manager
  function loadCV(cvData) {
    if (!cvData) return;
    currentCV = clone(cvData);
    undoStack.length = 0;
    redoStack.length = 0;
    Storage.setActiveCVId(currentCV.id);
    setSaveStatus('saved');
    notify('load');
  }

  // Undo last action
  function undo() {
    if (undoStack.length === 0 || !currentCV) return false;
    redoStack.push({
      action: 'undo',
      cv: clone(currentCV)
    });
    const previous = undoStack.pop();
    currentCV = previous.cv;
    triggerAutosave();
    notify('undo');
    return true;
  }

  // Redo last undone action
  function redo() {
    if (redoStack.length === 0 || !currentCV) return false;
    undoStack.push({
      action: 'redo',
      cv: clone(currentCV)
    });
    const next = redoStack.pop();
    currentCV = next.cv;
    triggerAutosave();
    notify('redo');
    return true;
  }

  function canUndo() {
    return undoStack.length > 0;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function getCV() {
    return currentCV ? clone(currentCV) : null;
  }

  // --- MUTATION HELPERS ---

  function updateTitle(newTitle) {
    if (!currentCV) return;
    recordChange('updateTitle');
    currentCV.title = (newTitle || 'My Resume').trim();
    triggerAutosave();
    notify('title');
  }

  function updatePersonal(field, value) {
    if (!currentCV) return;
    recordChange(`updatePersonal_${field}`);
    if (!currentCV.personal) currentCV.personal = {};
    currentCV.personal[field] = value;
    triggerAutosave();
    notify('personal');
  }

  function updateDesign(key, value) {
    if (!currentCV) return;
    recordChange(`updateDesign_${key}`);
    if (!currentCV.design) currentCV.design = { ...Config.DEFAULT_DESIGN };
    currentCV.design[key] = value;
    triggerAutosave();
    notify('design');
  }

  function addSection(type, customTitle = null) {
    if (!currentCV) return null;
    recordChange(`addSection_${type}`);

    const catalogEntry = Config.SECTION_CATALOG[type] || Config.SECTION_CATALOG.custom;
    const secId = `sec_${type}_${Config.generateId('s')}`;
    const title = customTitle || catalogEntry.title;

    const newSection = {
      id: secId,
      type: type,
      title: title,
      visible: true
    };

    if (type === 'summary') {
      newSection.content = '';
    } else if (type === 'interests') {
      newSection.items = [];
    } else if (type === 'skills') {
      newSection.items = [
        {
          id: Config.generateId('skill_group'),
          category: 'Core Skills',
          skills: []
        }
      ];
    } else if (typeof catalogEntry.createItem === 'function') {
      newSection.items = [catalogEntry.createItem()];
    } else {
      newSection.items = [];
    }

    currentCV.sections.push(newSection);
    currentCV.sectionOrder.push(secId);

    triggerAutosave();
    notify('addSection');
    return newSection;
  }

  function removeSection(secId) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec || sec.type === 'personal') return;

    recordChange(`removeSection_${secId}`);
    currentCV.sections = currentCV.sections.filter(s => s.id !== secId);
    currentCV.sectionOrder = currentCV.sectionOrder.filter(id => id !== secId);

    triggerAutosave();
    notify('removeSection');
  }

  function toggleSectionVisibility(secId, isVisible) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec) return;

    recordChange(`toggleVisibility_${secId}`);
    sec.visible = typeof isVisible === 'boolean' ? isVisible : !sec.visible;

    triggerAutosave();
    notify('visibility');
  }

  function reorderSections(newOrder) {
    if (!currentCV || !Array.isArray(newOrder)) return;
    recordChange('reorderSections');
    currentCV.sectionOrder = [...newOrder];

    triggerAutosave();
    notify('reorder');
  }

  function updateSectionTitle(secId, newTitle) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec) return;

    recordChange(`renameSection_${secId}`);
    sec.title = newTitle.trim() || 'Section';

    triggerAutosave();
    notify('renameSection');
  }

  function updateSectionContent(secId, content) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec) return;

    recordChange(`updateContent_${secId}`);
    sec.content = content;

    triggerAutosave();
    notify('sectionContent');
  }

  function addSectionItem(secId, initialData = null) {
    if (!currentCV) return null;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec) return null;

    recordChange(`addItem_${secId}`);
    if (!Array.isArray(sec.items)) sec.items = [];

    const catalogEntry = Config.SECTION_CATALOG[sec.type] || Config.SECTION_CATALOG.custom;
    const newItem = initialData || (catalogEntry.createItem ? catalogEntry.createItem() : { id: Config.generateId('item') });

    sec.items.push(newItem);
    triggerAutosave();
    notify('addItem');
    return newItem;
  }

  function removeSectionItem(secId, itemId) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec || !Array.isArray(sec.items)) return;

    recordChange(`removeItem_${secId}`);
    sec.items = sec.items.filter(item => item.id !== itemId);

    triggerAutosave();
    notify('removeItem');
  }

  function duplicateSectionItem(secId, itemId) {
    if (!currentCV) return null;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec || !Array.isArray(sec.items)) return null;

    const itemIndex = sec.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    recordChange(`duplicateItem_${secId}`);
    const cloned = clone(sec.items[itemIndex]);
    cloned.id = Config.generateId(sec.type);
    if (cloned.title) cloned.title = `${cloned.title} (Copy)`;
    if (cloned.company) cloned.company = `${cloned.company} (Copy)`;

    sec.items.splice(itemIndex + 1, 0, cloned);
    triggerAutosave();
    notify('duplicateItem');
    return cloned;
  }

  function updateSectionItem(secId, itemId, field, value) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec || !Array.isArray(sec.items)) return;

    const item = sec.items.find(i => i.id === itemId);
    if (!item) return;

    // Check if value actually changed
    if (item[field] === value) return;

    recordChange(`updateItemField_${secId}_${field}`);
    item[field] = value;

    triggerAutosave();
    notify('updateItem');
  }

  function reorderSectionItems(secId, fromIndex, toIndex) {
    if (!currentCV) return;
    const sec = currentCV.sections.find(s => s.id === secId);
    if (!sec || !Array.isArray(sec.items)) return;
    if (toIndex < 0 || toIndex >= sec.items.length || fromIndex === toIndex) return;

    recordChange(`reorderItems_${secId}`);
    const moved = sec.items.splice(fromIndex, 1)[0];
    sec.items.splice(toIndex, 0, moved);

    triggerAutosave();
    notify('reorderItems');
  }

  // Subscribe to state updates
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // Subscribe to autosave status updates
  function subscribeStatus(listener) {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  }

  return {
    loadCV,
    getCV,
    undo,
    redo,
    canUndo,
    canRedo,
    saveNow,
    subscribe,
    subscribeStatus,
    updateTitle,
    updatePersonal,
    updateDesign,
    addSection,
    removeSection,
    toggleSectionVisibility,
    reorderSections,
    updateSectionTitle,
    updateSectionContent,
    addSectionItem,
    removeSectionItem,
    duplicateSectionItem,
    updateSectionItem,
    reorderSectionItems
  };
});
