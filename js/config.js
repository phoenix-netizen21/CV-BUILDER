// js/config.js
// Global schema definitions, section catalog, presets, and constants.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Secure / reliable unique ID generator
  function generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  }

  // Pre-curated accent colors
  const ACCENT_COLORS = [
    { label: 'Navy Blue', value: '#1e3a8a' },
    { label: 'Royal Blue', value: '#2563eb' },
    { label: 'Slate Dark', value: '#1e293b' },
    { label: 'Emerald Green', value: '#047857' },
    { label: 'Crimson Red', value: '#b91c1c' },
    { label: 'Deep Purple', value: '#6b21a8' },
    { label: 'Teal Modern', value: '#0f766e' },
    { label: 'Burnt Amber', value: '#b45309' }
  ];

  // Typography definitions
  const FONT_FAMILIES = [
    { label: 'Inter (Clean & Modern)', value: 'Inter, sans-serif' },
    { label: 'Outfit (Contemporary)', value: 'Outfit, sans-serif' },
    { label: 'Playfair Display (Executive Serif)', value: '"Playfair Display", Georgia, serif' },
    { label: 'Georgia (Academic Traditional)', value: 'Georgia, serif' },
    { label: 'Roboto (Standard Clean)', value: 'Roboto, sans-serif' },
    { label: 'Source Code Pro (Tech Monospace)', value: '"Source Code Pro", monospace' }
  ];

  // Default design options
  const DEFAULT_DESIGN = {
    template: 'modern', // 'minimal' | 'modern' | 'corporate' | 'academic' | 'creative'
    fontFamily: 'Inter, sans-serif',
    fontSize: 'normal', // 'small' (9pt) | 'normal' (10pt) | 'large' (11pt)
    headingSize: 'normal', // 'compact' | 'normal' | 'prominent'
    lineHeight: 'normal', // 'tight' (1.3) | 'normal' (1.5) | 'relaxed' (1.7)
    sectionSpacing: 'normal', // 'compact' (12px) | 'normal' (18px) | 'spacious' (24px)
    pageMargins: 'normal', // 'compact' (10mm) | 'normal' (15mm) | 'spacious' (20mm)
    accentColor: '#1e3a8a',
    textColor: '#0f172a',
    layoutDensity: 'standard' // 'compact' | 'standard' | 'comfortable'
  };

  // Section Catalog: metadata, icons, and item factories for all supported section types
  const SECTION_CATALOG = {
    personal: {
      type: 'personal',
      title: 'Personal Information',
      icon: 'fa-user',
      isSingular: true,
      removable: false
    },
    summary: {
      type: 'summary',
      title: 'Professional Summary',
      icon: 'fa-file-lines',
      isSingular: true,
      removable: true,
      createInitial: () => ({
        content: ''
      })
    },
    experience: {
      type: 'experience',
      title: 'Work Experience',
      icon: 'fa-briefcase',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('exp'),
        title: '',
        role: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        highlights: []
      })
    },
    education: {
      type: 'education',
      title: 'Education',
      icon: 'fa-graduation-cap',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('edu'),
        institution: '',
        degree: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        score: '',
        coursework: ''
      })
    },
    projects: {
      type: 'projects',
      title: 'Projects',
      icon: 'fa-code-branch',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('proj'),
        title: '',
        role: '',
        technologies: '',
        link: '',
        duration: '',
        description: ''
      })
    },
    skills: {
      type: 'skills',
      title: 'Skills & Competencies',
      icon: 'fa-screwdriver-wrench',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('skill_group'),
        category: 'Technical Skills',
        skills: []
      })
    },
    certifications: {
      type: 'certifications',
      title: 'Certifications',
      icon: 'fa-certificate',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('cert'),
        name: '',
        issuer: '',
        date: '',
        link: ''
      })
    },
    achievements: {
      type: 'achievements',
      title: 'Achievements & Awards',
      icon: 'fa-trophy',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('ach'),
        title: '',
        issuer: '',
        date: '',
        description: ''
      })
    },
    publications: {
      type: 'publications',
      title: 'Publications',
      icon: 'fa-book-bookmark',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('pub'),
        title: '',
        authors: '',
        journal: '',
        date: '',
        link: '',
        description: ''
      })
    },
    leadership: {
      type: 'leadership',
      title: 'Leadership & Activities',
      icon: 'fa-people-roof',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('lead'),
        title: '',
        organization: '',
        duration: '',
        description: ''
      })
    },
    volunteering: {
      type: 'volunteering',
      title: 'Volunteering & Service',
      icon: 'fa-hand-holding-heart',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('vol'),
        role: '',
        organization: '',
        duration: '',
        description: ''
      })
    },
    languages: {
      type: 'languages',
      title: 'Languages',
      icon: 'fa-language',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('lang'),
        language: '',
        proficiency: 'Fluent' // Native, Fluent, Conversational, Basic
      })
    },
    interests: {
      type: 'interests',
      title: 'Interests & Hobbies',
      icon: 'fa-compass',
      isSingular: true,
      removable: true,
      createInitial: () => ({
        items: []
      })
    },
    custom: {
      type: 'custom',
      title: 'Custom Section',
      icon: 'fa-folder-plus',
      isSingular: false,
      removable: true,
      createItem: () => ({
        id: generateId('custom_item'),
        title: '',
        subtitle: '',
        date: '',
        location: '',
        description: ''
      })
    }
  };

  // Category Presets - Starter configurations for different user profiles
  const CATEGORY_PRESETS = {
    software_eng: {
      id: 'software_eng',
      title: 'Software Engineering',
      subtitle: 'For developers, DevOps, and technical architects.',
      icon: 'fa-laptop-code',
      sections: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications']
    },
    fresher: {
      id: 'fresher',
      title: 'Fresher / Recent Graduate',
      subtitle: 'For new graduates launching their careers.',
      icon: 'fa-user-graduate',
      sections: ['summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements']
    },
    experienced: {
      id: 'experienced',
      title: 'Experienced Professional',
      subtitle: 'For mid to senior professionals with industry track record.',
      icon: 'fa-user-tie',
      sections: ['summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'leadership']
    },
    academic: {
      id: 'academic',
      title: 'Academic & Research',
      subtitle: 'For scholars, PhD researchers, and educators.',
      icon: 'fa-book-open',
      sections: ['summary', 'education', 'publications', 'experience', 'projects', 'achievements', 'skills', 'languages']
    },
    internship: {
      id: 'internship',
      title: 'Internship & College Student',
      subtitle: 'For students targeting competitive internship programs.',
      icon: 'fa-graduation-cap',
      sections: ['summary', 'education', 'projects', 'skills', 'leadership', 'volunteering', 'achievements']
    },
    general: {
      id: 'general',
      title: 'General / Custom Purpose',
      subtitle: 'A balanced structure easily adaptable to any profession.',
      icon: 'fa-briefcase',
      sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'languages']
    }
  };

  // Factory to create a clean, fully-initialized CV document
  function createEmptyCV(presetId = 'general', title = 'My Resume') {
    const preset = CATEGORY_PRESETS[presetId] || CATEGORY_PRESETS.general;
    const cvId = generateId('cv');

    const sections = [];
    const sectionOrder = [];

    // Personal details are always first-class
    const personal = {
      fullName: '',
      professionalTitle: '',
      profilePhoto: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    };

    // Instantiate preset sections
    for (const secType of preset.sections) {
      const catalogEntry = SECTION_CATALOG[secType];
      if (!catalogEntry) continue;

      const secId = `sec_${secType}_${Math.random().toString(36).substring(2, 6)}`;
      sectionOrder.push(secId);

      const sectionObj = {
        id: secId,
        type: secType,
        title: catalogEntry.title,
        visible: true
      };

      if (secType === 'summary') {
        sectionObj.content = '';
      } else if (secType === 'interests') {
        sectionObj.items = [];
      } else if (secType === 'skills') {
        sectionObj.items = [
          {
            id: generateId('skill_group'),
            category: 'Technical Skills',
            skills: []
          }
        ];
      } else if (typeof catalogEntry.createItem === 'function') {
        sectionObj.items = [catalogEntry.createItem()];
      } else {
        sectionObj.items = [];
      }

      sections.push(sectionObj);
    }

    return {
      id: cvId,
      title: title,
      preset: presetId,
      personal: personal,
      sections: sections,
      sectionOrder: sectionOrder,
      design: { ...DEFAULT_DESIGN },
      metadata: {
        version: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  return {
    generateId,
    ACCENT_COLORS,
    FONT_FAMILIES,
    DEFAULT_DESIGN,
    SECTION_CATALOG,
    CATEGORY_PRESETS,
    createEmptyCV
  };
});
