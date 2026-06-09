import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { normalizeWorkspaceSnapshot } from "../src/domain/workspaceSnapshot.js";

export const DEFAULT_WORKSPACE_DATABASE_FILE = join(process.cwd(), ".workspace-data", "workspace.sqlite");
export const LEGACY_WORKSPACE_JSON_FILE = join(process.cwd(), ".workspace-data", "workspace.json");
const WORKSPACE_ROW_ID = "default";

export function createInitialStore() {
  return {
    revision: 0,
    updatedAt: null,
    workspace: null
  };
}

function normalizeStore(store = {}) {
  return {
    revision: Number(store.revision) || 0,
    updatedAt: store.updatedAt || null,
    workspace: store.workspace ? normalizeWorkspaceSnapshot(store.workspace) : null
  };
}

function storeFromRow(row) {
  if (!row) {
    return createInitialStore();
  }

  return normalizeStore({
    revision: row.revision,
    updatedAt: row.updated_at,
    workspace: row.workspace_json ? JSON.parse(row.workspace_json) : null
  });
}

async function readLegacyJsonStore(legacyJsonFile) {
  try {
    const text = await readFile(legacyJsonFile, "utf8");
    return normalizeStore(JSON.parse(text));
  } catch (error) {
    if (error.code === "ENOENT") {
      return createInitialStore();
    }
    throw error;
  }
}

export function createSharedWorkspaceStore({
  databaseFile = process.env.TIMETRACKR_WORKSPACE_DB || DEFAULT_WORKSPACE_DATABASE_FILE,
  legacyJsonFile = LEGACY_WORKSPACE_JSON_FILE
} = {}) {
  if (databaseFile !== ":memory:") {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new DatabaseSync(databaseFile);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS workspace_store (
      id TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      updated_at TEXT,
      workspace_json TEXT
    );
  `);

  async function readStore() {
    const row = database
      .prepare("SELECT revision, updated_at, workspace_json FROM workspace_store WHERE id = ?")
      .get(WORKSPACE_ROW_ID);

    if (row) {
      return storeFromRow(row);
    }

    const legacyStore = await readLegacyJsonStore(legacyJsonFile);
    if (legacyStore.workspace) {
      await writeStore(legacyStore);
    }
    return legacyStore;
  }

  async function writeStore(store) {
    const normalizedStore = normalizeStore(store);
    database
      .prepare(`
        INSERT INTO workspace_store (id, revision, updated_at, workspace_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          revision = excluded.revision,
          updated_at = excluded.updated_at,
          workspace_json = excluded.workspace_json
      `)
      .run(
        WORKSPACE_ROW_ID,
        normalizedStore.revision,
        normalizedStore.updatedAt,
        normalizedStore.workspace ? JSON.stringify(normalizedStore.workspace) : null
      );
  }

  function close() {
    database.close();
  }

  return {
    close,
    readStore,
    writeStore
  };
}
