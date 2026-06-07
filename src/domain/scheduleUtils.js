import { validatePlainFields } from "./formUtils.js";

const ISO_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function scheduleDurationSeconds(item) {
  const startMinutes = parseClockMinutes(item.start);
  const endMinutes = parseClockMinutes(item.end);

  if (startMinutes === null || endMinutes === null) {
    return 0;
  }

  const durationMinutes =
    endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return durationMinutes * 60;
}

export function validateScheduleBlockDraft(itemDraft, { projects = [], teamMembers = [] } = {}) {
  const locationError = validatePlainFields([itemDraft?.location]);
  if (locationError) {
    return locationError;
  }

  if (!teamMembers.some((member) => member.id === itemDraft?.memberId)) {
    return "Choose a valid person for this scheduled block.";
  }

  if (!projects.some((project) => project.id === itemDraft?.projectId)) {
    return "Choose a valid project for this scheduled block.";
  }

  if (!isValidDateKey(itemDraft?.dateKey)) {
    return "Choose a valid date for this scheduled block.";
  }

  if (parseClockMinutes(itemDraft?.start) === null) {
    return "Choose a valid start time for this scheduled block.";
  }

  if (parseClockMinutes(itemDraft?.end) === null) {
    return "Choose a valid end time for this scheduled block.";
  }

  if (scheduleDurationSeconds(itemDraft) <= 0) {
    return "Start and end times cannot be the same.";
  }

  if (!String(itemDraft?.location || "").trim()) {
    return "Add a short label or location for this scheduled block.";
  }

  return "";
}

export function parseClockMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function isValidDateKey(value) {
  if (!ISO_DATE_KEY_PATTERN.test(String(value || ""))) {
    return false;
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
