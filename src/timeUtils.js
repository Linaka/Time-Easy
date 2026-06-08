export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function formatTimer(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function sumDurations(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.durationSeconds || 0), 0);
}

export function sumBillableDurations(entries) {
  return entries.reduce(
    (sum, entry) => sum + (entry.billable ? Number(entry.durationSeconds || 0) : 0),
    0
  );
}

export function groupEntriesByDay(entries) {
  return entries.reduce((groups, entry) => {
    const day = entry.day || "Unscheduled";
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(entry);
    return groups;
  }, {});
}

export function isSafeDisplayText(value) {
  if (typeof value !== "string") {
    return true;
  }

  return !/<\s*script[\s>]/i.test(value);
}

export function parseDurationInput(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return 0;
  }

  if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return Math.round(Number(trimmedValue) * 60);
  }

  const durationMatch = trimmedValue.match(/^(\d{1,3}):([0-5]\d)$/);
  if (!durationMatch) {
    return 0;
  }

  const [, hours, minutes] = durationMatch;
  return Number(hours) * 3600 + Number(minutes) * 60;
}

export function groupDurationsByProject(entries) {
  return entries.reduce((groups, entry) => {
    const projectId = entry.projectId || "unknown";
    groups[projectId] = (groups[projectId] || 0) + Number(entry.durationSeconds || 0);
    return groups;
  }, {});
}

export function escapeCsvCell(value) {
  const rawValue = String(value ?? "");
  const protectedValue = /^[\s\u0000-\u001f]*[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;
  const escapedValue = protectedValue.replaceAll('"', '""');

  if (/[",\n\r]/.test(escapedValue)) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
}

export function parseCsvRecords(csvText) {
  const rows = parseCsvRows(csvText).filter((row) =>
    row.some((cell) => String(cell || "").trim())
  );

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => normalizeCsvHeader(header));
  return rows.slice(1).map((row) =>
    headers.reduce((record, header, index) => {
      if (header) {
        record[header] = row[index] ?? "";
      }
      return record;
    }, {})
  );
}

export function parseCsvRows(csvText) {
  const text = String(csvText || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeCsvHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
