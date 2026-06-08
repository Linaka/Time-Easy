import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_LIMIT,
  DEFAULT_EMPLOYMENT_GRADES,
  STORAGE_PREFIX
} from "../src/domain/appConfig.js";
import {
  createWorkspaceBackup,
  mergeWorkspaceBackup,
  parseWorkspaceBackupText,
  validateWorkspaceBackup,
  WORKSPACE_BACKUP_APP,
  WORKSPACE_BACKUP_MAX_BYTES,
  WORKSPACE_BACKUP_SCHEMA_VERSION
} from "../src/domain/workspaceBackup.js";

const currentWorkspace = {
  activityItems: [],
  employmentGrades: DEFAULT_EMPLOYMENT_GRADES,
  entries: [],
  expenses: [],
  kioskSessions: [],
  projectDependencies: [],
  projects: [
    { id: "acme", name: "ACME", client: "Current", colorKey: "blue", status: "Active" }
  ],
  scheduleItems: [],
  teamMembers: [
    { id: "ava", name: "Ava Morgan", email: "ava@example.test", gradeId: "grade-4", status: "Active" }
  ],
  timeOffRequests: [],
  workspaceSettings: { compactTables: false, defaultBillable: false, requireApprovals: true }
};

test("workspace backups round-trip through the versioned JSON format", () => {
  const backup = createWorkspaceBackup(currentWorkspace, "2026-06-06T12:00:00.000Z");
  const parsed = parseWorkspaceBackupText(JSON.stringify(backup));

  assert.equal(parsed.app, WORKSPACE_BACKUP_APP);
  assert.equal(parsed.schemaVersion, WORKSPACE_BACKUP_SCHEMA_VERSION);
  assert.equal(parsed.storagePrefix, STORAGE_PREFIX);
  assert.equal(parsed.data.projects[0].id, "acme");
});

test("workspace merge is idempotent for an already imported backup", () => {
  const backup = createWorkspaceBackup({
    ...currentWorkspace,
    entries: [
      {
        id: "entry-1",
        dateKey: "2026-06-06",
        description: "Design review",
        projectId: "acme",
        memberId: "ava",
        durationSeconds: 3600,
        billable: true,
        approvalStatus: "Approved"
      }
    ]
  });

  const firstMerge = mergeWorkspaceBackup(currentWorkspace, backup);
  const secondMerge = mergeWorkspaceBackup(firstMerge.workspace, backup);

  assert.equal(firstMerge.workspace.entries.length, 1);
  assert.equal(secondMerge.workspace.entries.length, 1);
  assert.equal(secondMerge.stats.added, 0);
});

test("workspace merge remaps conflicting imported ids and their references", () => {
  const conflictingBackup = createWorkspaceBackup({
    ...currentWorkspace,
    projects: [
      { id: "acme", name: "Imported ACME", client: "Imported", colorKey: "green", status: "Active" }
    ],
    teamMembers: [
      { id: "ava", name: "Imported Ava", email: "imported-ava@example.test", gradeId: "grade-2", status: "Active" }
    ],
    entries: [
      {
        id: "entry-1",
        dateKey: "2026-06-06",
        description: "Imported planning",
        projectId: "acme",
        memberId: "ava",
        durationSeconds: 1800,
        billable: false,
        approvalStatus: "Pending"
      }
    ]
  });

  const { workspace, stats } = mergeWorkspaceBackup(currentWorkspace, conflictingBackup);
  const importedProject = workspace.projects.find((project) => project.name === "Imported ACME");
  const importedMember = workspace.teamMembers.find((member) => member.name === "Imported Ava");
  const importedEntry = workspace.entries.find((entry) => entry.description === "Imported planning");

  assert.notEqual(importedProject.id, "acme");
  assert.notEqual(importedMember.id, "ava");
  assert.equal(importedEntry.projectId, importedProject.id);
  assert.equal(importedEntry.memberId, importedMember.id);
  assert.ok(stats.remapped >= 2);
});

test("workspace backup validation rejects unsafe text and invalid shapes", () => {
  assert.throws(
    () =>
      validateWorkspaceBackup({
        app: WORKSPACE_BACKUP_APP,
        schemaVersion: WORKSPACE_BACKUP_SCHEMA_VERSION,
        data: {
          projects: [{ id: "bad", name: "<script>alert(1)</script>" }]
        }
      }),
    /script-like text/
  );

  assert.throws(
    () =>
      validateWorkspaceBackup({
        app: WORKSPACE_BACKUP_APP,
        schemaVersion: WORKSPACE_BACKUP_SCHEMA_VERSION,
        data: {
          entries: {}
        }
      }),
    /entries data must be an array/
  );
});

test("workspace backup validation rejects oversized imports", () => {
  assert.throws(
    () => parseWorkspaceBackupText(" ".repeat(WORKSPACE_BACKUP_MAX_BYTES + 1)),
    /too large/
  );

  assert.throws(
    () =>
      validateWorkspaceBackup({
        app: WORKSPACE_BACKUP_APP,
        schemaVersion: WORKSPACE_BACKUP_SCHEMA_VERSION,
        data: {
          projects: [{ id: "long", name: "A".repeat(2001) }]
        }
      }),
    /2000 characters or fewer/
  );
});

test("workspace backup validation rejects deeply nested data", () => {
  assert.throws(
    () =>
      validateWorkspaceBackup({
        app: WORKSPACE_BACKUP_APP,
        schemaVersion: WORKSPACE_BACKUP_SCHEMA_VERSION,
        data: {
          settings: {
            a: { b: { c: { d: { e: { f: { g: { h: { i: "too deep" } } } } } } } }
          }
        }
      }),
    /too deeply nested/
  );
});

test("workspace merge caps activity to the configured activity limit", () => {
  const activity = Array.from({ length: ACTIVITY_LIMIT + 10 }, (_, index) => ({
    id: `activity-${index}`,
    actor: "Importer",
    description: `Activity ${index}`,
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    type: "Import"
  }));
  const backup = createWorkspaceBackup({ ...currentWorkspace, activityItems: activity });
  const { workspace } = mergeWorkspaceBackup(currentWorkspace, backup);

  assert.equal(workspace.activityItems.length, ACTIVITY_LIMIT);
  assert.equal(workspace.activityItems[0].description, `Activity ${ACTIVITY_LIMIT + 9}`);
});
