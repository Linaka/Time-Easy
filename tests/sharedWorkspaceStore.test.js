import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { normalizeWorkspaceSnapshot } from "../src/domain/workspaceSnapshot.js";
import { createSharedWorkspaceStore } from "../server/sharedWorkspaceStore.js";

function createWorkspace(projectId = "project-1") {
  return normalizeWorkspaceSnapshot({
    activityItems: [],
    employmentGrades: [],
    entries: [],
    expenses: [],
    kioskSessions: [],
    projectDependencies: [],
    projects: [{ id: projectId, name: "Shared project" }],
    scheduleItems: [],
    teamMembers: [{ id: "ava", name: "Ava Morgan", accessRole: "Owner" }],
    timeOffRequests: [],
    workspaceSettings: {}
  });
}

test("shared workspace store persists workspace data in SQLite", async () => {
  const directory = await mkdtemp(join(tmpdir(), "timetrackr-store-"));
  const databaseFile = join(directory, "workspace.sqlite");
  const store = createSharedWorkspaceStore({ databaseFile });

  try {
    await store.writeStore({
      revision: 7,
      updatedAt: "2026-06-09T12:00:00.000Z",
      workspace: createWorkspace("project-sqlite")
    });

    const savedStore = await store.readStore();

    assert.equal(savedStore.revision, 7);
    assert.equal(savedStore.updatedAt, "2026-06-09T12:00:00.000Z");
    assert.equal(savedStore.workspace.projects[0].id, "project-sqlite");
  } finally {
    store.close();
  }
});

test("shared workspace store migrates the legacy JSON workspace file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "timetrackr-store-"));
  const databaseFile = join(directory, "workspace.sqlite");
  const legacyJsonFile = join(directory, "workspace.json");
  await writeFile(
    legacyJsonFile,
    JSON.stringify({
      revision: 3,
      updatedAt: "2026-06-09T09:00:00.000Z",
      workspace: createWorkspace("project-json")
    }),
    "utf8"
  );

  const migratingStore = createSharedWorkspaceStore({ databaseFile, legacyJsonFile });
  try {
    const migratedStore = await migratingStore.readStore();

    assert.equal(migratedStore.revision, 3);
    assert.equal(migratedStore.workspace.projects[0].id, "project-json");
  } finally {
    migratingStore.close();
  }

  const sqliteOnlyStore = createSharedWorkspaceStore({
    databaseFile,
    legacyJsonFile: join(directory, "missing-workspace.json")
  });
  try {
    const savedStore = await sqliteOnlyStore.readStore();

    assert.equal(savedStore.revision, 3);
    assert.equal(savedStore.workspace.projects[0].id, "project-json");
  } finally {
    sqliteOnlyStore.close();
  }
});
