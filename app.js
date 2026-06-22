// app.js
// Main application controller. Handles state, navigation, form generation, reordering, and exports.

document.addEventListener("DOMContentLoaded", () => {
  // --- APP STATE ---
  let activeCVId = null;
  let activeCVData = null;
  let debounceTimeout = null;

  // --- DOM ELEMENTS ---
  const logoBtn = document.getElementById("logo-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const apiSettingsBtn = document.getElementById("api-settings-btn");
  
  // Navigation Screens
  const welcomeSection = document.getElementById("step-welcome");
  const selectCategorySection = document.getElementById("step-select-category");
  const editorSection = document.getElementById("step-editor");
  const progressBarWrapper = document.getElementById("progress-bar-wrapper");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const stepDots = [
    document.getElementById("step-dot-1"),
    document.getElementById("step-dot-2"),
    document.getElementById("step-dot-3")
  ];

  // Screen CTAs
  const btnCreateNew = document.getElementById("btn-create-new");
  const btnViewTemplates = document.getElementById("btn-view-templates");
  const btnBackToWelcome = document.getElementById("btn-back-to-welcome");
  const btnBackToSelect = document.getElementById("btn-back-to-select");
  
  // Editor Header Actions
  const cvTitleInput = document.getElementById("cv-title-input");
  const btnSaveManual = document.getElementById("btn-save-manual");
  const btnDuplicateCV = document.getElementById("btn-duplicate-cv");
  const btnResetForm = document.getElementById("btn-reset-form");

  // Editor Panels
  const dynamicFormSections = document.getElementById("dynamic-form-sections");
  const reorderSectionsList = document.getElementById("reorder-sections-list");
  
  // Preview Controls
  const templateSelect = document.getElementById("template-select");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomPercentText = document.getElementById("zoom-percent");
  const cvPreviewContainer = document.getElementById("cv-preview-container");
  const btnDownloadPdf = document.getElementById("btn-download-pdf");
  const btnDownloadDocx = document.getElementById("btn-download-docx");

  // AI Modal
  const modalAiCopilot = document.getElementById("modal-ai-copilot");
  const btnCloseAiModal = document.getElementById("btn-close-ai-modal");
  const aiInputText = document.getElementById("ai-input-text");
  const aiOutputText = document.getElementById("ai-output-text");
  const aiInputCharCount = document.getElementById("ai-input-char-count");
  const btnAiGenerate = document.getElementById("btn-ai-generate");
  const btnAiApply = document.getElementById("btn-ai-apply");
  let activeAiTargetInput = null; // References the textarea being polished

  // Templates Gallery Modal
  const modalTemplatesGallery = document.getElementById("modal-templates-gallery");
  const btnCloseTemplatesModal = document.getElementById("btn-close-templates-modal");

  // API Config Modal
  const modalApiSettings = document.getElementById("modal-api-settings");
  const btnCloseApiModal = document.getElementById("btn-close-api-modal");
  const apiConfigForm = document.getElementById("api-config-form");
  const aiProviderSelect = document.getElementById("ai-provider-select");
  const apiKeyGroup = document.getElementById("api-key-group");
  const apiKeyInput = document.getElementById("api-key-input");

  // Toast container
  const toastContainer = document.getElementById("toast-container");

  // --- INITIALIZATION ---
  function init() {
    setupTheme();
    loadApiSettings();
    renderSavedCVsList();
    renderTemplateSelectDropdown();
    setupEventListeners();

    // Check if there was an active session
    const savedActiveId = window.getActiveCVId();
    if (savedActiveId && window.getCV(savedActiveId)) {
      loadEditorForCV(savedActiveId);
    } else {
      navigateToWelcome();
    }
  }

  // --- THEME & API SETUP ---
  function setupTheme() {
    const savedTheme = localStorage.getItem("ai_cv_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ai_cv_theme", newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`);
  }

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector("i");
    if (theme === "dark") {
      icon.className = "fa-solid fa-sun";
    } else {
      icon.className = "fa-solid fa-moon";
    }
  }

  function loadApiSettings() {
    const apiConfig = window.getApiKeys();
    aiProviderSelect.value = apiConfig.provider;
    apiKeyInput.value = apiConfig.key || "";
    toggleApiKeyInputVisibility(apiConfig.provider);
  }

  function toggleApiKeyInputVisibility(provider) {
    if (provider === "local") {
      apiKeyGroup.style.display = "none";
      apiKeyInput.required = false;
    } else {
      apiKeyGroup.style.display = "block";
      apiKeyInput.required = true;
    }
  }

  // --- ROUTING / SCREEN NAVIGATION ---
  function navigateToWelcome() {
    window.setActiveCVId(null);
    activeCVId = null;
    activeCVData = null;

    welcomeSection.classList.add("active");
    selectCategorySection.classList.remove("active");
    editorSection.classList.remove("active");
    progressBarWrapper.style.display = "none";
    renderSavedCVsList();
  }

  function navigateToCategorySelect() {
    welcomeSection.classList.remove("active");
    selectCategorySection.classList.add("active");
    editorSection.classList.remove("active");
    
    progressBarWrapper.style.display = "flex";
    progressBarFill.style.width = "15%";
    updateStepDots(1);
    
    renderCategoryCards();
  }

  function navigateToEditor() {
    welcomeSection.classList.remove("active");
    selectCategorySection.classList.remove("active");
    editorSection.classList.add("active");
    
    progressBarWrapper.style.display = "flex";
    progressBarFill.style.width = "70%";
    updateStepDots(2);
  }

  function updateStepDots(activeStep) {
    stepDots.forEach((dot, index) => {
      if (index + 1 <= activeStep) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  // --- RENDER SCREEN COMPONENTS ---
  function renderSavedCVsList() {
    const savedGrid = document.getElementById("saved-cvs-grid");
    const draftsContainer = document.getElementById("saved-cvs-container");
    const list = window.getSavedCVs();

    if (list.length === 0) {
      draftsContainer.style.display = "none";
      return;
    }

    draftsContainer.style.display = "block";
    savedGrid.innerHTML = list.map(cv => {
      const catConfig = window.CV_CATEGORIES[cv.category] || { title: "Custom CV" };
      const date = new Date(cv.lastSaved).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      return `
        <div class="saved-cv-card" data-cv-id="${cv.id}">
          <div class="cv-card-top">
            <h3 title="${escapeHtml(cv.title)}">${escapeHtml(cv.title)}</h3>
            <span class="cv-card-tag">${escapeHtml(catConfig.title)}</span>
            <div class="cv-card-date">Saved ${date}</div>
          </div>
          <div class="cv-card-actions">
            <div class="cv-card-actions-left">
              <button class="card-action-btn edit" data-action="edit"><i class="fa-solid fa-pen-to-square"></i> Open</button>
              <button class="card-action-btn duplicate secondary-btn" data-action="duplicate" style="padding: 6px; border: 1px solid var(--border-color);"><i class="fa-solid fa-copy"></i></button>
            </div>
            <button class="card-action-btn delete" data-action="delete"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCategoryCards() {
    const grid = document.getElementById("categories-grid");
    grid.innerHTML = Object.values(window.CV_CATEGORIES).map(cat => {
      return `
        <div class="category-card" data-category-id="${cat.id}">
          <div class="category-card-icon">
            <i class="fa-solid ${cat.icon}"></i>
          </div>
          <h3>${escapeHtml(cat.title)}</h3>
          <p>${escapeHtml(cat.description)}</p>
        </div>
      `;
    }).join("");
  }

  function renderTemplateSelectDropdown() {
    templateSelect.innerHTML = Object.values(window.TEMPLATE_ENGINES).map(t => {
      return `<option value="${t.id}">${escapeHtml(t.name)}</option>`;
    }).join("");
  }

  // --- EDITOR ENGINE & LOAD CV STATE ---
  function loadEditorForCV(id) {
    activeCVId = id;
    activeCVData = window.getCV(id);
    window.setActiveCVId(id);

    cvTitleInput.value = activeCVData.cvTitle || "My Resume";
    templateSelect.value = activeCVData.template || "modern_prof";
    updateZoomDisplay();

    // Dynamically build Form sections based on category schema
    buildCategoryEditorForm();
    
    // Build Rearrange section list
    renderRearrangeSectionList();

    // Initial Preview Rendering
    updatePreview();
    
    // Switch Screen
    navigateToEditor();
  }

  function buildCategoryEditorForm() {
    const catConfig = window.CV_CATEGORIES[activeCVData.category];
    if (!catConfig) return;

    dynamicFormSections.innerHTML = "";

    catConfig.sections.forEach((sec, index) => {
      const card = document.createElement("div");
      card.className = `editor-card accordion-card ${index === 0 ? "open" : ""}`;
      card.dataset.sectionId = sec.id;
      
      const header = document.createElement("div");
      header.className = "accordion-header";
      header.innerHTML = `
        <h3><i class="fa-solid ${getSectionIcon(sec.id)} icon-color"></i> ${escapeHtml(sec.title)}</h3>
        <i class="fa-solid fa-chevron-down toggle-arrow"></i>
      `;
      header.addEventListener("click", () => {
        card.classList.toggle("open");
      });

      const body = document.createElement("div");
      body.className = "accordion-body";

      if (sec.fields === "common") {
        // Build Personal Details
        body.appendChild(buildPersonalFieldsContainer());
      } else if (sec.type === "tags") {
        // Build Tag List input (Skills, Languages)
        body.appendChild(buildTagsFieldContainer(sec.id));
      } else if (sec.type === "list") {
        // Build Repeating list editor (Experience, Projects, Education)
        body.appendChild(buildRepeatingListContainer(sec.id, sec.fields));
      }

      card.appendChild(header);
      card.appendChild(body);
      dynamicFormSections.appendChild(card);
    });
  }

  function getSectionIcon(secId) {
    const icons = {
      personal: "fa-user-tie",
      education: "fa-user-graduate",
      experience: "fa-briefcase",
      internships: "fa-laptop-code",
      projects: "fa-code",
      skills: "fa-gear",
      soft_skills: "fa-heart",
      languages: "fa-language",
      certifications: "fa-certificate",
      achievements: "fa-award",
      extracurricular: "fa-people-group",
      leadership: "fa-crown",
      volunteer: "fa-handshake-angle",
      hobbies: "fa-gamepad",
      research: "fa-microscope",
      publications: "fa-book-open",
      conferences: "fa-comments",
      grants: "fa-file-invoice-dollar",
      teaching: "fa-chalkboard-user",
      clubs: "fa-users"
    };
    return icons[secId] || "fa-circle-question";
  }

  // --- FORM FIELDS GENERATORS ---
  function buildPersonalFieldsContainer() {
    const container = document.createElement("div");
    const fields = ["fullName", "professionalTitle", "profilePhoto", "email", "phone", "location", "linkedin", "github", "portfolio", "summary"];
    
    fields.forEach(field => {
      const schema = window.FIELD_SCHEMAS[field];
      if (!schema) return;

      const group = document.createElement("div");
      group.className = "form-group";
      group.dataset.field = field;

      const labelRow = document.createElement("div");
      labelRow.className = "label-row";
      labelRow.innerHTML = `
        <label for="personal-${field}">${escapeHtml(schema.label)} ${schema.required ? `<span class="required-star">*</span>` : ""}</label>
        ${schema.limit ? `<span class="char-counter"><span class="counter-num">0</span>/${schema.limit}</span>` : ""}
      `;
      group.appendChild(labelRow);

      let input;
      if (schema.type === "textarea") {
        input = document.createElement("textarea");
        input.id = `personal-${field}`;
        input.maxLength = schema.limit || 524288;
        
        // Add AI Polish sparkle button
        const spark = document.createElement("div");
        spark.className = "ai-polish-btn-wrapper";
        spark.innerHTML = `<button class="ai-polish-btn" title="AI Polish description"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Polish</button>`;
        spark.querySelector("button").addEventListener("click", (e) => {
          e.preventDefault();
          openAiCopilotModal(input);
        });
        group.appendChild(spark);
      } else {
        input = document.createElement("input");
        input.type = schema.type;
        input.className = "text-input";
        input.id = `personal-${field}`;
      }

      input.placeholder = schema.placeholder || "";
      input.value = activeCVData.personal[field] || "";

      // Tooltip support
      if (schema.tooltip) {
        const tooltip = document.createElement("i");
        tooltip.className = "fa-regular fa-circle-question tooltip-trigger";
        tooltip.title = schema.tooltip;
        labelRow.appendChild(tooltip);
      }

      // Input validation helper
      const errorMsg = document.createElement("div");
      errorMsg.className = "validation-error-msg";
      errorMsg.innerText = getValidationErrorText(field);
      group.appendChild(input);
      group.appendChild(errorMsg);

      // Event binding
      input.addEventListener("input", (e) => {
        activeCVData.personal[field] = e.target.value;
        validateField(group, input, schema);
        updateCharCounter(labelRow, e.target.value.length);
        triggerAutosave();
      });

      // Update counters initial state
      if (schema.limit) {
        updateCharCounter(labelRow, input.value.length);
      }

      container.appendChild(group);
    });

    return container;
  }

  function buildTagsFieldContainer(secId) {
    const container = document.createElement("div");
    const schema = window.FIELD_SCHEMAS[`${secId}List`] || { label: "Tags", placeholder: "Press enter to add tags" };

    const group = document.createElement("div");
    group.className = "form-group";

    const labelRow = document.createElement("div");
    labelRow.className = "label-row";
    labelRow.innerHTML = `<label>${escapeHtml(schema.label)}</label>`;
    group.appendChild(labelRow);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "text-input";
    input.placeholder = schema.placeholder;
    group.appendChild(input);

    const tagsListWrapper = document.createElement("div");
    tagsListWrapper.className = "cv-tags-container";
    tagsListWrapper.style.marginTop = "12px";
    group.appendChild(tagsListWrapper);

    const renderTags = () => {
      tagsListWrapper.innerHTML = "";
      const currentTags = activeCVData[secId] || [];
      
      currentTags.forEach((tag, idx) => {
        const tagBadge = document.createElement("span");
        tagBadge.className = "cv-tag-item";
        tagBadge.style.display = "inline-flex";
        tagBadge.style.alignItems = "center";
        tagBadge.style.gap = "6px";
        tagBadge.innerHTML = `
          ${escapeHtml(tag)}
          <i class="fa-solid fa-circle-xmark tag-remove-btn" style="cursor:pointer; color:var(--text-muted);"></i>
        `;
        tagBadge.querySelector("i").addEventListener("click", () => {
          activeCVData[secId].splice(idx, 1);
          renderTags();
          triggerAutosave();
        });
        tagsListWrapper.appendChild(tagBadge);
      });
    };

    const addTag = (text) => {
      const clean = text.trim();
      if (!clean) return;
      if (!activeCVData[secId]) activeCVData[secId] = [];
      
      // Prevent duplicates
      if (!activeCVData[secId].includes(clean)) {
        activeCVData[secId].push(clean);
      }
      input.value = "";
      renderTags();
      triggerAutosave();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(input.value);
      }
    });

    input.addEventListener("blur", () => {
      addTag(input.value);
    });

    // Populate tags
    renderTags();
    container.appendChild(group);
    return container;
  }

  function buildRepeatingListContainer(secId, fields) {
    const container = document.createElement("div");
    container.className = "repeating-items-container";

    const itemsWrapper = document.createElement("div");
    itemsWrapper.className = "items-list-wrapper";
    container.appendChild(itemsWrapper);

    const renderItems = () => {
      itemsWrapper.innerHTML = "";
      const items = activeCVData[secId] || [];

      items.forEach((item, itemIndex) => {
        const itemCard = document.createElement("div");
        itemCard.className = "repeating-item-card";

        const itemHeader = document.createElement("div");
        itemHeader.className = "repeating-item-header";
        itemHeader.innerHTML = `
          <span class="repeating-item-title">Entry #${itemIndex + 1}</span>
          ${items.length > 1 ? `<button class="remove-item-btn"><i class="fa-solid fa-trash"></i> Remove</button>` : ""}
        `;
        
        if (items.length > 1) {
          itemHeader.querySelector(".remove-item-btn").addEventListener("click", (e) => {
            e.preventDefault();
            activeCVData[secId].splice(itemIndex, 1);
            renderItems();
            triggerAutosave();
          });
        }
        itemCard.appendChild(itemHeader);

        // Fields Grid inside repeating item card
        fields.forEach(field => {
          const schema = window.FIELD_SCHEMAS[field];
          if (!schema) return;

          const group = document.createElement("div");
          group.className = "form-group";

          const labelRow = document.createElement("div");
          labelRow.className = "label-row";
          labelRow.innerHTML = `
            <label>${escapeHtml(schema.label)} ${schema.required ? `<span class="required-star">*</span>` : ""}</label>
            ${schema.limit ? `<span class="char-counter"><span class="counter-num">0</span>/${schema.limit}</span>` : ""}
          `;
          group.appendChild(labelRow);

          let input;
          if (schema.type === "textarea") {
            input = document.createElement("textarea");
            input.maxLength = schema.limit || 524288;
            
            // Add AI Polish sparkle button
            const spark = document.createElement("div");
            spark.className = "ai-polish-btn-wrapper";
            spark.innerHTML = `<button class="ai-polish-btn" title="AI Polish description"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Polish</button>`;
            spark.querySelector("button").addEventListener("click", (e) => {
              e.preventDefault();
              openAiCopilotModal(input);
            });
            group.appendChild(spark);
          } else {
            input = document.createElement("input");
            input.type = schema.type;
            input.className = "text-input";
          }

          input.placeholder = schema.placeholder || "";
          input.value = item[field] || "";

          // Event Binding
          input.addEventListener("input", (e) => {
            activeCVData[secId][itemIndex][field] = e.target.value;
            validateField(group, input, schema);
            updateCharCounter(labelRow, e.target.value.length);
            triggerAutosave();
          });

          // Character Counter init
          if (schema.limit) {
            updateCharCounter(labelRow, input.value.length);
          }

          group.appendChild(input);
          itemCard.appendChild(group);
        });

        itemsWrapper.appendChild(itemCard);
      });
    };

    // Add Item button
    const addBtn = document.createElement("button");
    addBtn.className = "secondary-btn add-item-btn";
    addBtn.innerHTML = `<i class="fa-solid fa-circle-plus"></i> Add Item`;
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!activeCVData[secId]) activeCVData[secId] = [];
      
      // Build empty item schema
      const emptyItem = {};
      fields.forEach(f => { emptyItem[f] = ""; });
      activeCVData[secId].push(emptyItem);
      
      renderItems();
      triggerAutosave();
    });
    container.appendChild(addBtn);

    renderItems();
    return container;
  }

  function updateCharCounter(labelRow, length) {
    const counterNum = labelRow.querySelector(".counter-num");
    if (counterNum) {
      counterNum.innerText = length;
    }
  }

  // --- DYNAMIC REORDER SECTION PANEL ---
  function renderRearrangeSectionList() {
    reorderSectionsList.innerHTML = "";
    const catConfig = window.CV_CATEGORIES[activeCVData.category];
    if (!catConfig) return;

    const currentOrder = activeCVData.sectionOrder || catConfig.sections.map(s => s.id);
    const hiddenSet = new Set(activeCVData.hiddenSections || []);

    currentOrder.forEach((secId, index) => {
      const secConfig = catConfig.sections.find(s => s.id === secId);
      if (!secConfig) return;

      const isPersonal = secId === "personal";

      const li = document.createElement("li");
      li.className = "reorder-item";
      li.dataset.sectionId = secId;

      li.innerHTML = `
        <div class="reorder-item-left">
          ${isPersonal ? `<i class="fa-solid fa-lock"></i>` : `<i class="fa-solid fa-grip-vertical"></i>`}
          <span class="reorder-item-title">${escapeHtml(secConfig.title)}</span>
        </div>
        <div class="reorder-item-actions">
          ${!isPersonal ? `
            <input type="checkbox" class="section-visibility-toggle" ${!hiddenSet.has(secId) ? "checked" : ""} title="Show/Hide Section">
            <button class="reorder-arrow-btn up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
            <button class="reorder-arrow-btn down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
          ` : ""}
        </div>
      `;

      if (!isPersonal) {
        // Show/Hide bindings
        const checkbox = li.querySelector(".section-visibility-toggle");
        checkbox.addEventListener("change", (e) => {
          const hiddenSet = new Set(activeCVData.hiddenSections || []);
          if (e.target.checked) {
            hiddenSet.delete(secId);
          } else {
            hiddenSet.add(secId);
          }
          activeCVData.hiddenSections = Array.from(hiddenSet);
          
          // Toggle form field card disabled opacity
          const formCard = dynamicFormSections.querySelector(`[data-section-id="${secId}"]`);
          if (formCard) {
            formCard.style.opacity = e.target.checked ? "1" : "0.5";
          }

          updatePreview();
          triggerAutosave();
        });

        // Reordering Up/Down bindings
        const moveUpBtn = li.querySelector(".reorder-arrow-btn.up");
        const moveDownBtn = li.querySelector(".reorder-arrow-btn.down");

        moveUpBtn.addEventListener("click", (e) => {
          e.preventDefault();
          swapSectionOrder(index, index - 1);
        });

        moveDownBtn.addEventListener("click", (e) => {
          e.preventDefault();
          swapSectionOrder(index, index + 1);
        });
      }

      reorderSectionsList.appendChild(li);
    });
  }

  function swapSectionOrder(fromIdx, toIdx) {
    const list = activeCVData.sectionOrder;
    if (toIdx < 0 || toIdx >= list.length) return; // boundary guard
    if (list[fromIdx] === "personal" || list[toIdx] === "personal") return; // Keep Personal section pinned

    // Swap elements
    const temp = list[fromIdx];
    list[fromIdx] = list[toIdx];
    list[toIdx] = temp;

    // Redraw Rearrange sidebar and update preview sheet
    renderRearrangeSectionList();
    updatePreview();
    triggerAutosave();
  }

  // --- VALIDATION AND HELPER UTILITIES ---
  function getValidationErrorText(field) {
    const msgs = {
      fullName: "Full name is required.",
      professionalTitle: "Professional title is required.",
      email: "Enter a valid email address.",
      phone: "Phone number is required.",
      location: "Location (City, Country) is required.",
      summary: "Write a short summary about yourself."
    };
    return msgs[field] || "Field value is invalid.";
  }

  function validateField(group, input, schema) {
    const val = input.value.trim();
    let isValid = true;

    // Required check
    if (schema.required && val === "") {
      isValid = false;
    }

    // Advanced regex matches
    if (isValid && val !== "") {
      if (schema.valType === "email") {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      } else if (schema.valType === "url") {
        isValid = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val);
      }
    }

    if (isValid) {
      group.classList.remove("has-error");
    } else {
      group.classList.add("has-error");
    }

    return isValid;
  }

  // --- LIVE PREVIEW COMPILER ---
  function updatePreview() {
    if (!activeCVData) return;

    const activeTemplate = activeCVData.template || "modern_prof";
    const engine = window.TEMPLATE_ENGINES[activeTemplate] || window.TEMPLATE_ENGINES["modern_prof"];
    
    const hiddenSectionsSet = new Set(activeCVData.hiddenSections || []);
    
    // Add summary to hidden if toggled
    const cvHtml = engine.render(activeCVData, activeCVData.sectionOrder, hiddenSectionsSet);
    
    cvPreviewContainer.innerHTML = cvHtml;
    applyZoomScale();

    // Bind preview sections click actions (Scroll to edit accordion)
    cvPreviewContainer.querySelectorAll("[data-section-id]").forEach(element => {
      element.addEventListener("click", () => {
        const secId = element.dataset.sectionId;
        const targetAccordion = dynamicFormSections.querySelector(`[data-section-id="${secId}"]`);
        if (targetAccordion) {
          targetAccordion.scrollIntoView({ behavior: "smooth" });
          targetAccordion.classList.add("open");
          
          // Flash border effect
          targetAccordion.style.borderColor = "var(--border-focus)";
          setTimeout(() => {
            targetAccordion.style.borderColor = "var(--border-color)";
          }, 1200);
        }
      });
      element.style.cursor = "pointer";
      element.title = "Click to edit this section";
    });
  }

  function applyZoomScale() {
    const zoom = (activeCVData.zoom || 100) / 100;
    cvPreviewContainer.style.transform = `scale(${zoom})`;
    
    // Auto-adjust container height based on scaled page size to prevent clipping issues
    const baseHeight = cvPreviewContainer.scrollHeight;
    cvPreviewContainer.parentElement.style.height = `${baseHeight * zoom + 80}px`;
  }

  function updateZoomDisplay() {
    zoomPercentText.innerText = `${activeCVData.zoom || 100}%`;
  }

  // --- STORAGE & AUTOSAVE THROTTLING ---
  function triggerAutosave() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      saveActiveCVState();
    }, 800);
  }

  function saveActiveCVState() {
    if (!activeCVId || !activeCVData) return;
    window.saveCV(activeCVId, activeCVData);
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // --- EXPORTS & DOWNLOADS MANAGER ---
  async function triggerPdfDownload() {
    const firstName = activeCVData.personal?.fullName ? activeCVData.personal.fullName.split(" ")[0] : "Firstname";
    const lastName = activeCVData.personal?.fullName ? activeCVData.personal.fullName.split(" ").slice(1).join(" ") || "Lastname" : "Lastname";
    const fileName = `${firstName}_${lastName}_CV.pdf`;

    // Try to load html2pdf.js dynamically if not loaded
    if (typeof window.html2pdf === "undefined") {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
      } catch (e) {
        console.warn("Failed to load html2pdf library, falling back to print window...", e);
      }
    }

    // Try direct PDF compilation using html2pdf.js first
    if (typeof window.html2pdf !== "undefined") {
      showToast("Compiling PDF, please wait...");
      
      // Temporarily clear transforming zoom so PDF is 1:1 scale
      cvPreviewContainer.style.transform = "none";
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        await window.html2pdf().from(cvPreviewContainer).set(opt).save();
        showToast("PDF downloaded successfully!");
        applyZoomScale(); // restore zoom
      } catch (err) {
        console.error("html2pdf failed, falling back to browser print window...", err);
        applyZoomScale(); // restore
        triggerBrowserPrint();
      }
    } else {
      triggerBrowserPrint();
    }
  }

  function triggerBrowserPrint() {
    showToast("Opening system print dialog. Select 'Save as PDF' to save.");
    window.print();
  }

  async function triggerDocxDownload() {
    showToast("Generating Microsoft Word document...");
    const hiddenSet = new Set(activeCVData.hiddenSections || []);
    await window.exportToDocx(activeCVData, activeCVData.sectionOrder, hiddenSet);
    showToast("Word document download started!");
  }

  // --- AI COPILOT DIALOG FLOW ---
  function openAiCopilotModal(targetTextarea) {
    activeAiTargetInput = targetTextarea;
    aiInputText.value = targetTextarea.value;
    aiOutputText.value = "";
    aiInputCharCount.innerText = targetTextarea.value.length;
    btnAiApply.disabled = true;

    modalAiCopilot.classList.add("open");
  }

  function closeAiCopilotModal() {
    modalAiCopilot.classList.remove("open");
    activeAiTargetInput = null;
  }

  async function generateAiPolishContent() {
    const originalText = aiInputText.value.trim();
    if (!originalText) {
      showToast("Enter some text to polish first.", "danger");
      return;
    }

    const apiConfig = window.getApiKeys();
    btnAiGenerate.disabled = true;
    btnAiGenerate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Polishing...`;

    try {
      let polishedText = "";
      if (apiConfig.provider === "local") {
        // Run rule-based polisher locally
        polishedText = window.localPolish(originalText);
      } else {
        // Run AI API connectors
        polishedText = await window.callGenerativeAI(originalText, "polish", apiConfig.provider, apiConfig.key);
      }

      aiOutputText.value = polishedText;
      btnAiApply.disabled = false;
      showToast("Text polished successfully!");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to contact AI endpoint.", "danger");
    } finally {
      btnAiGenerate.disabled = false;
      btnAiGenerate.innerHTML = `<i class="fa-solid fa-microchip"></i> Generate Polish`;
    }
  }

  function applyAiPolishedContent() {
    if (activeAiTargetInput && aiOutputText.value) {
      activeAiTargetInput.value = aiOutputText.value;
      
      // Fire mock input event to update states and preview
      activeAiTargetInput.dispatchEvent(new Event("input", { bubbles: true }));
      
      closeAiCopilotModal();
    }
  }

  // --- EVENT LISTENERS REGISTRATION ---
  function setupEventListeners() {
    // Logo Click -> Return Welcome
    logoBtn.addEventListener("click", () => {
      saveActiveCVState();
      navigateToWelcome();
    });

    // Dark Mode Toggle
    themeToggle.addEventListener("click", toggleTheme);

    // AI API Config bindings
    apiSettingsBtn.addEventListener("click", () => {
      loadApiSettings();
      modalApiSettings.classList.add("open");
    });
    btnCloseApiModal.addEventListener("click", () => {
      modalApiSettings.classList.remove("open");
    });
    aiProviderSelect.addEventListener("change", (e) => {
      toggleApiKeyInputVisibility(e.target.value);
    });
    apiConfigForm.addEventListener("submit", (e) => {
      e.preventDefault();
      window.saveApiKeys(aiProviderSelect.value, apiKeyInput.value);
      modalApiSettings.classList.remove("open");
      showToast("AI Configuration saved!");
    });

    // Step navigation actions
    btnCreateNew.addEventListener("click", navigateToCategorySelect);
    
    btnViewTemplates.addEventListener("click", () => {
      modalTemplatesGallery.classList.add("open");
    });
    btnCloseTemplatesModal.addEventListener("click", () => {
      modalTemplatesGallery.classList.remove("open");
    });
    modalTemplatesGallery.querySelectorAll(".template-preview-card").forEach(card => {
      card.addEventListener("click", () => {
        const tempId = card.dataset.templateId;
        modalTemplatesGallery.classList.remove("open");
        
        // If editing a CV, switch template
        if (activeCVData) {
          templateSelect.value = tempId;
          activeCVData.template = tempId;
          updatePreview();
          triggerAutosave();
        } else {
          // If on welcome screen, guide user to create new CV first
          navigateToCategorySelect();
        }
      });
    });

    btnBackToWelcome.addEventListener("click", navigateToWelcome);
    btnBackToSelect.addEventListener("click", () => {
      saveActiveCVState();
      navigateToCategorySelect();
    });

    // Editor Actions
    cvTitleInput.addEventListener("change", (e) => {
      const clean = e.target.value.trim() || "My Resume";
      activeCVData.cvTitle = clean;
      saveActiveCVState();
    });

    btnSaveManual.addEventListener("click", () => {
      saveActiveCVState();
      showToast("Progress saved to local storage!");
    });

    btnDuplicateCV.addEventListener("click", () => {
      if (!activeCVId) return;
      const originalTitle = activeCVData.cvTitle || "My CV";
      const newTitle = prompt("Enter title for the duplicate CV:", `${originalTitle} (Copy)`);
      if (newTitle === null) return; // cancel
      
      const newId = window.duplicateCV(activeCVId, newTitle.trim() || `${originalTitle} (Copy)`);
      if (newId) {
        showToast("CV duplicated successfully!");
        loadEditorForCV(newId);
      }
    });

    btnResetForm.addEventListener("click", () => {
      if (confirm("Are you sure you want to reset this CV? This clears all fields.")) {
        const category = activeCVData.category;
        const title = activeCVData.cvTitle;
        const freshData = window.createEmptyCVData(category, title);
        
        activeCVData = freshData;
        saveActiveCVState();
        loadEditorForCV(activeCVId);
        showToast("Form fields reset to blank template.");
      }
    });

    // Welcome Screen List Delegation (Edit, Duplicate, Delete)
    document.getElementById("saved-cvs-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".saved-cv-card");
      if (!card) return;
      const id = card.dataset.cvId;
      const btn = e.target.closest("button");
      if (!btn) return;
      
      const action = btn.dataset.action;
      if (action === "edit") {
        loadEditorForCV(id);
      } else if (action === "duplicate") {
        const meta = window.getSavedCVs().find(item => item.id === id);
        const newId = window.duplicateCV(id, `${meta.title} (Copy)`);
        renderSavedCVsList();
        showToast("CV duplicated!");
      } else if (action === "delete") {
        if (confirm("Delete this CV permanent draft?")) {
          window.deleteCV(id);
          renderSavedCVsList();
          showToast("CV deleted.");
        }
      }
    });

    // Category Select Cards Click
    document.getElementById("categories-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".category-card");
      if (!card) return;
      
      const catId = card.dataset.categoryId;
      const freshData = window.createEmptyCVData(catId, `My ${window.CV_CATEGORIES[catId].title}`);
      
      // Save it and load
      window.saveCV(freshData.id, freshData);
      loadEditorForCV(freshData.id);
      showToast(`Created new ${window.CV_CATEGORIES[catId].title}!`);
    });

    // Preview Toolbar Elements
    templateSelect.addEventListener("change", (e) => {
      activeCVData.template = e.target.value;
      updatePreview();
      triggerAutosave();
    });

    zoomInBtn.addEventListener("click", () => {
      let zoom = activeCVData.zoom || 100;
      if (zoom < 150) {
        zoom += 10;
        activeCVData.zoom = zoom;
        updateZoomDisplay();
        applyZoomScale();
        triggerAutosave();
      }
    });

    zoomOutBtn.addEventListener("click", () => {
      let zoom = activeCVData.zoom || 100;
      if (zoom > 50) {
        zoom -= 10;
        activeCVData.zoom = zoom;
        updateZoomDisplay();
        applyZoomScale();
        triggerAutosave();
      }
    });

    btnDownloadPdf.addEventListener("click", triggerPdfDownload);
    btnDownloadDocx.addEventListener("click", triggerDocxDownload);

    // AI modal actions
    btnCloseAiModal.addEventListener("click", closeAiCopilotModal);
    aiInputText.addEventListener("input", (e) => {
      aiInputCharCount.innerText = e.target.value.length;
    });
    btnAiGenerate.addEventListener("click", generateAiPolishContent);
    btnAiApply.addEventListener("click", applyAiPolishedContent);
  }

  // --- TOAST NOTIFICATIONS HELPER ---
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const iconClass = type === "success" 
      ? "fa-solid fa-circle-check" 
      : "fa-solid fa-triangle-exclamation";

    toast.innerHTML = `
      <i class="${iconClass} toast-icon"></i>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.4s ease";
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Launch App
  init();
});
