import { normalizeWorkspaceSnapshot } from "../domain/workspaceSnapshot.js";

const SHARED_WORKSPACE_ENDPOINT = "/api/workspace";

function hasFetch() {
  return typeof window !== "undefined" && typeof window.fetch === "function";
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

export async function fetchSharedWorkspace() {
  if (!hasFetch()) {
    return { available: false };
  }

  try {
    const response = await window.fetch(SHARED_WORKSPACE_ENDPOINT, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const payload = await readJsonResponse(response);

    if (!response.ok || !payload) {
      return { available: false };
    }

    return {
      available: true,
      found: Boolean(payload.found),
      revision: Number(payload.revision) || 0,
      workspace: payload.workspace ? normalizeWorkspaceSnapshot(payload.workspace) : null
    };
  } catch {
    return { available: false };
  }
}

export async function saveSharedWorkspace({ baseRevision, baseWorkspace, workspace }) {
  if (!hasFetch()) {
    return { available: false };
  }

  try {
    const response = await window.fetch(SHARED_WORKSPACE_ENDPOINT, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        baseRevision,
        baseWorkspace: normalizeWorkspaceSnapshot(baseWorkspace),
        workspace: normalizeWorkspaceSnapshot(workspace)
      })
    });
    const payload = await readJsonResponse(response);

    if (!response.ok || !payload) {
      return { available: false };
    }

    return {
      available: true,
      found: Boolean(payload.found),
      merged: Boolean(payload.merged),
      revision: Number(payload.revision) || 0,
      workspace: normalizeWorkspaceSnapshot(payload.workspace)
    };
  } catch {
    return { available: false };
  }
}
