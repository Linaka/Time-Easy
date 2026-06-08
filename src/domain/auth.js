import {
  ACCESS_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
} from "./accessControl.js";
import {
  DEFAULT_SECTION,
  SECTION_DEFINITIONS,
  getSectionPermission
} from "./sections.js";
import {
  DEFAULT_TEAM_CAPACITY_HOURS,
  isWorkspaceFeatureEnabled,
  workspaceFeatureForSection
} from "./appConfig.js";

export { ACCESS_ROLES, PERMISSIONS, ROLE_PERMISSIONS };

export const SECTION_PERMISSIONS = Object.fromEntries(
  SECTION_DEFINITIONS.map((section) => [section.id, section.permission])
);

const DEFAULT_OWNER_ID = "ava";

export const EMPTY_WORKSPACE_OWNER = Object.freeze({
  id: "workspace-setup",
  name: "Workspace setup",
  email: "setup@timetrackr.local",
  role: "Workspace owner",
  accessRole: "Owner",
  status: "Active",
  capacityHours: DEFAULT_TEAM_CAPACITY_HOURS,
  gradeId: "grade-4"
});

export function getAccessRole(user) {
  if (ACCESS_ROLES.includes(user?.accessRole)) {
    return user.accessRole;
  }

  return user?.id === DEFAULT_OWNER_ID ? "Owner" : "Member";
}

export function ensureWorkspaceOwner(teamMembers) {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  if (!members.length || members.some((member) => getAccessRole(member) === "Owner")) {
    return members;
  }

  return members.map((member, index) =>
    index === 0 ? { ...member, accessRole: "Owner" } : member
  );
}

export function resolveCurrentUser(teamMembers, selectedUserId) {
  const members = ensureWorkspaceOwner(teamMembers);
  const selectedMember = selectedUserId
    ? members.find((member) => member.id === selectedUserId)
    : null;

  return (
    selectedMember ||
    members.find((member) => member.id === DEFAULT_OWNER_ID) ||
    members.find((member) => getAccessRole(member) === "Owner") ||
    members.find((member) => getAccessRole(member) === "Manager") ||
    members[0] ||
    EMPTY_WORKSPACE_OWNER
  );
}

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Member;
}

export function canPerform(user, permission) {
  return getRolePermissions(getAccessRole(user)).includes(permission);
}

export function isSectionEnabled(section, workspaceSettings) {
  const feature = workspaceFeatureForSection(section);
  return feature ? isWorkspaceFeatureEnabled(workspaceSettings, feature.id) : true;
}

export function canAccessSection(user, section, workspaceSettings) {
  const permission = getSectionPermission(section);
  return permission ? canPerform(user, permission) && isSectionEnabled(section, workspaceSettings) : false;
}

export function filterNavigationGroups(groups, user, workspaceSettings) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessSection(user, item.label, workspaceSettings))
    }))
    .filter((group) => group.items.length > 0);
}

export function firstAccessibleSection(user, fallback = DEFAULT_SECTION, workspaceSettings) {
  if (canAccessSection(user, fallback, workspaceSettings)) {
    return fallback;
  }

  if (canAccessSection(user, DEFAULT_SECTION, workspaceSettings)) {
    return DEFAULT_SECTION;
  }

  return (
    SECTION_DEFINITIONS.find((section) => canAccessSection(user, section.id, workspaceSettings))?.id ||
    DEFAULT_SECTION
  );
}
