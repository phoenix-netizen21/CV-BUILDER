// js/storage.js
// Robust LocalStorage engine for multi-CV management, persistence, and schema migration.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./config.js'));
  } else {
    root.CVStorage = factory(root.CVConfig);
  }
})(typeof self !== 'undefined' ? self : this, function (Config) {
  'use strict';

  const STORAGE_KEYS = {
    CV_LIST: 'ai_cv_list',
    ACTIVE_ID: 'ai_cv_active_id',
    API_KEYS: 'ai_cv_api_keys',
    THEME: 'ai_cv_theme'
  };

  // Safe JSON parse helper
  function safeJsonParse(raw, fallback = null) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse JSON from storage:', err);
      return fallback;
    }
  }

  // Get list of saved CV metadata
  function getSavedCVs() {
    return safeJsonParse(localStorage.getItem(STORAGE_KEYS.CV_LIST), []);
  }

  // Auto-migration from legacy v1 format to new structured v2 format
  function migrateLegacyCV(old) {
    if (!old) return null;
    if (old.metadata && old.metadata.version === 2 && Array.isArray(old.sections)) {
      // Already v2 format
      return old;
    }

    console.log('Migrating legacy CV format to v2 schema for CV:', old.id || old.cvTitle);

    const title = old.cvTitle || old.title || 'My Resume';
    const preset = old.category || 'general';
    const newCV = Config.createEmptyCV(preset, title);
    newCV.id = old.id || Config.generateId('cv');

    // Migrate personal info
    if (old.personal && typeof old.personal === 'object') {
      newCV.personal = {
        fullName: old.personal.fullName || '',
        professionalTitle: old.personal.professionalTitle || '',
        profilePhoto: old.personal.profilePhoto || '',
        email: old.personal.email || '',
        phone: old.personal.phone || '',
        location: old.personal.location || '',
        linkedin: old.personal.linkedin || '',
        github: old.personal.github || '',
        portfolio: old.personal.portfolio || ''
      };

      // If summary was inside personal, put it into summary section
      if (old.personal.summary) {
        const sumSec = newCV.sections.find(s => s.type === 'summary');
        if (sumSec) {
          sumSec.content = old.personal.summary;
        } else {
          const sumId = `sec_summary_${Config.generateId('s')}`;
          newCV.sections.unshift({
            id: sumId,
            type: 'summary',
            title: 'Professional Summary',
            visible: true,
            content: old.personal.summary
          });
          newCV.sectionOrder.unshift(sumId);
        }
      }
    }

    // Migrate template & design settings
    if (old.template) {
      const tMap = {
        modern_prof: 'modern',
        minimal_ats: 'minimal',
        corp_exec: 'corporate',
        academic_clean: 'academic'
      };
      newCV.design.template = tMap[old.template] || old.template || 'modern';
    }

    // Migrate known section items
    const copyListItems = (oldKey, newType, fieldMapping) => {
      if (Array.isArray(old[oldKey]) && old[oldKey].length > 0) {
        let sec = newCV.sections.find(s => s.type === newType);
        if (!sec) {
          const secId = `sec_${newType}_${Config.generateId('s')}`;
          sec = {
            id: secId,
            type: newType,
            title: Config.SECTION_CATALOG[newType]?.title || newType,
            visible: true,
            items: []
          };
          newCV.sections.push(sec);
          newCV.sectionOrder.push(secId);
        }
        sec.items = old[oldKey].map(item => {
          const newItem = Config.SECTION_CATALOG[newType]?.createItem ? Config.SECTION_CATALOG[newType].createItem() : { id: Config.generateId('item') };
          for (const [oldField, newField] of Object.entries(fieldMapping)) {
            if (item[oldField]) newItem[newField] = item[oldField];
          }
          return newItem;
        });
      }
    };

    copyListItems('experience', 'experience', {
      companyName: 'company',
      roleName: 'role',
      duration: 'startDate',
      responsibilities: 'description',
      achievements: 'description'
    });

    copyListItems('education', 'education', {
      collegeName: 'institution',
      schoolName: 'institution',
      degree: 'degree',
      department: 'fieldOfStudy',
      graduationYear: 'endDate',
      duration: 'startDate',
      cgpa: 'score',
      cgpaScore: 'score',
      coursework: 'coursework'
    });

    copyListItems('projects', 'projects', {
      title: 'title',
      role: 'role',
      technologies: 'technologies',
      duration: 'duration',
      description: 'description',
      link: 'link'
    });

    copyListItems('certifications', 'certifications', {
      name: 'name',
      issuer: 'issuer',
      date: 'date',
      link: 'link'
    });

    // Migrate skills
    if (Array.isArray(old.skills) && old.skills.length > 0) {
      let skillSec = newCV.sections.find(s => s.type === 'skills');
      if (!skillSec) {
        const secId = `sec_skills_${Config.generateId('s')}`;
        skillSec = {
          id: secId,
          type: 'skills',
          title: 'Skills & Competencies',
          visible: true,
          items: []
        };
        newCV.sections.push(skillSec);
        newCV.sectionOrder.push(secId);
      }
      skillSec.items = [
        {
          id: Config.generateId('skill_group'),
          category: 'Skills',
          skills: [...old.skills]
        }
      ];
    }

    // Preserve hidden sections
    if (Array.isArray(old.hiddenSections)) {
      newCV.sections.forEach(sec => {
        if (old.hiddenSections.includes(sec.type) || old.hiddenSections.includes(sec.id)) {
          sec.visible = false;
        }
      });
    }

    newCV.metadata.version = 2;
    newCV.metadata.updatedAt = new Date().toISOString();

    return newCV;
  }

  // Retrieve a specific CV by ID
  function getCV(id) {
    if (!id) return null;
    const raw = localStorage.getItem(`ai_cv_data_${id}`);
    const parsed = safeJsonParse(raw);
    if (!parsed) return null;
    const migrated = migrateLegacyCV(parsed);
    // If migrated format is different, update storage
    if (migrated !== parsed) {
      localStorage.setItem(`ai_cv_data_${id}`, JSON.stringify(migrated));
    }
    return migrated;
  }

  // Save a CV and update the metadata list
  function saveCV(id, data) {
    if (!id || !data) return;

    data.metadata = data.metadata || {};
    data.metadata.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem(`ai_cv_data_${id}`, JSON.stringify(data));

      const list = getSavedCVs();
      const index = list.findIndex(item => item.id === id);
      const meta = {
        id: id,
        title: data.title || 'Untitled CV',
        preset: data.preset || 'general',
        template: data.design?.template || 'modern',
        lastSaved: data.metadata.updatedAt
      };

      if (index !== -1) {
        list[index] = meta;
      } else {
        list.push(meta);
      }

      localStorage.setItem(STORAGE_KEYS.CV_LIST, JSON.stringify(list));
      return true;
    } catch (err) {
      console.error('Failed to save CV to localStorage:', err);
      return false;
    }
  }

  // Delete a CV document and its list reference
  function deleteCV(id) {
    if (!id) return false;
    try {
      localStorage.removeItem(`ai_cv_data_${id}`);
      const list = getSavedCVs();
      const filtered = list.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.CV_LIST, JSON.stringify(filtered));

      if (getActiveCVId() === id) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete CV:', err);
      return false;
    }
  }

  // Duplicate an existing CV
  function duplicateCV(id, newTitle) {
    const original = getCV(id);
    if (!original) return null;

    const cloned = JSON.parse(JSON.stringify(original));
    const newId = Config.generateId('cv');

    cloned.id = newId;
    cloned.title = newTitle || `${original.title} (Copy)`;
    cloned.metadata = {
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Regenerate internal section and item IDs to guarantee independence
    cloned.sections.forEach(sec => {
      const oldSecId = sec.id;
      const newSecId = `sec_${sec.type}_${Config.generateId('s')}`;
      sec.id = newSecId;

      const orderIdx = cloned.sectionOrder.indexOf(oldSecId);
      if (orderIdx !== -1) {
        cloned.sectionOrder[orderIdx] = newSecId;
      }

      if (Array.isArray(sec.items)) {
        sec.items.forEach(item => {
          if (item && item.id) {
            item.id = Config.generateId(sec.type);
          }
        });
      }
    });

    saveCV(newId, cloned);
    return newId;
  }

  // Active CV tracking
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

  // API configuration management
  function getApiKeys() {
    const raw = localStorage.getItem(STORAGE_KEYS.API_KEYS);
    const parsed = safeJsonParse(raw);
    return parsed || {
      provider: 'local', // 'local' | 'gemini' | 'openai'
      geminiKey: '',
      openaiKey: ''
    };
  }

  function saveApiKeys(keys) {
    if (!keys) return;
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
  }

  return {
    STORAGE_KEYS,
    getSavedCVs,
    getCV,
    saveCV,
    deleteCV,
    duplicateCV,
    getActiveCVId,
    setActiveCVId,
    getApiKeys,
    saveApiKeys,
    migrateLegacyCV
  };
});
