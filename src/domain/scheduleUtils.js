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
