function describeCalendarDay(date, today) {
  const dateKey = getLocalDateKey(date);
  return {
    date,
    dateKey,
    shortName: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
    displayDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
    isToday: dateKey === getLocalDateKey(today)
  };
}

export function getCurrentWeekDays(today = new Date()) {
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    return describeCalendarDay(date, today);
  });
}

export function getRollingWeekDays(today = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    return describeCalendarDay(date, today);
  });
}

export function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMinutes(date, minutes) {
  const nextDate = new Date(date);
  nextDate.setMinutes(nextDate.getMinutes() + minutes);
  return nextDate;
}

export function getDayLabel(dateKey) {
  const today = new Date();
  const yesterday = addDays(today, -1);
  if (dateKey === getLocalDateKey(today)) {
    return "Today";
  }
  if (dateKey === getLocalDateKey(yesterday)) {
    return "Yesterday";
  }
  return formatReadableDate(dateKey);
}

export function sortDayLabels(a, b) {
  if (a === "Today") return -1;
  if (b === "Today") return 1;
  if (a === "Yesterday") return -1;
  if (b === "Yesterday") return 1;
  return a.localeCompare(b);
}

export function formatReadableDate(dateKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(dateFromKey(dateKey));
}

export function formatClockTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
