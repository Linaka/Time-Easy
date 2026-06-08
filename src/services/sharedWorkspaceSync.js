import {
  mergeWorkspaceSnapshots,
  normalizeWorkspaceSnapshot,
  workspaceSnapshotHash
} from "../domain/workspaceSnapshot.js";
import {
  fetchSharedWorkspace,
  saveSharedWorkspace
} from "./sharedWorkspaceClient.js";

export function createSharedWorkspaceSyncSession({
  fetchWorkspace = fetchSharedWorkspace,
  onWorkspaceChange = () => {},
  saveWorkspace = saveSharedWorkspace
} = {}) {
  let baseRevision = 0;
  let baseWorkspace = null;
  let currentHash = "";
  let currentWorkspace = normalizeWorkspaceSnapshot();
  let enabled = null;
  let initialized = false;
  let lastSyncedHash = "";
  let saveInFlight = false;
  let workspaceChangeHandler = onWorkspaceChange;

  function disableSync() {
    enabled = false;
    initialized = true;
  }

  function applyRemoteWorkspace(nextWorkspace, revision) {
    const normalizedRemoteWorkspace = normalizeWorkspaceSnapshot(nextWorkspace);
    const nextHash = workspaceSnapshotHash(normalizedRemoteWorkspace);

    baseRevision = revision;
    baseWorkspace = normalizedRemoteWorkspace;
    lastSyncedHash = nextHash;

    if (currentHash !== nextHash) {
      workspaceChangeHandler(normalizedRemoteWorkspace);
    }
  }

  function applyRemoteSaveResult(result) {
    const remoteWorkspace = normalizeWorkspaceSnapshot(result.workspace);
    const remoteHash = workspaceSnapshotHash(remoteWorkspace);

    baseRevision = result.revision;
    baseWorkspace = remoteWorkspace;
    lastSyncedHash = remoteHash;

    return { remoteHash, remoteWorkspace };
  }

  async function initialize() {
    const result = await fetchWorkspace();

    if (!result.available) {
      disableSync();
      return;
    }

    enabled = true;
    if (result.found && result.workspace) {
      applyRemoteWorkspace(result.workspace, result.revision);
      initialized = true;
      return;
    }

    const saved = await saveWorkspace({
      baseRevision: 0,
      baseWorkspace: currentWorkspace,
      workspace: currentWorkspace
    });

    if (!saved.available || !saved.workspace) {
      disableSync();
      return;
    }

    applyRemoteWorkspace(saved.workspace, saved.revision);
    initialized = true;
  }

  function setCurrentWorkspace(nextWorkspace) {
    currentWorkspace = normalizeWorkspaceSnapshot(nextWorkspace);
    currentHash = workspaceSnapshotHash(currentWorkspace);
  }

  function setWorkspaceChangeHandler(nextHandler) {
    workspaceChangeHandler = nextHandler || (() => {});
  }

  function shouldSyncLocalWorkspace() {
    return Boolean(
      enabled === true &&
      initialized &&
      baseWorkspace &&
      !saveInFlight &&
      currentHash !== lastSyncedHash
    );
  }

  async function syncLocalWorkspace() {
    if (!shouldSyncLocalWorkspace()) {
      return;
    }

    saveInFlight = true;
    const sentBaseWorkspace = baseWorkspace;
    const sentHash = currentHash;
    const sentRevision = baseRevision;
    const sentWorkspace = currentWorkspace;

    try {
      const result = await saveWorkspace({
        baseRevision: sentRevision,
        baseWorkspace: sentBaseWorkspace,
        workspace: sentWorkspace
      });

      if (!result.available || !result.workspace) {
        enabled = false;
        return;
      }

      const { remoteHash, remoteWorkspace } = applyRemoteSaveResult(result);

      if (currentHash === sentHash) {
        if (remoteHash !== sentHash) {
          workspaceChangeHandler(remoteWorkspace);
        }
        return;
      }

      const rebasedWorkspace = mergeWorkspaceSnapshots(
        sentWorkspace,
        remoteWorkspace,
        currentWorkspace
      );
      if (workspaceSnapshotHash(rebasedWorkspace) !== currentHash) {
        workspaceChangeHandler(rebasedWorkspace);
      }
    } finally {
      saveInFlight = false;
    }
  }

  async function pollRemoteWorkspace() {
    if (enabled !== true || !initialized || saveInFlight) {
      return;
    }

    const result = await fetchWorkspace();
    if (!result.available || !result.found || !result.workspace) {
      enabled = false;
      return;
    }

    if (result.revision <= baseRevision) {
      return;
    }

    const remoteWorkspace = normalizeWorkspaceSnapshot(result.workspace);
    const remoteHash = workspaceSnapshotHash(remoteWorkspace);
    const hasLocalChanges = currentHash !== lastSyncedHash;

    if (!hasLocalChanges) {
      applyRemoteWorkspace(remoteWorkspace, result.revision);
      return;
    }

    const mergedWorkspace = mergeWorkspaceSnapshots(
      baseWorkspace,
      remoteWorkspace,
      currentWorkspace
    );
    baseRevision = result.revision;
    baseWorkspace = remoteWorkspace;
    lastSyncedHash = remoteHash;

    if (workspaceSnapshotHash(mergedWorkspace) !== currentHash) {
      workspaceChangeHandler(mergedWorkspace);
    }
  }

  return {
    initialize,
    pollRemoteWorkspace,
    setCurrentWorkspace,
    setWorkspaceChangeHandler,
    shouldSyncLocalWorkspace,
    syncLocalWorkspace
  };
}
