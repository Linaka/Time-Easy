import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_WORKSPACE_SETTINGS } from "../src/domain/appConfig.js";
import {
  mergeWorkspaceSnapshots,
  normalizeWorkspaceSnapshot,
  workspaceSnapshotHash
} from "../src/domain/workspaceSnapshot.js";

const baseWorkspace = normalizeWorkspaceSnapshot({
  activityItems: [],
  employmentGrades: [{ id: "grade-1", title: "Associate", hourlyRate: 50 }],
  entries: [{ id: "entry-1", description: "Base entry" }],
  expenses: [],
  kioskSessions: [],
  projectDependencies: [],
  projects: [{ id: "project-1", name: "Base project" }],
  scheduleItems: [],
  teamMembers: [{ id: "ava", name: "Ava", accessRole: "Owner" }],
  timeOffRequests: [],
  workspaceSettings: DEFAULT_WORKSPACE_SETTINGS
});

test("workspace snapshot hashes normalize equivalent workspace shapes", () => {
  const workspace = {
    ...baseWorkspace,
    entries: baseWorkspace.entries.map((entry) => ({ ...entry })),
    workspaceSettings: { ...DEFAULT_WORKSPACE_SETTINGS }
  };

  assert.equal(workspaceSnapshotHash(workspace), workspaceSnapshotHash(normalizeWorkspaceSnapshot(workspace)));
});

test("workspace merge keeps concurrent additions from two clients", () => {
  const serverWorkspace = {
    ...baseWorkspace,
    entries: [
      { id: "entry-server", description: "Server entry" },
      ...baseWorkspace.entries
    ]
  };
  const incomingWorkspace = {
    ...baseWorkspace,
    entries: [
      { id: "entry-local", description: "Local entry" },
      ...baseWorkspace.entries
    ]
  };

  const merged = mergeWorkspaceSnapshots(baseWorkspace, serverWorkspace, incomingWorkspace);

  assert.deepEqual(
    merged.entries.map((entry) => entry.id),
    ["entry-local", "entry-1", "entry-server"]
  );
});

test("workspace merge applies local deletes without dropping server additions", () => {
  const serverWorkspace = {
    ...baseWorkspace,
    projects: [
      { id: "project-server", name: "Server project" },
      ...baseWorkspace.projects
    ]
  };
  const incomingWorkspace = {
    ...baseWorkspace,
    projects: []
  };

  const merged = mergeWorkspaceSnapshots(baseWorkspace, serverWorkspace, incomingWorkspace);

  assert.deepEqual(
    merged.projects.map((project) => project.id),
    ["project-server"]
  );
});

test("workspace merge applies settings changes by changed field", () => {
  const serverWorkspace = {
    ...baseWorkspace,
    workspaceSettings: {
      ...baseWorkspace.workspaceSettings,
      compactTables: true
    }
  };
  const incomingWorkspace = {
    ...baseWorkspace,
    workspaceSettings: {
      ...baseWorkspace.workspaceSettings,
      defaultBillable: true
    }
  };

  const merged = mergeWorkspaceSnapshots(baseWorkspace, serverWorkspace, incomingWorkspace);

  assert.equal(merged.workspaceSettings.compactTables, true);
  assert.equal(merged.workspaceSettings.defaultBillable, true);
});

test("workspace merge applies concurrent feature setting changes by module", () => {
  const serverWorkspace = {
    ...baseWorkspace,
    workspaceSettings: {
      ...baseWorkspace.workspaceSettings,
      features: {
        ...baseWorkspace.workspaceSettings.features,
        expenses: false
      }
    }
  };
  const incomingWorkspace = {
    ...baseWorkspace,
    workspaceSettings: {
      ...baseWorkspace.workspaceSettings,
      features: {
        ...baseWorkspace.workspaceSettings.features,
        timeOff: false
      }
    }
  };

  const merged = mergeWorkspaceSnapshots(baseWorkspace, serverWorkspace, incomingWorkspace);

  assert.equal(merged.workspaceSettings.features.expenses, false);
  assert.equal(merged.workspaceSettings.features.timeOff, false);
  assert.equal(merged.workspaceSettings.features.kiosks, true);
});
