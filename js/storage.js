const STORAGE_KEY = "isGunlugu_entries_v1";
const WEEK_DATA_KEY = "isGunlugu_weekData_v1";
const RECENT_KEY = "isGunlugu_recent_v1";
const TEMPLATES_KEY = "isGunlugu_templates_v1";
const SETTINGS_KEY = "isGunlugu_settings_v1";
const RECENT_MAX = 20;

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  trackRecent(entry.customerName, entry.pickUp, entry.dropOff);
  return entry;
}

function updateEntry(id, data) {
  const entries = loadEntries();
  const i = entries.findIndex((e) => e.id === id);
  if (i === -1) return null;
  const updated = {
    ...entries[i],
    date: data.date.trim(),
    customerName: data.customerName.trim(),
    pickUp: data.pickUp.trim(),
    dropOff: data.dropOff.trim(),
    note: (data.note || "").trim(),
  };
  entries[i] = updated;
  saveEntries(entries);
  trackRecent(updated.customerName, updated.pickUp, updated.dropOff);
  return updated;
}

function deleteEntry(id) {
  const entries = loadEntries().filter((e) => e.id !== id);
  saveEntries(entries);
}

function getEntryById(id) {
  return loadEntries().find((e) => e.id === id);
}

function createEntry({ date, customerName, pickUp, dropOff, note }) {
  return {
    id: crypto.randomUUID(),
    date: date.trim(),
    customerName: customerName.trim(),
    pickUp: pickUp.trim(),
    dropOff: dropOff.trim(),
    note: (note || "").trim(),
  };
}

function normalizeEntry(e) {
  if (!e || typeof e !== "object") return e;
  const date = e.date || toDateKey(new Date(e.at));
  return {
    id: e.id,
    date,
    customerName: e.customerName || e.type || "—",
    pickUp: e.pickUp || "—",
    dropOff: e.dropOff || "—",
    note: e.note || "",
  };
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const d = raw ? JSON.parse(raw) : {};
    return {
      customers: Array.isArray(d.customers) ? d.customers : [],
      pickUps: Array.isArray(d.pickUps) ? d.pickUps : [],
      dropOffs: Array.isArray(d.dropOffs) ? d.dropOffs : [],
    };
  } catch {
    return { customers: [], pickUps: [], dropOffs: [] };
  }
}

function saveRecent(data) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(data));
}

function bumpList(list, value) {
  const v = (value || "").trim();
  if (!v) return list;
  return [v, ...list.filter((x) => x !== v)].slice(0, RECENT_MAX);
}

function trackRecent(customer, pickUp, dropOff) {
  const r = loadRecent();
  saveRecent({
    customers: bumpList(r.customers, customer),
    pickUps: bumpList(r.pickUps, pickUp),
    dropOffs: bumpList(r.dropOffs, dropOff),
  });
}

function loadRouteTemplates() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRouteTemplates(list) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list));
}

function addRouteTemplate({ name, pickUp, dropOff }) {
  const list = loadRouteTemplates();
  const t = {
    id: crypto.randomUUID(),
    name: (name || pickUp + " → " + dropOff).trim(),
    pickUp: pickUp.trim(),
    dropOff: dropOff.trim(),
  };
  list.unshift(t);
  saveRouteTemplates(list.slice(0, 30));
  return t;
}

function deleteRouteTemplate(id) {
  saveRouteTemplates(loadRouteTemplates().filter((t) => t.id !== id));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { theme: "dark" };
  } catch {
    return { theme: "dark" };
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function exportBackup() {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    entries: loadEntries(),
    weekData: loadAllWeekData(),
    recent: loadRecent(),
    templates: loadRouteTemplates(),
    settings: loadSettings(),
  };
}

function importBackup(data) {
  if (!data || typeof data !== "object") throw new Error("Geçersiz dosya");
  if (!Array.isArray(data.entries)) throw new Error("Kayıt listesi bulunamadı");
  saveEntries(data.entries.map(normalizeEntry));
  if (data.weekData && typeof data.weekData === "object") {
    saveAllWeekData(data.weekData);
  }
  if (data.recent) saveRecent(data.recent);
  if (Array.isArray(data.templates)) saveRouteTemplates(data.templates);
  if (data.settings) saveSettings(data.settings);
}

function loadAllWeekData() {
  try {
    const raw = localStorage.getItem(WEEK_DATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllWeekData(data) {
  localStorage.setItem(WEEK_DATA_KEY, JSON.stringify(data));
}

function getWeekData(weekKeyStr) {
  const all = loadAllWeekData();
  return all[weekKeyStr] || { note: "", expenses: [] };
}

function setWeekData(weekKeyStr, data) {
  const all = loadAllWeekData();
  all[weekKeyStr] = data;
  saveAllWeekData(all);
}

function setWeekNote(weekKeyStr, note) {
  const data = getWeekData(weekKeyStr);
  data.note = note;
  setWeekData(weekKeyStr, data);
}

function addWeekExpense(weekKeyStr, expense) {
  const data = getWeekData(weekKeyStr);
  data.expenses = data.expenses || [];
  data.expenses.push({
    id: crypto.randomUUID(),
    date: expense.date,
    label: expense.label.trim(),
    amount: (expense.amount || "").trim(),
  });
  setWeekData(weekKeyStr, data);
  return data;
}

function deleteWeekExpense(weekKeyStr, expenseId) {
  const data = getWeekData(weekKeyStr);
  data.expenses = (data.expenses || []).filter((x) => x.id !== expenseId);
  setWeekData(weekKeyStr, data);
}

function getEntriesForWeek(weekStartDate) {
  return loadEntries().filter((e) => isInWeek(entryDateKey(e), weekStartDate));
}

function parseAmount(str) {
  if (!str || !str.trim()) return null;
  const n = parseFloat(String(str).replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function sumExpenses(expenses) {
  let total = 0;
  let hasAmount = false;
  (expenses || []).forEach((ex) => {
    const a = parseAmount(ex.amount);
    if (a !== null) {
      total += a;
      hasAmount = true;
    }
  });
  return { total, hasAmount };
}
