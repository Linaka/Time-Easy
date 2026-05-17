const ISO_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function buildGanttTimeline(timelineMode, startDateKey, todayKey = getLocalDateKey(new Date())) {
  const safeStartKey = ISO_DATE_KEY_PATTERN.test(String(startDateKey || ""))
    ? startDateKey
    : todayKey;
  const startDate = dateFromKey(safeStartKey);

  if (timelineMode === "Year") {
    const firstMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const slots = Array.from({ length: 12 }, (_, index) => {
      const monthStart = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const startKey = getLocalDateKey(monthStart);
      const endKey = getLocalDateKey(monthEnd);
      const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthStart);
      const subLabel = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(monthStart);

      return {
        key: `month-${startKey}`,
        startKey,
        endKey,
        dropDateKey: startKey,
        label,
        subLabel,
        selectLabel: `${label} ${subLabel}`,
        accessibleLabel: `${label} ${subLabel}`,
        isToday: isDateKeyInRange(todayKey, startKey, endKey),
        isWeekend: false
      };
    });

    return {
      slots,
      startKey: slots[0].startKey,
      endKey: slots[slots.length - 1].endKey,
      slotMinWidth: 150,
      rangeLabel: `${formatPlanningDate(slots[0].startKey)} - ${formatPlanningDate(slots[slots.length - 1].endKey)}`
    };
  }

  const dayCount = timelineMode === "Week" ? 7 : 31;
  const slots = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(startDate, index);
    const dateKey = getLocalDateKey(date);
    const label = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    const subLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);

    return {
      key: `day-${dateKey}`,
      startKey: dateKey,
      endKey: dateKey,
      dropDateKey: dateKey,
      label,
      subLabel,
      selectLabel: `${label} ${subLabel}`,
      accessibleLabel: formatReadableDate(dateKey),
      isToday: dateKey === todayKey,
      isWeekend: [0, 6].includes(date.getDay())
    };
  });

  return {
    slots,
    startKey: slots[0].startKey,
    endKey: slots[slots.length - 1].endKey,
    slotMinWidth: timelineMode === "Week" ? 132 : 124,
    rangeLabel: `${formatPlanningDate(slots[0].startKey)} - ${formatPlanningDate(slots[slots.length - 1].endKey)}`
  };
}

export function isDateKeyInRange(dateKey, startKey, endKey) {
  return dateKey >= startKey && dateKey <= endKey;
}

export function getScheduleEndDateKey(item) {
  const startKey = item?.dateKey;
  const endKey = item?.endDateKey;

  if (!ISO_DATE_KEY_PATTERN.test(String(startKey || ""))) {
    return "";
  }

  if (!ISO_DATE_KEY_PATTERN.test(String(endKey || "")) || endKey < startKey) {
    return startKey;
  }

  return endKey;
}

export function scheduleSpansMultipleDays(item) {
  return Boolean(item?.dateKey) && getScheduleEndDateKey(item) !== item.dateKey;
}

export function scheduleItemIntersectsSlot(item, slot) {
  const startKey = item?.dateKey;
  const endKey = getScheduleEndDateKey(item);

  if (!startKey || !endKey || !slot?.startKey || !slot?.endKey) {
    return false;
  }

  return startKey <= slot.endKey && endKey >= slot.startKey;
}

export function slotContainsDateKey(slot, dateKey) {
  return isDateKeyInRange(dateKey, slot.startKey, slot.endKey);
}

export function getTimelineSlotKeyForDate(slots, dateKey) {
  return slots.find((slot) => slotContainsDateKey(slot, dateKey))?.key || "";
}

function formatReadableDate(dateKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(dateFromKey(dateKey));
}

function formatPlanningDate(dateKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(dateFromKey(dateKey));
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
