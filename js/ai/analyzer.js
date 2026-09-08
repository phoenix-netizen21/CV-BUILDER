// js/ai/analyzer.js
// Objective scoring engine and actionable suggestions generator for CV quality and ATS readiness.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVAnalyzer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Weak / passive verbs detector
  const WEAK_VERB_REGEX = /\b(helped|assisted|responsible for|worked on|did|handled|made|was part of|tried to)\b/i;

  // Metric detector (percentages, numbers, currencies)
  const METRIC_REGEX = /(\b\d+(\.\d+)?%|\$\d+[\d,]*|\b\d+\+?\s*(users|clients|customers|revenue|downloads|projects|percent|seconds|ms|hours))/i;

  function analyzeCV(cvData) {
    if (!cvData) {
      return {
        scores: { overall: 0, content: 0, clarity: 0, impact: 0, ats: 0 },
        suggestions: []
      };
    }

    const personal = cvData.personal || {};
    const sections = cvData.sections || [];
    const suggestions = [];

    let contentScore = 70;
    let clarityScore = 80;
    let impactScore = 70;
    let atsScore = 85;

    // --- 1. PERSONAL INFORMATION AUDIT ---
    if (!personal.fullName || personal.fullName.trim().length < 2) {
      contentScore -= 15;
      atsScore -= 15;
      suggestions.push({
        type: 'missing_info',
        severity: 'danger',
        sectionId: 'personal',
        title: 'Missing Full Name',
        message: 'A complete professional name is required on every resume.',
        fixAction: 'personal'
      });
    }

    if (!personal.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) {
      contentScore -= 15;
      atsScore -= 15;
      suggestions.push({
        type: 'missing_info',
        severity: 'danger',
        sectionId: 'personal',
        title: 'Missing or Invalid Email',
        message: 'Recruiters and ATS parsers require a valid direct email address.',
        fixAction: 'personal'
      });
    }

    if (!personal.phone) {
      contentScore -= 5;
      atsScore -= 5;
      suggestions.push({
        type: 'missing_info',
        severity: 'warning',
        sectionId: 'personal',
        title: 'No Phone Number Listed',
        message: 'Adding a phone number with country code improves interview reachout rates.',
        fixAction: 'personal'
      });
    }

    if (!personal.location) {
      atsScore -= 5;
      suggestions.push({
        type: 'missing_info',
        severity: 'warning',
        sectionId: 'personal',
        title: 'No Location Provided',
        message: 'Include your City and Country (e.g., "New York, USA") for regional ATS filtering.',
        fixAction: 'personal'
      });
    }

    if (!personal.linkedin) {
      suggestions.push({
        type: 'enhancement',
        severity: 'info',
        sectionId: 'personal',
        title: 'LinkedIn Profile Missing',
        message: 'Over 85% of recruiters cross-reference LinkedIn profiles.',
        fixAction: 'personal'
      });
    }

    // --- 2. SUMMARY SECTION AUDIT ---
    const summarySec = sections.find(s => s.type === 'summary' && s.visible);
    if (!summarySec || !summarySec.content || summarySec.content.trim().length < 20) {
      clarityScore -= 10;
      contentScore -= 10;
      suggestions.push({
        type: 'missing_section',
        severity: 'warning',
        sectionId: summarySec ? summarySec.id : null,
        title: 'Professional Summary Incomplete',
        message: 'A concise 2-3 line summary immediately informs hiring managers of your core specialization.',
        fixAction: summarySec ? summarySec.id : 'add_summary'
      });
    } else {
      contentScore += 5;
      clarityScore += 5;
      suggestions.push({
        type: 'success',
        severity: 'success',
        sectionId: summarySec.id,
        title: 'Strong Professional Summary',
        message: 'Your summary provides a clear initial hook.'
      });
    }

    // --- 3. EXPERIENCE SECTION AUDIT ---
    const expSec = sections.find(s => s.type === 'experience' && s.visible);
    if (expSec && Array.isArray(expSec.items) && expSec.items.length > 0) {
      let weakVerbCount = 0;
      let metricCount = 0;
      let totalBullets = 0;

      expSec.items.forEach(item => {
        const text = (item.description || '') + ' ' + (item.role || '');
        if (text.trim()) {
          totalBullets++;
          if (WEAK_VERB_REGEX.test(text)) {
            weakVerbCount++;
          }
          if (METRIC_REGEX.test(text)) {
            metricCount++;
          }
        }
      });

      if (weakVerbCount > 0) {
        impactScore -= weakVerbCount * 6;
        suggestions.push({
          type: 'weak_wording',
          severity: 'warning',
          sectionId: expSec.id,
          title: 'Weak Action Verbs Detected',
          message: `Found passive phrasing (e.g. "responsible for", "helped") in ${weakVerbCount} experience entry. Replace with strong verbs like "Spearheaded", "Architected", or "Optimized".`,
          fixAction: expSec.id
        });
      } else {
        impactScore += 8;
        suggestions.push({
          type: 'success',
          severity: 'success',
          sectionId: expSec.id,
          title: 'Action-Oriented Verbs',
          message: 'Work experience starts with strong, direct action verbs.'
        });
      }

      if (metricCount === 0 && totalBullets > 0) {
        impactScore -= 15;
        suggestions.push({
          type: 'missing_metrics',
          severity: 'warning',
          sectionId: expSec.id,
          title: 'Add Measurable Outcomes (Metrics)',
          message: 'Include quantifiable results (e.g. "increased speed by 35%", "managed $50k budget", "supported 10k users") to prove your impact.',
          fixAction: expSec.id
        });
      } else if (metricCount > 0) {
        impactScore += 10;
        suggestions.push({
          type: 'success',
          severity: 'success',
          sectionId: expSec.id,
          title: 'Measurable Impact Present',
          message: `Identified ${metricCount} quantifiable metric(s) demonstrating concrete business outcomes.`
        });
      }
    }

    // --- 4. SKILLS SECTION AUDIT ---
    const skillSec = sections.find(s => s.type === 'skills' && s.visible);
    if (skillSec && Array.isArray(skillSec.items)) {
      let totalSkills = 0;
      skillSec.items.forEach(g => {
        const arr = Array.isArray(g.skills) ? g.skills : [];
        totalSkills += arr.length;
      });

      if (totalSkills < 4) {
        atsScore -= 10;
        contentScore -= 5;
        suggestions.push({
          type: 'skills_count',
          severity: 'warning',
          sectionId: skillSec.id,
          title: 'Add More Core Competencies',
          message: 'Include at least 6-8 relevant technical and domain skills to match ATS keywords.',
          fixAction: skillSec.id
        });
      } else {
        atsScore += 5;
        suggestions.push({
          type: 'success',
          severity: 'success',
          sectionId: skillSec.id,
          title: 'Well-Defined Skill Catalog',
          message: `Identified ${totalSkills} relevant skills across categories.`
        });
      }
    }

    // --- 5. EDUCATION SECTION AUDIT ---
    const eduSec = sections.find(s => s.type === 'education' && s.visible);
    if (!eduSec || !Array.isArray(eduSec.items) || eduSec.items.length === 0) {
      contentScore -= 10;
      atsScore -= 5;
      suggestions.push({
        type: 'missing_section',
        severity: 'info',
        sectionId: eduSec ? eduSec.id : null,
        title: 'Education Section Missing',
        message: 'Degrees, diplomas, or academic credentials should be listed.',
        fixAction: eduSec ? eduSec.id : 'add_education'
      });
    }

    // Clamp scores between 20 and 99
    const clamp = val => Math.max(25, Math.min(98, Math.round(val)));
    const cScore = clamp(contentScore);
    const clScore = clamp(clarityScore);
    const iScore = clamp(impactScore);
    const aScore = clamp(atsScore);
    const overall = Math.round((cScore * 0.3) + (clScore * 0.2) + (iScore * 0.3) + (aScore * 0.2));

    return {
      scores: {
        overall,
        content: cScore,
        clarity: clScore,
        impact: iScore,
        ats: aScore
      },
      suggestions: suggestions
    };
  }

  return {
    analyzeCV
  };
});
