// templates.js
// Template engines for rendering the CV Preview in 4 distinct themes.
// Highly modular: renders sections dynamically based on ordering and visibility settings.

const TEMPLATE_MODERN_PROF = {
  id: "modern_prof",
  name: "Modern Professional",
  render(data, sectionOrder, hiddenSections) {
    const personal = data.personal || {};
    const photoHtml = personal.profilePhoto 
      ? `<div class="cv-photo-container"><img src="${escapeHtml(personal.profilePhoto)}" alt="${escapeHtml(personal.fullName)}" class="cv-photo"></div>`
      : "";

    // Contact Grid
    const contacts = [];
    if (personal.email) contacts.push(`<span class="contact-item"><i class="fa fa-envelope"></i> ${escapeHtml(personal.email)}</span>`);
    if (personal.phone) contacts.push(`<span class="contact-item"><i class="fa fa-phone"></i> ${escapeHtml(personal.phone)}</span>`);
    if (personal.location) contacts.push(`<span class="contact-item"><i class="fa fa-map-marker"></i> ${escapeHtml(personal.location)}</span>`);
    
    // Social Links
    const links = [];
    if (personal.linkedin) links.push(`<a href="${escapeHtml(personal.linkedin)}" target="_blank" class="contact-link"><i class="fa fa-linkedin"></i> LinkedIn</a>`);
    if (personal.github) links.push(`<a href="${escapeHtml(personal.github)}" target="_blank" class="contact-link"><i class="fa fa-github"></i> GitHub</a>`);
    if (personal.portfolio) links.push(`<a href="${escapeHtml(personal.portfolio)}" target="_blank" class="contact-link"><i class="fa fa-globe"></i> Portfolio</a>`);

    let bodyHtml = "";
    
    // Iterate over sections in user order
    for (const secId of sectionOrder) {
      if (secId === "personal") continue; // Done in header
      if (hiddenSections.has(secId)) continue;
      
      const secData = data[secId];
      if (!secData || (Array.isArray(secData) && secData.length === 0)) continue;
      
      const secConfig = window.CV_CATEGORIES[data.category]?.sections.find(s => s.id === secId);
      if (!secConfig) continue;

      let sectionContentHtml = "";

      if (secConfig.type === "tags") {
        const tags = Array.isArray(secData) ? secData : (typeof secData === "string" ? secData.split(",").map(t => t.trim()) : []);
        if (tags.length > 0 && tags[0] !== "") {
          sectionContentHtml = `<div class="cv-tags-container">${tags.map(t => `<span class="cv-tag-item">${escapeHtml(t)}</span>`).join("")}</div>`;
        }
      } else if (secConfig.type === "list" && Array.isArray(secData)) {
        sectionContentHtml = secData.map(item => {
          if (isEmptyObject(item)) return "";
          
          // Formulate title line and duration
          const mainTitle = item.companyName || item.collegeName || item.schoolName || item.organization || item.activity || item.title || "";
          const subtitle = item.roleName || item.degree || item.gradeClass || item.activity || item.issuer || item.authors || "";
          const duration = item.duration || item.graduationYear || item.date || "";
          const extraInfo = item.cgpa || item.cgpaScore || item.department || item.thesisTitle || item.journalName || item.amount || "";
          
          let descHtml = "";
          if (item.responsibilities) descHtml += formatDescription(item.responsibilities);
          if (item.achievements) descHtml += formatDescription(item.achievements);
          if (item.description) descHtml += formatDescription(item.description);
          if (item.projectsText) descHtml += `<div class="cv-item-subprojects"><strong>Projects:</strong> ${formatDescription(item.projectsText)}</div>`;
          
          return `
            <div class="cv-list-item">
              <div class="cv-item-header">
                <div class="cv-item-title-block">
                  <span class="cv-item-main">${escapeHtml(mainTitle)}</span>
                  ${subtitle ? `<span class="cv-item-sub">| ${escapeHtml(subtitle)}</span>` : ""}
                  ${extraInfo ? `<span class="cv-item-extra">(${escapeHtml(extraInfo)})</span>` : ""}
                </div>
                ${duration ? `<span class="cv-item-date">${escapeHtml(duration)}</span>` : ""}
              </div>
              ${descHtml}
            </div>
          `;
        }).join("");
      }

      if (sectionContentHtml) {
        bodyHtml += `
          <div class="cv-section" data-section-id="${secId}">
            <h3 class="cv-section-title">${escapeHtml(secConfig.title)}</h3>
            <div class="cv-section-content">${sectionContentHtml}</div>
          </div>
        `;
      }
    }

    return `
      <div class="cv-template-modern_prof">
        <div class="cv-header">
          ${photoHtml}
          <div class="cv-header-text">
            <h1 class="cv-name">${escapeHtml(personal.fullName || "Your Name")}</h1>
            <h2 class="cv-title">${escapeHtml(personal.professionalTitle || "Professional Title")}</h2>
            <div class="cv-contacts">${contacts.join(" &bull; ")}</div>
            ${links.length > 0 ? `<div class="cv-links">${links.join(" &nbsp;|&nbsp; ")}</div>` : ""}
          </div>
        </div>
        ${personal.summary && !hiddenSections.has("personal-summary") ? `
          <div class="cv-section" data-section-id="personal-summary">
            <h3 class="cv-section-title">Professional Summary</h3>
            <div class="cv-section-content cv-summary-text">${formatDescription(personal.summary)}</div>
          </div>
        ` : ""}
        <div class="cv-body">
          ${bodyHtml}
        </div>
      </div>
    `;
  }
};

const TEMPLATE_MINIMAL_ATS = {
  id: "minimal_ats",
  name: "Minimal ATS",
  render(data, sectionOrder, hiddenSections) {
    const personal = data.personal || {};

    const contacts = [];
    if (personal.email) contacts.push(personal.email);
    if (personal.phone) contacts.push(personal.phone);
    if (personal.location) contacts.push(personal.location);
    if (personal.linkedin) contacts.push(personal.linkedin.replace(/^https?:\/\/(www\.)?/, ""));
    if (personal.github) contacts.push(personal.github.replace(/^https?:\/\/(www\.)?/, ""));
    if (personal.portfolio) contacts.push(personal.portfolio.replace(/^https?:\/\/(www\.)?/, ""));

    let bodyHtml = "";
    
    for (const secId of sectionOrder) {
      if (secId === "personal") continue;
      if (hiddenSections.has(secId)) continue;
      
      const secData = data[secId];
      if (!secData || (Array.isArray(secData) && secData.length === 0)) continue;
      
      const secConfig = window.CV_CATEGORIES[data.category]?.sections.find(s => s.id === secId);
      if (!secConfig) continue;

      let sectionContentHtml = "";

      if (secConfig.type === "tags") {
        const tags = Array.isArray(secData) ? secData : (typeof secData === "string" ? secData.split(",").map(t => t.trim()) : []);
        if (tags.length > 0 && tags[0] !== "") {
          sectionContentHtml = `<p class="ats-tags"><strong>${escapeHtml(secConfig.title)}:</strong> ${tags.map(t => escapeHtml(t)).join(", ")}</p>`;
        }
      } else if (secConfig.type === "list" && Array.isArray(secData)) {
        sectionContentHtml = secData.map(item => {
          if (isEmptyObject(item)) return "";
          
          const mainTitle = item.companyName || item.collegeName || item.schoolName || item.organization || item.activity || item.title || "";
          const subtitle = item.roleName || item.degree || item.gradeClass || item.activity || item.issuer || item.authors || "";
          const duration = item.duration || item.graduationYear || item.date || "";
          const extraInfo = item.cgpa || item.cgpaScore || item.department || item.thesisTitle || item.journalName || item.amount || "";
          
          let descHtml = "";
          if (item.responsibilities) descHtml += formatDescription(item.responsibilities);
          if (item.achievements) descHtml += formatDescription(item.achievements);
          if (item.description) descHtml += formatDescription(item.description);
          if (item.projectsText) descHtml += formatDescription(item.projectsText);

          return `
            <div class="ats-list-item">
              <div class="ats-item-header">
                <strong>${escapeHtml(mainTitle)}</strong>
                <span>${escapeHtml(duration)}</span>
              </div>
              <div class="ats-item-subheader">
                <span>${escapeHtml(subtitle)}${extraInfo ? `, ${escapeHtml(extraInfo)}` : ""}</span>
              </div>
              <div class="ats-item-desc">${descHtml}</div>
            </div>
          `;
        }).join("");
      }

      if (sectionContentHtml) {
        bodyHtml += `
          <div class="ats-section" data-section-id="${secId}">
            <h2 class="ats-section-title">${escapeHtml(secConfig.title.toUpperCase())}</h2>
            <div class="ats-section-content">${sectionContentHtml}</div>
          </div>
        `;
      }
    }

    return `
      <div class="cv-template-minimal_ats">
        <div class="ats-header">
          <h1 class="ats-name">${escapeHtml(personal.fullName || "Your Name")}</h1>
          <p class="ats-title">${escapeHtml(personal.professionalTitle || "Professional Title")}</p>
          <div class="ats-contacts">${contacts.map(c => escapeHtml(c)).join("  |  ")}</div>
        </div>
        ${personal.summary && !hiddenSections.has("personal-summary") ? `
          <div class="ats-section" data-section-id="personal-summary">
            <h2 class="ats-section-title">SUMMARY</h2>
            <div class="ats-section-content ats-summary">${formatDescription(personal.summary)}</div>
          </div>
        ` : ""}
        <div class="ats-body">
          ${bodyHtml}
        </div>
      </div>
    `;
  }
};

const TEMPLATE_CORP_EXEC = {
  id: "corp_exec",
  name: "Corporate Executive",
  render(data, sectionOrder, hiddenSections) {
    const personal = data.personal || {};

    const contacts = [];
    if (personal.email) contacts.push(`<i class="fa fa-envelope"></i> ${escapeHtml(personal.email)}`);
    if (personal.phone) contacts.push(`<i class="fa fa-phone"></i> ${escapeHtml(personal.phone)}`);
    if (personal.location) contacts.push(`<i class="fa fa-map-marker"></i> ${escapeHtml(personal.location)}`);

    const links = [];
    if (personal.linkedin) links.push(`<a href="${escapeHtml(personal.linkedin)}" target="_blank"><i class="fa fa-linkedin"></i> LinkedIn</a>`);
    if (personal.github) links.push(`<a href="${escapeHtml(personal.github)}" target="_blank"><i class="fa fa-github"></i> GitHub</a>`);
    if (personal.portfolio) links.push(`<a href="${escapeHtml(personal.portfolio)}" target="_blank"><i class="fa fa-globe"></i> Portfolio</a>`);

    let bodyHtml = "";
    
    for (const secId of sectionOrder) {
      if (secId === "personal") continue;
      if (hiddenSections.has(secId)) continue;
      
      const secData = data[secId];
      if (!secData || (Array.isArray(secData) && secData.length === 0)) continue;
      
      const secConfig = window.CV_CATEGORIES[data.category]?.sections.find(s => s.id === secId);
      if (!secConfig) continue;

      let sectionContentHtml = "";

      if (secConfig.type === "tags") {
        const tags = Array.isArray(secData) ? secData : (typeof secData === "string" ? secData.split(",").map(t => t.trim()) : []);
        if (tags.length > 0 && tags[0] !== "") {
          sectionContentHtml = `<div class="exec-tags">${tags.map(t => `<span class="exec-tag">${escapeHtml(t)}</span>`).join("")}</div>`;
        }
      } else if (secConfig.type === "list" && Array.isArray(secData)) {
        sectionContentHtml = secData.map(item => {
          if (isEmptyObject(item)) return "";
          
          const mainTitle = item.companyName || item.collegeName || item.schoolName || item.organization || item.activity || item.title || "";
          const subtitle = item.roleName || item.degree || item.gradeClass || item.activity || item.issuer || item.authors || "";
          const duration = item.duration || item.graduationYear || item.date || "";
          const extraInfo = item.cgpa || item.cgpaScore || item.department || item.thesisTitle || item.journalName || item.amount || "";
          
          let descHtml = "";
          if (item.responsibilities) descHtml += formatDescription(item.responsibilities);
          if (item.achievements) descHtml += formatDescription(item.achievements);
          if (item.description) descHtml += formatDescription(item.description);
          if (item.projectsText) descHtml += formatDescription(item.projectsText);

          return `
            <div class="exec-list-item">
              <table class="exec-item-table">
                <tr>
                  <td class="exec-item-left">
                    <strong class="exec-item-main">${escapeHtml(mainTitle)}</strong>
                    <div class="exec-item-sub">${escapeHtml(subtitle)}${extraInfo ? ` &bull; ${escapeHtml(extraInfo)}` : ""}</div>
                  </td>
                  <td class="exec-item-right">
                    <span class="exec-item-date">${escapeHtml(duration)}</span>
                  </td>
                </tr>
              </table>
              <div class="exec-item-desc">${descHtml}</div>
            </div>
          `;
        }).join("");
      }

      if (sectionContentHtml) {
        bodyHtml += `
          <div class="exec-section" data-section-id="${secId}">
            <h2 class="exec-section-title"><span>${escapeHtml(secConfig.title)}</span></h2>
            <div class="exec-section-content">${sectionContentHtml}</div>
          </div>
        `;
      }
    }

    return `
      <div class="cv-template-corp_exec">
        <div class="exec-banner"></div>
        <div class="exec-header">
          <h1 class="exec-name">${escapeHtml(personal.fullName || "Your Name")}</h1>
          <p class="exec-title">${escapeHtml(personal.professionalTitle || "Professional Title")}</p>
          <div class="exec-contacts">
            <div class="exec-contact-row">${contacts.join("  |  ")}</div>
            ${links.length > 0 ? `<div class="exec-links-row">${links.join("  |  ")}</div>` : ""}
          </div>
        </div>
        ${personal.summary && !hiddenSections.has("personal-summary") ? `
          <div class="exec-section" data-section-id="personal-summary">
            <h2 class="exec-section-title"><span>Executive Summary</span></h2>
            <div class="exec-section-content exec-summary">${formatDescription(personal.summary)}</div>
          </div>
        ` : ""}
        <div class="exec-body">
          ${bodyHtml}
        </div>
      </div>
    `;
  }
};

const TEMPLATE_ACADEMIC_CLEAN = {
  id: "academic_clean",
  name: "Academic Clean",
  render(data, sectionOrder, hiddenSections) {
    const personal = data.personal || {};

    const contacts = [];
    if (personal.email) contacts.push(`<i class="fa fa-envelope-o"></i> ${escapeHtml(personal.email)}`);
    if (personal.phone) contacts.push(`<i class="fa fa-phone"></i> ${escapeHtml(personal.phone)}`);
    if (personal.location) contacts.push(`<i class="fa fa-map-marker"></i> ${escapeHtml(personal.location)}`);

    const links = [];
    if (personal.linkedin) links.push(`<a href="${escapeHtml(personal.linkedin)}" target="_blank">LinkedIn</a>`);
    if (personal.github) links.push(`<a href="${escapeHtml(personal.github)}" target="_blank">GitHub</a>`);
    if (personal.portfolio) links.push(`<a href="${escapeHtml(personal.portfolio)}" target="_blank">Portfolio</a>`);

    let bodyHtml = "";
    
    for (const secId of sectionOrder) {
      if (secId === "personal") continue;
      if (hiddenSections.has(secId)) continue;
      
      const secData = data[secId];
      if (!secData || (Array.isArray(secData) && secData.length === 0)) continue;
      
      const secConfig = window.CV_CATEGORIES[data.category]?.sections.find(s => s.id === secId);
      if (!secConfig) continue;

      let sectionContentHtml = "";

      if (secConfig.type === "tags") {
        const tags = Array.isArray(secData) ? secData : (typeof secData === "string" ? secData.split(",").map(t => t.trim()) : []);
        if (tags.length > 0 && tags[0] !== "") {
          sectionContentHtml = `<p class="acad-tags"><strong>${escapeHtml(secConfig.title)}:</strong> ${tags.map(t => escapeHtml(t)).join(", ")}</p>`;
        }
      } else if (secConfig.type === "list" && Array.isArray(secData)) {
        sectionContentHtml = secData.map(item => {
          if (isEmptyObject(item)) return "";
          
          const mainTitle = item.companyName || item.collegeName || item.schoolName || item.organization || item.activity || item.title || "";
          const subtitle = item.roleName || item.degree || item.gradeClass || item.activity || item.issuer || item.authors || "";
          const duration = item.duration || item.graduationYear || item.date || "";
          const extraInfo = item.cgpa || item.cgpaScore || item.department || item.thesisTitle || item.journalName || item.amount || "";
          
          let descHtml = "";
          if (item.responsibilities) descHtml += formatDescription(item.responsibilities);
          if (item.achievements) descHtml += formatDescription(item.achievements);
          if (item.description) descHtml += formatDescription(item.description);
          if (item.projectsText) descHtml += formatDescription(item.projectsText);

          return `
            <div class="acad-list-item">
              <div class="acad-item-row">
                <span class="acad-item-left">
                  <strong class="acad-main">${escapeHtml(mainTitle)}</strong>
                  ${subtitle ? `<span class="acad-sub">, ${escapeHtml(subtitle)}</span>` : ""}
                  ${extraInfo ? `<span class="acad-extra"> (${escapeHtml(extraInfo)})</span>` : ""}
                </span>
                <span class="acad-item-right">${escapeHtml(duration)}</span>
              </div>
              <div class="acad-item-desc">${descHtml}</div>
            </div>
          `;
        }).join("");
      }

      if (sectionContentHtml) {
        bodyHtml += `
          <div class="acad-section" data-section-id="${secId}">
            <h2 class="acad-section-title">${escapeHtml(secConfig.title)}</h2>
            <div class="acad-section-content">${sectionContentHtml}</div>
          </div>
        `;
      }
    }

    return `
      <div class="cv-template-academic_clean">
        <div class="acad-header">
          <h1 class="acad-name">${escapeHtml(personal.fullName || "Your Name")}</h1>
          <p class="acad-title">${escapeHtml(personal.professionalTitle || "Curriculum Vitae")}</p>
          <div class="acad-contacts">${contacts.join(" &bull; ")}</div>
          ${links.length > 0 ? `<div class="acad-links">${links.join(" &nbsp;|&nbsp; ")}</div>` : ""}
        </div>
        ${personal.summary && !hiddenSections.has("personal-summary") ? `
          <div class="acad-section" data-section-id="personal-summary">
            <h2 class="acad-section-title">Biography / Profile</h2>
            <div class="acad-section-content acad-summary">${formatDescription(personal.summary)}</div>
          </div>
        ` : ""}
        <div class="acad-body">
          ${bodyHtml}
        </div>
      </div>
    `;
  }
};

// HELPER FUNCTIONS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isEmptyObject(obj) {
  if (!obj) return true;
  return Object.values(obj).every(val => !val || val === "");
}

function formatDescription(text) {
  if (!text) return "";
  const lines = text.split("\n").map(line => line.trim());
  const bulletLines = [];
  let isBulleted = false;

  for (const line of lines) {
    if (line.startsWith("-") || line.startsWith("*")) {
      isBulleted = true;
      bulletLines.push(`<li>${escapeHtml(line.substring(1).trim())}</li>`);
    } else if (line.length > 0) {
      if (isBulleted) {
        // Close bulleted list and append raw text
        bulletLines.push("</ul>");
        isBulleted = false;
      }
      bulletLines.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  
  if (isBulleted) {
    bulletLines.push("</ul>");
  }

  // If we collected items inside lists but did not enclose the opening <ul>
  let finalHtml = "";
  let insideUl = false;
  for (const chunk of bulletLines) {
    if (chunk.startsWith("<li>")) {
      if (!insideUl) {
        finalHtml += '<ul class="cv-bullets">';
        insideUl = true;
      }
      finalHtml += chunk;
    } else if (chunk === "</ul>") {
      finalHtml += "</ul>";
      insideUl = false;
    } else {
      if (insideUl) {
        finalHtml += "</ul>";
        insideUl = false;
      }
      finalHtml += chunk;
    }
  }

  if (insideUl) {
    finalHtml += "</ul>";
  }

  return finalHtml;
}

const TEMPLATE_ENGINES = {
  modern_prof: TEMPLATE_MODERN_PROF,
  minimal_ats: TEMPLATE_MINIMAL_ATS,
  corp_exec: TEMPLATE_CORP_EXEC,
  academic_clean: TEMPLATE_ACADEMIC_CLEAN
};

if (typeof window !== "undefined") {
  window.TEMPLATE_ENGINES = TEMPLATE_ENGINES;
}
