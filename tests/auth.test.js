import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessSection,
  canPerform,
  ensureWorkspaceOwner,
  filterNavigationGroups,
  firstAccessibleSection,
  PERMISSIONS,
  resolveCurrentUser
} from "../src/domain/auth.js";

test("owner can access every product section and workspace settings", () => {
  const owner = { id: "ava", accessRole: "Owner" };

  assert.equal(canAccessSection(owner, "Reports"), true);
  assert.equal(canAccessSection(owner, "Team"), true);
  assert.equal(canPerform(owner, PERMISSIONS.MANAGE_SETTINGS), true);
});

test("member access is limited to contributor workflows", () => {
  const member = { id: "mia", accessRole: "Member" };

  assert.equal(canAccessSection(member, "Time Tracker"), true);
  assert.equal(canAccessSection(member, "Expenses"), true);
  assert.equal(canAccessSection(member, "Reports"), false);
  assert.equal(canAccessSection(member, "Team"), false);
});

test("navigation groups remove inaccessible sections", () => {
  const navigation = [
    { label: "Track", items: [{ label: "Time Tracker" }, { label: "Schedule" }] },
    { label: "Manage", items: [{ label: "Team" }] }
  ];

  assert.deepEqual(filterNavigationGroups(navigation, { accessRole: "Member" }), [
    { label: "Track", items: [{ label: "Time Tracker" }] }
  ]);
});

test("fallback section chooses the first permitted workflow", () => {
  assert.equal(firstAccessibleSection({ accessRole: "Member" }, "Reports"), "Time Tracker");
});

test("empty workspaces resolve to a setup owner so the team can recover", () => {
  const user = resolveCurrentUser([]);

  assert.equal(user.accessRole, "Owner");
  assert.equal(canAccessSection(user, "Team"), true);
  assert.equal(canPerform(user, PERMISSIONS.MANAGE_SETTINGS), true);
});

test("selected current user controls view rights", () => {
  const user = resolveCurrentUser(
    [
      { id: "ava", accessRole: "Owner" },
      { id: "mia", accessRole: "Member" }
    ],
    "mia"
  );

  assert.equal(user.id, "mia");
  assert.equal(canAccessSection(user, "Time Tracker"), true);
  assert.equal(canAccessSection(user, "Team"), false);
});

test("current user fallback preserves owner access after default owner is removed", () => {
  const user = resolveCurrentUser([
    { id: "mia", accessRole: "Member" },
    { id: "sana", accessRole: "Owner" }
  ]);

  assert.equal(user.id, "sana");
  assert.equal(canAccessSection(user, "Team"), true);
  assert.equal(canPerform(user, PERMISSIONS.MANAGE_SETTINGS), true);
});

test("workspaces without an owner are normalized for recovery", () => {
  const members = [
    { id: "mia", accessRole: "Member" },
    { id: "noah", accessRole: "Manager" }
  ];
  const normalizedMembers = ensureWorkspaceOwner(members);

  assert.notEqual(normalizedMembers, members);
  assert.equal(normalizedMembers[0].accessRole, "Owner");
  assert.equal(normalizedMembers[1].accessRole, "Manager");
});
