import {
  formatDuration,
  isSafeDisplayText,
  parseCsvRecords,
  parseDurationInput
} from "../timeUtils.js";
import { getLocalDateKey } from "./dateUtils.js";
import { parseTags } from "./formUtils.js";

export function buildTimesheetImportPreview({ csvText, projects, teamMembers }) {
  return parseCsvRecords(csvText).map((record, index) => {
    const errors = [];
    const rawDate = csvValue(record, ["date", "work_date", "entry_date", "day"]);
    const rawDescription = csvValue(record, ["task", "description", "work", "activity"]);
    const rawProject = csvValue(record, ["project", "project_name", "project_id"]);
    const rawMember = csvValue(record, ["member", "person", "employee", "user", "email"]);
    const rawDuration = csvValue(record, ["duration", "time", "hours", "minutes"]);
    const rawBillable = csvValue(record, ["billable", "billing", "is_billable"]);
    const rawTags = csvValue(record, ["tags", "tag", "labels"]);
    const dateKey = parseImportDate(rawDate);
    const project = findImportProject(rawProject, projects);
    const member = rawMember ? findImportMember(rawMember, teamMembers) : teamMembers[0];
    const durationSeconds = parseDurationInput(rawDuration);
    const tags = Array.from(new Set(["Timesheet", ...parseTags(rawTags)]));

    if (!dateKey) {
      errors.push("Date must be YYYY-MM-DD or DD/MM/YYYY");
    }
    if (!rawDescription.trim()) {
      errors.push("Task is required");
    }
    if (!isSafeDisplayText(rawDescription) || !isSafeDisplayText(rawTags)) {
      errors.push("Unsafe text blocked");
    }
    if (!project) {
      errors.push("Project not found");
    }
    if (!member) {
      errors.push("Member not found");
    }
    if (!durationSeconds) {
      errors.push("Duration is invalid");
    }

    return {
      rowNumber: index + 2,
      errors,
      display: {
        dateKey,
        description: rawDescription.trim(),
        projectName: project?.name || rawProject,
        memberName: member?.name || rawMember || teamMembers[0]?.name,
        duration: durationSeconds ? formatDuration(durationSeconds) : rawDuration,
        billable: parseImportBoolean(rawBillable),
        tags
      },
      entryDraft: {
        dateKey,
        description: rawDescription.trim(),
        projectId: project?.id,
        memberId: member?.id,
        durationSeconds,
        billable: parseImportBoolean(rawBillable),
        tags,
        timeRange: "Timesheet import",
        source: "Timesheet import"
      }
    };
  });
}

function csvValue(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined) {
      return String(record[key] || "").trim();
    }
  }
  return "";
}

function findImportProject(value, projects) {
  const normalizedValue = normalizeLookupValue(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    projects.find((project) =>
      [project.id, project.name, `${project.name} ${project.client}`, `${project.name} - ${project.client}`]
        .map(normalizeLookupValue)
        .includes(normalizedValue)
    ) || null
  );
}

function findImportMember(value, members) {
  const normalizedValue = normalizeLookupValue(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    members.find((member) =>
      [member.id, member.name, member.email].map(normalizeLookupValue).includes(normalizedValue)
    ) || null
  );
}

function normalizeLookupValue(value) {
  return String(value || "").trim().toLowerCase();
}

function parseImportDate(value) {
  const trimmedValue = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const ukDateMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!ukDateMatch) {
    return "";
  }

  const [, day, month, year] = ukDateMatch;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return "";
  }

  return getLocalDateKey(parsedDate);
}

function parseImportBoolean(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ["yes", "true", "1", "billable", "y"].includes(normalizedValue);
}
