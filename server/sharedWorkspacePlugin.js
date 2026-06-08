import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  mergeWorkspaceSnapshots,
  normalizeWorkspaceSnapshot
} from "../src/domain/workspaceSnapshot.js";

const DATA_FILE = join(process.cwd(), ".workspace-data", "workspace.json");
const MAX_BODY_BYTES = 2_000_000;

function createInitialStore() {
  return {
    revision: 0,
    updatedAt: null,
    workspace: null
  };
}

function isApiRequest(url) {
  return url.pathname === "/api/workspace";
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

async function readRequestJson(request) {
  const chunks = [];
  let byteLength = 0;

  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > MAX_BODY_BYTES) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function readStore() {
  try {
    const text = await readFile(DATA_FILE, "utf8");
    const store = JSON.parse(text);
    return {
      revision: Number(store.revision) || 0,
      updatedAt: store.updatedAt || null,
      workspace: store.workspace ? normalizeWorkspaceSnapshot(store.workspace) : null
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return createInitialStore();
    }
    throw error;
  }
}

async function writeStore(store) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const temporaryFile = `${DATA_FILE}.${Date.now()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryFile, DATA_FILE);
}

function workspaceResponse(store, extra = {}) {
  return {
    found: Boolean(store.workspace),
    revision: store.revision,
    updatedAt: store.updatedAt,
    workspace: store.workspace,
    ...extra
  };
}

export function createSharedWorkspacePlugin() {
  let writeQueue = Promise.resolve();

  function queueWrite(operation) {
    const queuedOperation = writeQueue.then(operation, operation);
    writeQueue = queuedOperation.catch(() => undefined);
    return queuedOperation;
  }

  async function handleRequest(request, response) {
    const url = new URL(request.url || "/", "http://localhost");
    if (!isApiRequest(url)) {
      return false;
    }

    if (request.method === "GET") {
      sendJson(response, 200, workspaceResponse(await readStore()));
      return true;
    }

    if (request.method !== "PUT") {
      sendJson(response, 405, { error: "Method not allowed." });
      return true;
    }

    try {
      const payload = await readRequestJson(request);
      if (!payload.workspace || typeof payload.workspace !== "object" || Array.isArray(payload.workspace)) {
        throw new Error("Workspace payload is required.");
      }

      const incomingWorkspace = normalizeWorkspaceSnapshot(payload.workspace);
      const baseRevision = Number(payload.baseRevision) || 0;
      const baseWorkspace = normalizeWorkspaceSnapshot(payload.baseWorkspace);

      const nextStore = await queueWrite(async () => {
        const currentStore = await readStore();
        const shouldMerge =
          Boolean(currentStore.workspace) && currentStore.revision !== baseRevision;
        const workspace = shouldMerge
          ? mergeWorkspaceSnapshots(baseWorkspace, currentStore.workspace, incomingWorkspace)
          : incomingWorkspace;
        const store = {
          revision: currentStore.revision + 1,
          updatedAt: new Date().toISOString(),
          workspace
        };

        await writeStore(store);
        return { store, merged: shouldMerge };
      });

      sendJson(response, 200, workspaceResponse(nextStore.store, { merged: nextStore.merged }));
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Workspace could not be saved." });
    }

    return true;
  }

  function attachServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const handled = await handleRequest(request, response);
      if (!handled) {
        next();
      }
    });
  }

  return {
    name: "shared-workspace",
    configurePreviewServer: attachServer,
    configureServer: attachServer
  };
}
