import test from "node:test";
import assert from "node:assert/strict";
import { createSharedWorkspaceSyncSession } from "../src/services/sharedWorkspaceSync.js";
import { normalizeWorkspaceSnapshot } from "../src/domain/workspaceSnapshot.js";

function workspaceWithEntries(entries) {
  return normalizeWorkspaceSnapshot({
    entries,
    workspaceSettings: {}
  });
}

test("shared workspace sync applies an existing remote workspace on initialize", async () => {
  const remoteWorkspace = workspaceWithEntries([{ id: "remote-entry", description: "Remote" }]);
  const appliedWorkspaces = [];
  const session = createSharedWorkspaceSyncSession({
    fetchWorkspace: async () => ({
      available: true,
      found: true,
      revision: 4,
      workspace: remoteWorkspace
    }),
    onWorkspaceChange: (workspace) => appliedWorkspaces.push(workspace),
    saveWorkspace: async () => {
      throw new Error("save should not be called");
    }
  });

  session.setCurrentWorkspace(workspaceWithEntries([]));
  await session.initialize();

  assert.equal(appliedWorkspaces.length, 1);
  assert.deepEqual(
    appliedWorkspaces[0].entries.map((entry) => entry.id),
    ["remote-entry"]
  );
});

test("shared workspace sync merges remote polling changes with local edits", async () => {
  const baseWorkspace = workspaceWithEntries([{ id: "entry-1", description: "Base" }]);
  const localWorkspace = workspaceWithEntries([
    { id: "entry-local", description: "Local" },
    { id: "entry-1", description: "Base" }
  ]);
  const remoteWorkspace = workspaceWithEntries([
    { id: "entry-server", description: "Server" },
    { id: "entry-1", description: "Base" }
  ]);
  const fetchResults = [
    {
      available: true,
      found: true,
      revision: 1,
      workspace: baseWorkspace
    },
    {
      available: true,
      found: true,
      revision: 2,
      workspace: remoteWorkspace
    }
  ];
  const appliedWorkspaces = [];
  const session = createSharedWorkspaceSyncSession({
    fetchWorkspace: async () => fetchResults.shift(),
    onWorkspaceChange: (workspace) => appliedWorkspaces.push(workspace),
    saveWorkspace: async () => {
      throw new Error("save should not be called");
    }
  });

  session.setCurrentWorkspace(baseWorkspace);
  await session.initialize();
  session.setCurrentWorkspace(localWorkspace);
  await session.pollRemoteWorkspace();

  assert.equal(appliedWorkspaces.length, 1);
  assert.deepEqual(
    appliedWorkspaces[0].entries.map((entry) => entry.id),
    ["entry-local", "entry-1", "entry-server"]
  );
});
