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
  capacityHours: 40,
  gradeId: "grade-4"
});

export function resolveCurrentUser(teamMembers) {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  return (
    members.find((member) => member.id === DEFAULT_OWNER_ID) ||
    members[0] ||
    EMPTY_WORKSPACE_OWNER
  );
}

export function getAccessRole(user) {
  if (ACCESS_ROLES.includes(user?.accessRole)) {
    return user.accessRole;
  }

  return user?.id === DEFAULT_OWNER_ID ? "Owner" : "Member";
}

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Member;
}

export function canPerform(user, permission) {
  return getRolePermissions(getAccessRole(user)).includes(permission);
}

export function canAccessSection(user, section) {
  const permission = getSectionPermission(section);
  return permission ? canPerform(user, permission) : false;
}

export function filterNavigationGroups(groups, user) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessSection(user, item.label))
    }))
    .filter((group) => group.items.length > 0);
}

export function firstAccessibleSection(user, fallback = DEFAULT_SECTION) {
  if (canAccessSection(user, fallback)) {
    return fallback;
  }

  if (canAccessSection(user, DEFAULT_SECTION)) {
    return DEFAULT_SECTION;
  }

  return (
    SECTION_DEFINITIONS.find((section) => canAccessSection(user, section.id))?.id ||
    DEFAULT_SECTION
  );
}
