function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateKey(d) {
  const x = new Date(d);
  return x.getFullYear() + "-" + pad(x.getMonth() + 1) + "-" + pad(x.getDate());
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeek(d) {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

function weekKey(d) {
  return toDateKey(startOfWeek(d));
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatDisplayDate(keyOrIso) {
  const d =
    typeof keyOrIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(keyOrIso)
      ? parseDateKey(keyOrIso)
      : startOfDay(new Date(keyOrIso));
  return d.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayHeading(key) {
  const d = parseDateKey(key);
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(d) {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function todayDateKey() {
  return toDateKey(new Date());
}

function toDateInputValue(d) {
  return toDateKey(startOfDay(d));
}

function entryDateKey(e) {
  if (e.date) return e.date;
  return toDateKey(new Date(e.at));
}

function isInWeek(dateKey, weekStartDate) {
  const t = parseDateKey(dateKey).getTime();
  const start = startOfWeek(weekStartDate).getTime();
  const end = endOfWeek(weekStartDate).getTime();
  return t >= start && t <= end;
}
