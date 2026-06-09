import { useEffect, useMemo, useRef } from "react";
import {
  normalizeWorkspaceSnapshot,
  workspaceSnapshotHash
} from "../domain/workspaceSnapshot.js";
import { createSharedWorkspaceSyncSession } from "../services/sharedWorkspaceSync.js";

const SYNC_DEBOUNCE_MS = 350;
const POLL_INTERVAL_MS = 1000;

export function useSharedWorkspacePersistence({ onWorkspaceChange, workspace }) {
  const normalizedWorkspace = useMemo(
    () => normalizeWorkspaceSnapshot(workspace),
    [workspace]
  );
  const workspaceHash = useMemo(
    () => workspaceSnapshotHash(normalizedWorkspace),
    [normalizedWorkspace]
  );
  const mountedRef = useRef(false);
  const syncSessionRef = useRef(null);

  if (!syncSessionRef.current) {
    syncSessionRef.current = createSharedWorkspaceSyncSession();
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    syncSessionRef.current.setWorkspaceChangeHandler((nextWorkspace) => {
      if (mountedRef.current) {
        onWorkspaceChange(nextWorkspace);
      }
    });
  }, [onWorkspaceChange]);

  useEffect(() => {
    syncSessionRef.current.setCurrentWorkspace(normalizedWorkspace);
  }, [normalizedWorkspace, workspaceHash]);

  useEffect(() => {
    async function initializeSharedWorkspace() {
      await syncSessionRef.current.initialize();
    }

    initializeSharedWorkspace().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!syncSessionRef.current.shouldSyncLocalWorkspace()) {
      return undefined;
    }

    const syncTimer = window.setTimeout(() => {
      syncSessionRef.current.syncLocalWorkspace();
    }, SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(syncTimer);
  }, [normalizedWorkspace, workspaceHash]);

  useEffect(() => {
    const pollTimer = window.setInterval(async () => {
      await syncSessionRef.current.pollRemoteWorkspace();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(pollTimer);
  }, []);
}
