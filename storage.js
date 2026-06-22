// storage.js
// LocalStorage database engine for CV document management.
// Supports multi-document workflows, autosave throttling, duplicate actions, and draft recoveries.

const STORAGE_KEYS = {
  CV_LIST: "ai_cv_list",
  ACTIVE_ID: "ai_cv_active_id",
  API_KEYS: "ai_cv_api_keys"
};

// Generates a simple UUID-like string
function generateId() {
  return "cv_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
}

// Retrieves list of all saved CV metadata
function getSavedCVs() {
  const rawList = localStorage.getItem(STORAGE_KEYS.CV_LIST);
  try {
    return rawList ? JSON.parse(rawList) : [];
  } catch (e) {
    console.error("Failed to parse CV list", e);
    return [];
  }
}

// Retrieves data of a specific CV by ID
function getCV(id) {
  if (!id) return null;
  const rawData = localStorage.getItem(`ai_cv_data_${id}`);
  try {
    return rawData ? JSON.parse(rawData) : null;
  } catch (e) {
    console.error("Failed to parse CV data", e);
    return null;
  }
}

// Saves a CV document and updates its metadata list
function saveCV(id, data) {
  if (!id || !data) return;
  
  // Store the document content
  localStorage.setItem(`ai_cv_data_${id}`, JSON.stringify(data));
  
  // Update document metadata list
  const list = getSavedCVs();
  const index = list.findIndex(item => item.id === id);
  const metadata = {
    id: id,
    title: data.cvTitle || "Untitled CV",
    category: data.category,
    lastSaved: new Date().toISOString()
  };
  
  if (index !== -1) {
    list[index] = metadata;
  } else {
    list.push(metadata);
  }
  
  localStorage.setItem(STORAGE_KEYS.CV_LIST, JSON.stringify(list));
}

// Deletes a CV document and removes it from the metadata list
function deleteCV(id) {
  if (!id) return;
  localStorage.removeItem(`ai_cv_data_${id}`);
  const list = getSavedCVs();
  const newList = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.CV_LIST, JSON.stringify(newList));
  
  if (getActiveCVId() === id) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
  }
}

// Creates a copy of a CV with a new name
function duplicateCV(id, newTitle) {
  const originalData = getCV(id);
  if (!originalData) return null;
  
  const newId = generateId();
  const copiedData = JSON.parse(JSON.stringify(originalData));
  copiedData.cvTitle = newTitle || `${copiedData.cvTitle} (Copy)`;
  
  saveCV(newId, copiedData);
  return newId;
}

// Track active working CV
function getActiveCVId() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
}

function setActiveCVId(id) {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
  }
}

// Reset data structure for a CV category
function createEmptyCVData(category, title = "My Resume") {
  const catConfig = window.CV_CATEGORIES[category];
  if (!catConfig) return null;

  const data = {
    id: generateId(),
    cvTitle: title,
    category: category,
    template: "modern_prof", // default template
    zoom: 100,
    sectionOrder: catConfig.sections.map(s => s.id),
    hiddenSections: [],
    personal: {
      fullName: "",
      professionalTitle: "",
      profilePhoto: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
      summary: ""
    }
  };

  // Prepopulate specific sections with empty list entries (or empty tag arrays)
  for (const sec of catConfig.sections) {
    if (sec.id === "personal") continue;
    
    if (sec.type === "list") {
      // Start with one empty item entry to guide the user
      const emptyItem = {};
      for (const field of sec.fields) {
        emptyItem[field] = "";
      }
      data[sec.id] = [emptyItem];
    } else if (sec.type === "tags") {
      data[sec.id] = [];
    }
  }

  return data;
}

// Manage API Keys for Generative AI Features
function getApiKeys() {
  const keys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
  try {
    return keys ? JSON.parse(keys) : { provider: "local", key: "" };
  } catch (e) {
    return { provider: "local", key: "" };
  }
}

function saveApiKeys(provider, key) {
  localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify({ provider, key }));
}

if (typeof window !== "undefined") {
  window.getSavedCVs = getSavedCVs;
  window.getCV = getCV;
  window.saveCV = saveCV;
  window.deleteCV = deleteCV;
  window.duplicateCV = duplicateCV;
  window.getActiveCVId = getActiveCVId;
  window.setActiveCVId = setActiveCVId;
  window.createEmptyCVData = createEmptyCVData;
  window.getApiKeys = getApiKeys;
  window.saveApiKeys = saveApiKeys;
  window.generateId = generateId;
}
