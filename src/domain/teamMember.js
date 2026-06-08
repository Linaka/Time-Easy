import { DEFAULT_TEAM_CAPACITY_HOURS } from "./appConfig.js";
import { ACCESS_ROLES } from "./accessControl.js";
import { getAccessRole } from "./auth.js";

export const TEAM_STATUSES = ["Active", "Inactive"];

function normalizeLookupValue(value) {
  return String(value || "").trim().toLowerCase();
}

function findNormalizedOption(options, value) {
  const normalizedValue = normalizeLookupValue(value);
  if (!normalizedValue) {
    return "";
  }

  return options.find((option) => normalizeLookupValue(option) === normalizedValue) || "";
}

export function normalizeTeamAccessRole(value, fallback = "Member") {
  return findNormalizedOption(ACCESS_ROLES, value) || fallback;
}

export function normalizeTeamStatus(value, fallback = "Active") {
  return findNormalizedOption(TEAM_STATUSES, value) || fallback;
}

export function parseTeamCapacityHours(value, invalidValue = DEFAULT_TEAM_CAPACITY_HOURS) {
  if (!String(value || "").trim()) {
    return DEFAULT_TEAM_CAPACITY_HOURS;
  }

  const capacityHours = Number(value);
  return Number.isFinite(capacityHours) && capacityHours >= 0 ? capacityHours : invalidValue;
}

export function defaultTeamGradeId(employmentGrades = []) {
  return employmentGrades[1]?.id || employmentGrades[0]?.id || "grade-2";
}

export function createBlankTeamMemberForm({ employmentGrades = [], teamMembers = [] } = {}) {
  return {
    name: "",
    email: "",
    role: "Designer",
    accessRole: teamMembers.length === 0 ? "Owner" : "Member",
    capacityHours: String(DEFAULT_TEAM_CAPACITY_HOURS),
    gradeId: defaultTeamGradeId(employmentGrades)
  };
}

export function teamMemberToForm(member, employmentGrades = []) {
  return {
    name: member.name || "",
    email: member.email || "",
    role: member.role || "",
    accessRole: getAccessRole(member),
    capacityHours: String(member.capacityHours ?? DEFAULT_TEAM_CAPACITY_HOURS),
    gradeId: member.gradeId || defaultTeamGradeId(employmentGrades)
  };
}

export function getTeamMemberDeleteAvailability(teamMembers, member) {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const ownerCount = members.filter((currentMember) => getAccessRole(currentMember) === "Owner").length;

  if (members.length <= 1) {
    return {
      canDelete: false,
      message: "Add another owner before deleting the last workspace member.",
      title: "Add another owner before deleting the last workspace member"
    };
  }

  if (getAccessRole(member) === "Owner" && ownerCount <= 1) {
    return {
      canDelete: false,
      message: "Add another owner before deleting the last workspace owner.",
      title: "Add another owner before deleting the last workspace owner"
    };
  }

  return {
    canDelete: true,
    message: "",
    title: `Delete ${member.name}`
  };
}

export function isDemotingLastWorkspaceOwner(teamMembers, member, nextAccessRole) {
  const ownerCount = teamMembers.filter((currentMember) => getAccessRole(currentMember) === "Owner").length;
  return getAccessRole(member) === "Owner" && nextAccessRole !== "Owner" && ownerCount <= 1;
}
