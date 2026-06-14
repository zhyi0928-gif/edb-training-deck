(function () {
  var editMode = false;
  var editStorageKey = "edb-inline-edits:" + window.location.pathname;
  var editSaveTimer = null;
  var savedEditMap = readSavedEdits();

  var editToolbar = document.createElement("div");
  editToolbar.className = "edit-toolbar";

  var editStatus = document.createElement("div");
  editStatus.className = "edit-mode-indicator";
  editStatus.setAttribute("aria-live", "polite");
  editStatus.textContent = "编辑模式已关闭";

  var editActions = document.createElement("div");
  editActions.className = "edit-toolbar-actions";

  var editToggleButton = document.createElement("button");
  editToggleButton.type = "button";
  editToggleButton.className = "edit-toolbar-button";
  editToggleButton.textContent = "开启编辑";

  var exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "edit-toolbar-button primary";
  exportButton.textContent = "保存并导出 HTML";

  editActions.appendChild(editToggleButton);
  editActions.appendChild(exportButton);
  editToolbar.appendChild(editStatus);
  editToolbar.appendChild(editActions);
  document.body.appendChild(editToolbar);

  function readSavedEdits() {
    try {
      var raw = window.localStorage.getItem(editStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function writeSavedEdits() {
    try {
      window.localStorage.setItem(editStorageKey, JSON.stringify(savedEditMap));
      return true;
    } catch (error) {
      return false;
    }
  }

  function setEditIndicator(text, isSaved) {
    editStatus.textContent = text;
    editStatus.classList.toggle("is-saved", !!isSaved);
  }

  function isEditableTextNode(el) {
    if (!el || !el.tagName) return false;
    if (el.closest(".zoom-layer, .overview, .notes-overlay, aside.notes, .edit-toolbar")) return false;
    if (el.closest("[contenteditable='true']")) return false;
    if (el.matches("button, a, img, svg, video, audio, canvas, iframe")) return false;
    if (!el.textContent || !el.textContent.trim()) return false;
    return el.matches(
      "h1, h2, h3, h4, p, li, figcaption, code, blockquote, td, th, .kicker, .hero-subtitle, .module-lede, .question-row, .callout, .summary-line, .section-lede, .section-title, .hero-title, .module-use, .statement, .guide-panel, .auth-card, .compare-col, .pain-card, .detail-grid > div, .industry-panel-grid > div, .tag-story-card, .tag-chain, .flow-ladder div, .bridge div, .source-grid > div, .question-matrix > div, .framework-grid > div, .nav-card span, .nav-card b, .nav-card em, .hero-panel b, .hero-panel span, .module-card span, .module-card b, .module-card p, .module-card small, .table-like > div"
    );
  }

  function assignEditableKeys() {
    document.querySelectorAll(".slide").forEach(function (slide, slideIndex) {
      var count = 0;
      slide.querySelectorAll("*").forEach(function (el) {
        if (!isEditableTextNode(el)) return;
        count += 1;
        el.setAttribute("data-edit-key", "slide-" + (slideIndex + 1) + "-" + count);
      });
    });
  }

  function applySavedEdits() {
    document.querySelectorAll(".slide [data-edit-key]").forEach(function (el) {
      var key = el.getAttribute("data-edit-key");
      if (Object.prototype.hasOwnProperty.call(savedEditMap, key)) {
        el.innerHTML = savedEditMap[key];
      }
    });
  }

  function saveEditableElement(el) {
    if (!el) return;
    var key = el.getAttribute("data-edit-key");
    if (!key) return;
    savedEditMap[key] = el.innerHTML;
  }

  function persistEditsNow() {
    var ok = writeSavedEdits();
    if (editMode) {
      setEditIndicator(ok ? "编辑模式已开启，内容已自动保存" : "编辑模式已开启，本地保存失败", ok);
    } else {
      setEditIndicator(ok ? "编辑模式已关闭，修改已保留" : "编辑模式已关闭，本地保存失败", ok);
    }
  }

  function schedulePersist() {
    if (editSaveTimer) window.clearTimeout(editSaveTimer);
    setEditIndicator("编辑模式已开启，正在自动保存...", false);
    editSaveTimer = window.setTimeout(function () {
      persistEditsNow();
      editSaveTimer = null;
    }, 180);
  }

  function updateEditControls() {
    document.body.classList.toggle("edit-mode", editMode);
    editToggleButton.textContent = editMode ? "退出编辑" : "开启编辑";
  }

  function applyEditMode() {
    updateEditControls();
    document.querySelectorAll(".slide [contenteditable='true']").forEach(function (el) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
    });

    if (editMode) {
      var activeSlide = document.querySelector(".slide.is-active");
      if (activeSlide) {
        activeSlide.querySelectorAll("*").forEach(function (el) {
          if (isEditableTextNode(el)) {
            el.setAttribute("contenteditable", "true");
            el.setAttribute("spellcheck", "false");
          }
        });
      }
      setEditIndicator("编辑模式已开启，自动保存已就绪", true);
    } else {
      persistEditsNow();
    }
  }

  function toggleEditMode() {
    editMode = !editMode;
    applyEditMode();
  }

  function exportEditedHtml() {
    persistEditsNow();

    var clone = document.documentElement.cloneNode(true);
    var cloneBody = clone.querySelector("body");
    if (cloneBody) cloneBody.classList.remove("edit-mode");

    clone.querySelectorAll(".edit-toolbar").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    clone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
    });

    clone.querySelectorAll(".slide [data-edit-key]").forEach(function (el) {
      var key = el.getAttribute("data-edit-key");
      if (Object.prototype.hasOwnProperty.call(savedEditMap, key)) {
        el.innerHTML = savedEditMap[key];
      }
    });

    var htmlString = "<!DOCTYPE html>\n" + clone.outerHTML;
    var blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var baseName = (document.title || "deck").replace(/[\\/:*?\"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 80);
    var stamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = (baseName || "deck") + "-edited-" + stamp + ".html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    setEditIndicator("已导出新的 HTML 文件", true);
  }

  function gotoSlide(target) {
    var n = Number(target);
    if (!Number.isFinite(n) || n < 1) return;
    window.location.hash = "#/" + n;
  }

  editToggleButton.addEventListener("click", function () {
    toggleEditMode();
  });

  exportButton.addEventListener("click", function () {
    exportEditedHtml();
  });

  document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
      gotoSlide(button.getAttribute("data-goto"));
    });
  });

  document.querySelectorAll(".dim-card").forEach(function (card) {
    card.addEventListener("click", function () {
      document.querySelectorAll(".dim-card").forEach(function (item) {
        item.classList.remove("active");
      });
      card.classList.add("active");
    });
  });

  document.querySelectorAll(".sql-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var id = tab.getAttribute("data-case");
      document.querySelectorAll(".sql-tab").forEach(function (item) {
        item.classList.remove("active");
      });
      document.querySelectorAll(".sql-case").forEach(function (item) {
        item.classList.remove("active");
      });
      tab.classList.add("active");
      var panel = document.getElementById(id);
      if (panel) panel.classList.add("active");
    });
  });

  document.querySelectorAll(".sql-run-button").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.getElementById(button.getAttribute("data-result-target"));
      if (!target) return;
      button.disabled = true;
      button.classList.add("is-running");
      button.textContent = "运行中...";
      window.setTimeout(function () {
        target.classList.add("is-ready");
        button.disabled = false;
        button.classList.remove("is-running");
        button.classList.add("is-finished");
        button.textContent = "重新运行";
      }, 260);
    });
  });

  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.addEventListener("click", function () {
      item.classList.toggle("active");
    });
  });

  document.querySelectorAll("[data-panel-group][data-panel-target]").forEach(function (control) {
    control.addEventListener("click", function () {
      var group = control.getAttribute("data-panel-group");
      var target = control.getAttribute("data-panel-target");
      document.querySelectorAll('[data-panel-group="' + group + '"]').forEach(function (item) {
        item.classList.remove("active");
      });
      document.querySelectorAll('[data-panel-id="' + group + '"]').forEach(function (panel) {
        panel.classList.remove("active");
      });
      control.classList.add("active");
      var panel = document.querySelector('[data-panel-id="' + group + '"][data-panel-name="' + target + '"]');
      if (panel) panel.classList.add("active");
    });
  });

  var zoomLayer = document.querySelector(".zoom-layer");
  var zoomImage = zoomLayer && zoomLayer.querySelector("img");

  function closeZoom() {
    if (!zoomLayer || !zoomImage) return;
    zoomLayer.classList.remove("is-open");
    zoomLayer.setAttribute("aria-hidden", "true");
    zoomImage.removeAttribute("src");
  }

  document.querySelectorAll("[data-zoomable]").forEach(function (img) {
    img.addEventListener("click", function () {
      if (!zoomLayer || !zoomImage) return;
      zoomImage.src = img.currentSrc || img.src;
      zoomImage.alt = img.alt || "source image";
      zoomLayer.classList.add("is-open");
      zoomLayer.setAttribute("aria-hidden", "false");
    });
  });

  if (zoomLayer) {
    zoomLayer.addEventListener("click", closeZoom);
    zoomLayer.querySelector("button").addEventListener("click", closeZoom);
  }

  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || !target.isContentEditable) return;
    saveEditableElement(target);
    schedulePersist();
  });

  document.addEventListener("blur", function (event) {
    var target = event.target;
    if (!target || !target.isContentEditable) return;
    saveEditableElement(target);
    persistEditsNow();
  }, true);

  document.addEventListener("keydown", function (event) {
    var target = event.target;
    var isEditing = target && target.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && (event.key === "s" || event.key === "S")) {
      event.preventDefault();
      if (isEditing) saveEditableElement(target);
      exportEditedHtml();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === "s" || event.key === "S")) {
      event.preventDefault();
      if (isEditing) saveEditableElement(target);
      persistEditsNow();
      return;
    }

    if (!event.metaKey && !event.ctrlKey && !event.altKey && (event.key === "e" || event.key === "E")) {
      event.preventDefault();
      toggleEditMode();
      return;
    }

    if (event.key === "Escape" && zoomLayer && zoomLayer.classList.contains("is-open")) {
      closeZoom();
      return;
    }

    if (event.key === "Escape" && isEditing) {
      event.preventDefault();
      target.blur();
    }
  });

  window.addEventListener("hashchange", function () {
    if (editMode) applyEditMode();
  });

  assignEditableKeys();
  applySavedEdits();
  updateEditControls();
  setEditIndicator(Object.keys(savedEditMap).length ? "已恢复上次保存的修改" : "编辑模式已关闭", Object.keys(savedEditMap).length > 0);
})();
