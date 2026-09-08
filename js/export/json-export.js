// js/export/json-export.js
// JSON backup export and import with schema validation and automatic format migration.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../storage.js'));
  } else {
    root.CVJsonExport = factory(root.CVStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (Storage) {
  'use strict';

  function downloadJson(data, filename = 'cv_backup.json') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  function exportCV(cvData) {
    if (!cvData) return;
    const safeTitle = (cvData.title || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadJson(cvData, `${safeTitle}_data.json`);
  }

  function readJsonFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('No file selected'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const migrated = Storage.migrateLegacyCV(parsed);
          if (!migrated || !migrated.id) {
            return reject(new Error('Invalid CV data structure in file.'));
          }
          resolve(migrated);
        } catch (err) {
          reject(new Error('Could not parse JSON file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }

  return {
    exportCV,
    readJsonFile
  };
});
