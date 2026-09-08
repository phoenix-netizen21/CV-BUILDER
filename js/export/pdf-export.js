// js/export/pdf-export.js
// High-fidelity A4 PDF export compiler with orphan prevention, multi-page pagination, and print fallback.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVPdfExport = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load external script: ${url}`));
      document.head.appendChild(script);
    });
  }

  async function exportPdf(containerElement, cvTitle = 'Resume') {
    if (!containerElement) {
      throw new Error('No preview element provided for PDF generation.');
    }

    const safeTitle = (cvTitle || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}.pdf`;

    // Ensure html2pdf is available
    if (typeof window.html2pdf === 'undefined') {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      } catch (e) {
        console.warn('Could not load html2pdf.js, triggering system print window...', e);
        window.print();
        return;
      }
    }

    // Save previous transform state (e.g. preview zoom)
    const prevTransform = containerElement.style.transform;
    const prevWidth = containerElement.style.width;
    const prevBoxShadow = containerElement.style.boxShadow;

    // Normalize element for 1:1 crisp vector A4 generation
    containerElement.style.transform = 'none';
    containerElement.style.boxShadow = 'none';
    containerElement.style.width = '210mm';

    // Add page-break avoidance class to all section items
    const breakItems = containerElement.querySelectorAll(
      '.ats-item, .modern-item, .corp-item, .acad-item, .creative-timeline-node, .creative-project-card, .cv-section, .modern-section, .corp-section, .acad-section, .ats-section'
    );
    breakItems.forEach(el => {
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside = 'avoid';
    });

    const opt = {
      margin: [8, 8, 8, 8], // mm
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    try {
      await window.html2pdf().from(containerElement).set(opt).save();
    } catch (err) {
      console.error('html2pdf generation error, falling back to system print:', err);
      window.print();
    } finally {
      // Restore previous zoom and styling
      containerElement.style.transform = prevTransform;
      containerElement.style.width = prevWidth;
      containerElement.style.boxShadow = prevBoxShadow;
    }
  }

  function triggerPrint() {
    window.print();
  }

  return {
    exportPdf,
    triggerPrint
  };
});
