(function () {
  function applyLayoutMode() {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const isNarrow = window.matchMedia("(max-width: 500px)").matches;
    const useDevice = isStandalone || isNarrow;
    document.body.classList.toggle("is-device", useDevice);
    document.body.classList.toggle("is-preview", !useDevice);
  }

  applyLayoutMode();
  window.addEventListener("resize", applyLayoutMode);

  const $ = (sel) => document.querySelector(sel);

  const form = $("#entryForm");
  const editingId = $("#editingId");
  const editBanner = $("#editBanner");
  const entryDate = $("#entryDate");
  const entryCustomer = $("#entryCustomer");
  const entryPickUp = $("#entryPickUp");
  const entryDropOff = $("#entryDropOff");
  const entryNote = $("#entryNote");
  const oneMore = $("#oneMore");
  const btnSubmit = $("#btnSubmit");
  const btnCancelEdit = $("#btnCancelEdit");
  const btnToday = $("#btnToday");
  const templateChips = $("#templateChips");
  const templateEmpty = $("#templateEmpty");
  const listCustomers = $("#listCustomers");
  const listPickUps = $("#listPickUps");
  const listDropOffs = $("#listDropOffs");
  const entryList = $("#entryList");
  const listEmpty = $("#listEmpty");
  const listSearch = $("#listSearch");
  const listWeekNav = $("#listWeekNav");
  const listWeekLabel = $("#listWeekLabel");
  const exportPreview = $("#exportPreview");
  const weekRange = $("#weekRange");
  const weekJobCount = $("#weekJobCount");
  const weekNote = $("#weekNote");
  const expenseList = $("#expenseList");
  const expenseEmpty = $("#expenseEmpty");
  const expenseTotal = $("#expenseTotal");
  const expenseForm = $("#expenseForm");
  const expenseDate = $("#expenseDate");
  const expenseLabel = $("#expenseLabel");
  const expenseAmount = $("#expenseAmount");
  const themeToggle = $("#themeToggle");
  const metaTheme = $("#metaTheme");
  const toast = $("#toast");

  let listFilter = "today";
  let viewWeekStart = startOfWeek(new Date());

  function isEditing() {
    return !!editingId.value;
  }

  function fillDatalists() {
    const r = loadRecent();
    listCustomers.innerHTML = r.customers.map((v) => "<option value=\"" + escapeAttr(v) + "\">").join("");
    listPickUps.innerHTML = r.pickUps.map((v) => "<option value=\"" + escapeAttr(v) + "\">").join("");
    listDropOffs.innerHTML = r.dropOffs.map((v) => "<option value=\"" + escapeAttr(v) + "\">").join("");
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function renderTemplates() {
    const templates = loadRouteTemplates();
    templateChips.innerHTML = "";
    templateEmpty.hidden = templates.length > 0;

    templates.forEach((t) => {
      const wrap = document.createElement("div");
      wrap.className = "template-chip-wrap";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-chip";
      btn.title = t.pickUp + " → " + t.dropOff;
      btn.textContent = t.name;
      btn.addEventListener("click", () => applyTemplate(t));
      const del = document.createElement("button");
      del.type = "button";
      del.className = "template-chip-del";
      del.textContent = "×";
      del.title = "Şablonu sil";
      del.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (confirm("Bu şablon silinsin mi?")) {
          deleteRouteTemplate(t.id);
          renderTemplates();
        }
      });
      wrap.appendChild(btn);
      wrap.appendChild(del);
      templateChips.appendChild(wrap);
    });
  }

  function applyTemplate(t) {
    entryPickUp.value = t.pickUp;
    entryDropOff.value = t.dropOff;
    entryPickUp.focus();
  }

  function startEdit(entry) {
    editingId.value = entry.id;
    editBanner.hidden = false;
    btnCancelEdit.hidden = false;
    btnSubmit.textContent = "Güncelle";
    oneMore.closest(".check-row").hidden = true;
    entryDate.value = entryDateKey(entry);
    entryCustomer.value = entry.customerName;
    entryPickUp.value = entry.pickUp;
    entryDropOff.value = entry.dropOff;
    entryNote.value = entry.note || "";
    switchTab("add");
  }

  function cancelEdit() {
    editingId.value = "";
    editBanner.hidden = true;
    btnCancelEdit.hidden = true;
    btnSubmit.textContent = "Kaydet";
    oneMore.closest(".check-row").hidden = false;
    clearEntryFields(false);
  }

  function clearEntryFields(keepDate) {
    const d = entryDate.value;
    entryCustomer.value = "";
    entryPickUp.value = "";
    entryDropOff.value = "";
    entryNote.value = "";
    if (!keepDate) entryDate.value = todayDateKey();
    else entryDate.value = d;
  }

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("theme-light", isLight);
    themeToggle.textContent = isLight ? "🌙" : "☀️";
    metaTheme.setAttribute("content", isLight ? "#f4f6f8" : "#0f1419");
    saveSettings({ theme: isLight ? "light" : "dark" });
  }

  function currentWeekKey() {
    return weekKey(viewWeekStart);
  }

  function weekLabelText() {
    return formatShortDate(viewWeekStart) + " – " + formatShortDate(endOfWeek(viewWeekStart));
  }

  function shiftWeek(delta) {
    viewWeekStart = startOfWeek(addDays(viewWeekStart, delta * 7));
    refreshWeekUI();
    renderList();
  }

  function goToCurrentWeek() {
    viewWeekStart = startOfWeek(new Date());
    refreshWeekUI();
    renderList();
  }

  function setListFilter(mode) {
    listFilter = mode;
    document.querySelectorAll(".chip[data-filter]").forEach((c) => {
      c.classList.toggle("active", c.dataset.filter === mode);
    });
    listWeekNav.hidden = mode !== "week";
    if (mode === "week" && listWeekLabel) listWeekLabel.textContent = weekLabelText();
    renderList();
  }

  function shiftWeekFromList(delta) {
    setListFilter("week");
    shiftWeek(delta);
  }

  function goToCurrentWeekFromList() {
    setListFilter("week");
    goToCurrentWeek();
  }

  function refreshWeekUI() {
    const label = weekLabelText();
    weekRange.textContent = label;
    if (listWeekLabel) listWeekLabel.textContent = label;

    const entries = getEntriesForWeek(viewWeekStart);
    weekJobCount.textContent = "Bu hafta: " + entries.length + " iş";

    const wk = currentWeekKey();
    const data = getWeekData(wk);
    weekNote.value = data.note || "";
    renderExpenses();
    exportPreview.value = buildWeekExportText();
    syncExpenseDateBounds();
  }

  function syncExpenseDateBounds() {
    const start = toDateInputValue(viewWeekStart);
    const end = toDateInputValue(endOfWeek(viewWeekStart));
    expenseDate.min = start;
    expenseDate.max = end;
    if (!expenseDate.value || expenseDate.value < start || expenseDate.value > end) {
      const today = todayDateKey();
      expenseDate.value = today >= start && today <= end ? today : start;
    }
  }

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.toggle("error", !!isError);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  function switchTab(name) {
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach((p) => {
      const on = p.id === "panel-" + name;
      p.classList.toggle("active", on);
      p.hidden = !on;
    });
    if (name === "list") renderList();
    if (name === "week") refreshWeekUI();
    if (name === "add") fillDatalists();
  }

  function matchesSearch(e, q) {
    if (!q) return true;
    const hay = [e.customerName, e.pickUp, e.dropOff, e.note].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function filterEntries(entries, mode) {
    const today = todayDateKey();
    const q = (listSearch.value || "").trim().toLowerCase();
    return entries.filter((e) => {
      const dk = entryDateKey(e);
      if (mode === "today" && dk !== today) return false;
      if (mode === "week" && !isInWeek(dk, viewWeekStart)) return false;
      return matchesSearch(e, q);
    });
  }

  function renderList() {
    const all = loadEntries();
    const filtered = filterEntries(all, listFilter).sort((a, b) => {
      const cmp = entryDateKey(b).localeCompare(entryDateKey(a));
      return cmp !== 0 ? cmp : a.customerName.localeCompare(b.customerName);
    });

    listWeekNav.hidden = listFilter !== "week";
    entryList.innerHTML = "";

    if (filtered.length === 0) {
      listEmpty.hidden = false;
      const q = listSearch.value.trim();
      if (q) listEmpty.textContent = "Aramaya uygun kayıt yok.";
      else if (listFilter === "week") listEmpty.textContent = "Bu haftada kayıt yok.";
      else listEmpty.textContent = "Kayıt yok.";
      return;
    }
    listEmpty.hidden = true;

    const grouped = groupEntriesByDate(filtered).sort((a, b) => b[0].localeCompare(a[0]));

    grouped.forEach(([dateKey, dayEntries]) => {
      const groupLi = document.createElement("li");
      groupLi.className = "list-day-group";

      const heading = document.createElement("h3");
      heading.className = "list-day-heading";
      const countLabel = dayEntries.length > 1 ? " · " + dayEntries.length + " iş" : "";
      heading.textContent = formatDayHeading(dateKey) + countLabel;

      const jobsUl = document.createElement("ul");
      jobsUl.className = "list-day-jobs";

      dayEntries.forEach((e) => {
        const li = document.createElement("li");
        li.className = "entry-item-compact";
        li.innerHTML =
          '<div class="compact-main">' +
          '<span class="compact-customer">' + escapeHtml(e.customerName) + "</span>" +
          '<span class="compact-route">' + escapeHtml(e.pickUp) + " → " + escapeHtml(e.dropOff) + "</span>" +
          (e.note ? '<span class="compact-note">' + escapeHtml(e.note) + "</span>" : "") +
          "</div>" +
          '<div class="compact-actions">' +
          '<button type="button" class="btn-link btn-edit" data-id="' + e.id + '">Düzenle</button>' +
          '<button type="button" class="btn-link btn-delete" data-id="' + e.id + '">Sil</button>' +
          "</div>";
        jobsUl.appendChild(li);
      });

      groupLi.appendChild(heading);
      groupLi.appendChild(jobsUl);
      entryList.appendChild(groupLi);
    });

    entryList.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entry = getEntryById(btn.dataset.id);
        if (entry) startEdit(entry);
      });
    });

    entryList.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Bu kaydı silmek istiyor musunuz?")) {
          deleteEntry(btn.dataset.id);
          renderList();
          refreshWeekUI();
        }
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function groupEntriesByDate(entries) {
    const map = new Map();
    entries.forEach((e) => {
      const dk = entryDateKey(e);
      if (!map.has(dk)) map.set(dk, []);
      map.get(dk).push(e);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  function formatJobLine(e) {
    let line = "• " + e.customerName + " - " + e.pickUp + " TO " + e.dropOff;
    if (e.note) line += "\n  Not: " + e.note;
    return line;
  }

  function buildWeekExportText() {
    const weekStart = viewWeekStart;
    const weekEnd = endOfWeek(viewWeekStart);
    const data = getWeekData(currentWeekKey());
    const entries = getEntriesForWeek(viewWeekStart).sort((a, b) =>
      entryDateKey(a).localeCompare(entryDateKey(b))
    );

    const lines = [
      "Haftalık iş özeti",
      formatShortDate(weekStart) + " – " + formatShortDate(weekEnd),
      "",
    ];

    if (data.note && data.note.trim()) {
      lines.push("Haftalık notum:");
      lines.push(data.note.trim());
      lines.push("");
    }

    if (entries.length === 0) {
      lines.push("(Bu hafta iş kaydı yok)");
    } else {
      groupEntriesByDate(entries).forEach(([dateKey, dayEntries]) => {
        const countLabel = dayEntries.length > 1 ? " (" + dayEntries.length + " iş)" : "";
        lines.push(formatDayHeading(dateKey) + countLabel);
        dayEntries.forEach((e) => lines.push(formatJobLine(e)));
        lines.push("");
      });
      lines.push("Toplam: " + entries.length + " iş");
    }

    const expenses = (data.expenses || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (expenses.length > 0) {
      const sum = sumExpenses(expenses);
      lines.push("");
      lines.push("Giderler:");
      expenses.forEach((ex) => {
        let line = "• " + formatDisplayDate(ex.date) + " — " + ex.label;
        if (ex.amount) line += " (" + ex.amount + ")";
        lines.push(line);
      });
      if (sum.hasAmount) lines.push("Gider toplamı: $" + sum.total.toFixed(2));
    }

    return lines.join("\n").trim() + "\n";
  }

  function renderExpenses() {
    const data = getWeekData(currentWeekKey());
    const expenses = (data.expenses || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const sum = sumExpenses(expenses);

    expenseList.innerHTML = "";
    expenseTotal.textContent = sum.hasAmount ? "· Toplam: $" + sum.total.toFixed(2) : "";

    if (expenses.length === 0) {
      expenseEmpty.hidden = false;
      return;
    }
    expenseEmpty.hidden = true;

    expenses.forEach((ex) => {
      const li = document.createElement("li");
      li.className = "expense-item";
      let text = formatDisplayDate(ex.date) + " · " + ex.label;
      if (ex.amount) text += " · " + ex.amount;
      li.innerHTML =
        '<span class="expense-text">' + escapeHtml(text) +
        '</span><button type="button" class="btn-delete" data-id="' + ex.id + '">Sil</button>';
      expenseList.appendChild(li);
    });

    expenseList.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteWeekExpense(currentWeekKey(), btn.dataset.id);
        refreshWeekUI();
      });
    });
  }

  function setDefaultDate() {
    entryDate.value = todayDateKey();
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const payload = {
      date: entryDate.value,
      customerName: entryCustomer.value,
      pickUp: entryPickUp.value,
      dropOff: entryDropOff.value,
      note: entryNote.value,
    };

    if (isEditing()) {
      updateEntry(editingId.value, payload);
      showToast("Güncellendi");
      cancelEdit();
    } else {
      addEntry(createEntry(payload));
      showToast("Kaydedildi");
      const keep = oneMore.checked;
      clearEntryFields(keep);
      if (!keep) setDefaultDate();
      entryCustomer.focus();
    }

    fillDatalists();
    refreshWeekUI();
    form.classList.add("form-success");
    setTimeout(() => form.classList.remove("form-success"), 400);
  });

  btnToday.addEventListener("click", () => {
    entryDate.value = todayDateKey();
  });

  btnCancelEdit.addEventListener("click", cancelEdit);

  $("#btnSaveTemplate").addEventListener("click", () => {
    if (!entryPickUp.value.trim() || !entryDropOff.value.trim()) {
      showToast("Önce Pick Up ve Drop Off girin", true);
      return;
    }
    const name = prompt(
      "Kısa isim (ör. E.Patchogue → JFK):\nSadece adresler kaydedilir, müşteri adı kaydedilmez.",
      entryPickUp.value + " → " + entryDropOff.value
    );
    if (name === null) return;
    addRouteTemplate({
      name: name || "",
      pickUp: entryPickUp.value,
      dropOff: entryDropOff.value,
    });
    renderTemplates();
    showToast("Adres şablonu kaydedildi");
  });

  listSearch.addEventListener("input", () => renderList());

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.querySelectorAll(".chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => setListFilter(chip.dataset.filter));
  });

  $("#weekPrev").addEventListener("click", () => shiftWeek(-1));
  $("#weekNext").addEventListener("click", () => shiftWeek(1));
  $("#weekToday").addEventListener("click", goToCurrentWeek);
  $("#listWeekPrev").addEventListener("click", () => shiftWeekFromList(-1));
  $("#listWeekNext").addEventListener("click", () => shiftWeekFromList(1));
  $("#listWeekToday").addEventListener("click", goToCurrentWeekFromList);

  let noteSaveTimer;
  weekNote.addEventListener("input", () => {
    clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(() => {
      setWeekNote(currentWeekKey(), weekNote.value);
      exportPreview.value = buildWeekExportText();
    }, 400);
  });

  expenseForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const dk = expenseDate.value;
    if (!isInWeek(dk, viewWeekStart)) {
      showToast("Tarih seçili hafta içinde olmalı", true);
      return;
    }
    addWeekExpense(currentWeekKey(), {
      date: dk,
      label: expenseLabel.value,
      amount: expenseAmount.value,
    });
    expenseAmount.value = "";
    expenseLabel.value = "Yakıt";
    showToast("Gider eklendi");
    refreshWeekUI();
  });

  $("#btnCopy").addEventListener("click", async () => {
    exportPreview.value = buildWeekExportText();
    try {
      await navigator.clipboard.writeText(exportPreview.value);
      showToast("Panoya kopyalandı");
    } catch {
      exportPreview.select();
      document.execCommand("copy");
      showToast("Panoya kopyalandı");
    }
  });

  $("#btnShare").addEventListener("click", async () => {
    exportPreview.value = buildWeekExportText();
    const text = exportPreview.value;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Haftalık iş özeti", text });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Metin kopyalandı");
    } catch {
      showToast("Metni manuel kopyalayın", true);
    }
  });

  $("#btnExportBackup").addEventListener("click", () => {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "is-gunlugu-yedek-" + todayDateKey() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Yedek indirildi");
  });

  $("#backupFile").addEventListener("change", (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm("Mevcut verilerin üzerine yazılacak. Devam?")) {
          ev.target.value = "";
          return;
        }
        importBackup(data);
        fillDatalists();
        renderTemplates();
        applyTheme(loadSettings().theme || "dark");
        refreshWeekUI();
        renderList();
        showToast("Yedek yüklendi");
      } catch {
        showToast("Geçersiz yedek dosyası", true);
      }
      ev.target.value = "";
    };
    reader.readAsText(file);
  });

  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-light") ? "dark" : "light";
    applyTheme(next);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  function bootstrapRecents() {
    const r = loadRecent();
    if (r.customers.length > 0) return;
    loadEntries().slice(0, 50).forEach((e) => {
      trackRecent(e.customerName, e.pickUp, e.dropOff);
    });
  }

  applyTheme(loadSettings().theme || "dark");
  bootstrapRecents();
  setDefaultDate();
  fillDatalists();
  renderTemplates();
  setListFilter("today");
  refreshWeekUI();
})();
