import { formatDuration } from "../timeUtils.js";

export function formatDurationLabel(totalSeconds) {
  const [hoursValue, minutesValue] = formatDuration(totalSeconds).split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (hours && minutes) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

export function sessionDuration(session) {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }
  return Math.floor((end - start) / 1000);
}

export function currency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function percent(value, total) {
  if (!total) {
    return 0;
  }
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
}

export function calculateMarginPercent(budgetValue, actualCost) {
  if (!budgetValue) {
    return null;
  }

  return Math.round(((Number(budgetValue) - Number(actualCost || 0)) / Number(budgetValue)) * 100);
}

export function formatMargin(value) {
  return value === null ? "N/A" : `${value}%`;
}
