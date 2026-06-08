import { DEFAULT_TEAM_CAPACITY_HOURS } from "./appConfig.js";
import {
  defaultTeamGradeId,
  normalizeTeamAccessRole,
  normalizeTeamStatus,
  parseTeamCapacityHours
} from "./teamMember.js";
import { isSafeDisplayText, parseCsvRecords } from "../timeUtils.js";

export const TEAM_CSV_MAX_BYTES = 1024 * 1024;
export const TEAM_CSV_MAX_FIELD_CHARS = 1000;
export const TEAM_CSV_MAX_ROWS = 1000;

export function buildTeamImportPreview({ csvText, employmentGrades, teamMembers }) {
  const records = parseCsvRecords(validateTeamCsvText(csvText));

  if (records.length > TEAM_CSV_MAX_ROWS) {
    throw new Error(`Team CSV must contain ${TEAM_CSV_MAX_ROWS} rows or fewer.`);
  }

  const seenEmails = new Set();

  return records.map((record, index) => {
    const errors = [];
    const rawName = csvValue(record, ["name", "full_name", "member_name", "person", "employee"]);
    const rawEmail = csvValue(record, ["email", "email_address", "work_email"]);
    const rawRole = csvValue(record, ["role", "job_title", "title"]);
    const rawCapacity = csvValue(record, ["capacity", "capacity_hours", "weekly_capacity", "hours"]);
    const rawAccessRole = csvValue(record, ["access_role", "access", "permissions", "permission"]);
    const rawGrade = csvValue(record, ["employment_grade", "grade", "grade_id", "grade_label"]);
    const rawStatus = csvValue(record, ["status"]);
    const fieldValues = [rawName, rawEmail, rawRole, rawCapacity, rawAccessRole, rawGrade, rawStatus];
    const normalizedEmail = rawEmail.toLowerCase();
    const capacityHours = parseTeamCapacityHours(rawCapacity, null);
    const accessRole = normalizeTeamAccessRole(rawAccessRole, "");
    const matchedGrade = findImportGrade(rawGrade, employmentGrades);
    const defaultGrade = employmentGrades[1] || employmentGrades[0];
    const grade = rawGrade ? matchedGrade : defaultGrade;
    const status = normalizeTeamStatus(rawStatus, "");

    if (!rawName) {
      errors.push("Name is required");
    }
    if (!rawEmail) {
      errors.push("Email is required");
    }
    if (!rawRole) {
      errors.push("Role is required");
    }
    if (capacityHours === null) {
      errors.push("Capacity must be a number greater than or equal to 0");
    }
    if (rawAccessRole && !accessRole) {
      errors.push("Access role must be Owner, Manager, or Member");
    }
    if (rawGrade && !matchedGrade) {
      errors.push("Employment grade not found");
    }
    if (rawStatus && !status) {
      errors.push("Status must be Active or Inactive");
    }
    if (!fieldValues.every(isSafeDisplayText)) {
      errors.push("Unsafe text blocked");
    }
    if (fieldValues.some((fieldValue) => fieldValue.length > TEAM_CSV_MAX_FIELD_CHARS)) {
      errors.push(`Fields must be ${TEAM_CSV_MAX_FIELD_CHARS} characters or fewer`);
    }
    if (
      normalizedEmail &&
      teamMembers.some((member) => String(member.email || "").toLowerCase() === normalizedEmail)
    ) {
      errors.push("Email already exists");
    }
    if (normalizedEmail && seenEmails.has(normalizedEmail)) {
      errors.push("Duplicate email in CSV");
    }
    if (normalizedEmail) {
      seenEmails.add(normalizedEmail);
    }

    const memberDraft = {
      name: rawName,
      email: rawEmail,
      role: rawRole,
      accessRole: accessRole || "Member",
      capacityHours: capacityHours ?? DEFAULT_TEAM_CAPACITY_HOURS,
      gradeId: grade?.id || defaultTeamGradeId(employmentGrades),
      status: status || "Active"
    };

    return {
      rowNumber: index + 2,
      errors,
      display: {
        ...memberDraft,
        gradeLabel: grade ? `${grade.label} - ${grade.title}` : rawGrade || "-"
      },
      memberDraft
    };
  });
}

function validateTeamCsvText(csvText) {
  const text = String(csvText || "");

  if (text.length > TEAM_CSV_MAX_BYTES) {
    throw new Error("Team CSV is too large to import.");
  }

  return text;
}

function csvValue(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined) {
      return String(record[key] || "").trim();
    }
  }
  return "";
}

function findImportGrade(value, employmentGrades) {
  const normalizedValue = normalizeLookupValue(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    employmentGrades.find((grade) =>
      [
        grade.id,
        grade.label,
        grade.title,
        `${grade.label} ${grade.title}`,
        `${grade.label} - ${grade.title}`
      ]
        .map(normalizeLookupValue)
        .includes(normalizedValue)
    ) || null
  );
}

function normalizeLookupValue(value) {
  return String(value || "").trim().toLowerCase();
}
