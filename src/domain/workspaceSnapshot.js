import {
  ACTIVITY_LIMIT,
  DEFAULT_WORKSPACE_FEATURES,
  DEFAULT_WORKSPACE_SETTINGS,
  normalizeWorkspaceFeatures,
  normalizeWorkspaceSettings
} from "./appConfig.js";

export const WORKSPACE_COLLECTION_KEYS = [
  "activityItems",
  "employmentGrades",
  "entries",
  "expenses",
  "kioskSessions",
  "projectDependencies",
  "projects",
  "scheduleItems",
  "teamMembers",
  "timeOffRequests"
];

export const WORKSPACE_SNAPSHOT_KEYS = [
  ...WORKSPACE_COLLECTION_KEYS,
  "workspaceSettings"
];

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function copyArrayItems(value) {
  return Array.isArray(value)
    ? value
        .filter((item) => isPlainObject(item))
        .map((item) => ({ ...item }))
    : [];
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mapById(items) {
  return new Map(
    items
      .filter((item) => typeof item.id === "string" && item.id.length > 0)
      .map((item) => [item.id, item])
  );
}

function normalizeActivityItems(items) {
  return [...items]
    .sort((left, right) => String(right.timestamp || "").localeCompare(String(left.timestamp || "")))
    .slice(0, ACTIVITY_LIMIT);
}

export function normalizeWorkspaceSnapshot(workspace = {}) {
  const normalizedWorkspace = {};

  for (const key of WORKSPACE_COLLECTION_KEYS) {
    normalizedWorkspace[key] = copyArrayItems(workspace[key]);
  }

  normalizedWorkspace.activityItems = normalizeActivityItems(normalizedWorkspace.activityItems);
  normalizedWorkspace.workspaceSettings = normalizeWorkspaceSettings(workspace.workspaceSettings);

  return normalizedWorkspace;
}

export function workspaceSnapshotHash(workspace = {}) {
  return JSON.stringify(normalizeWorkspaceSnapshot(workspace));
}

function mergeCollection(baseItems, serverItems, incomingItems) {
  const baseById = mapById(baseItems);
  const serverById = mapById(serverItems);
  const incomingById = mapById(incomingItems);
  const mergedById = new Map(serverById);

  for (const id of baseById.keys()) {
    if (!incomingById.has(id)) {
      mergedById.delete(id);
    }
  }

  for (const [id, incomingItem] of incomingById.entries()) {
    const baseItem = baseById.get(id);
    if (!baseItem || !jsonEqual(baseItem, incomingItem)) {
      mergedById.set(id, incomingItem);
    }
  }

  const orderedItems = [];
  const addedIds = new Set();

  for (const item of incomingItems) {
    if (typeof item.id === "string" && mergedById.has(item.id) && !addedIds.has(item.id)) {
      orderedItems.push(mergedById.get(item.id));
      addedIds.add(item.id);
    }
  }

  for (const item of serverItems) {
    if (typeof item.id === "string" && mergedById.has(item.id) && !addedIds.has(item.id)) {
      orderedItems.push(mergedById.get(item.id));
      addedIds.add(item.id);
    }
  }

  return orderedItems.map((item) => ({ ...item }));
}

function mergeWorkspaceFeatures(baseFeatures, serverFeatures, incomingFeatures) {
  const mergedFeatures = {
    ...DEFAULT_WORKSPACE_FEATURES,
    ...serverFeatures
  };
  const keys = new Set([
    ...Object.keys(DEFAULT_WORKSPACE_FEATURES),
    ...Object.keys(baseFeatures),
    ...Object.keys(serverFeatures),
    ...Object.keys(incomingFeatures)
  ]);

  for (const key of keys) {
    if (!jsonEqual(baseFeatures[key], incomingFeatures[key])) {
      if (incomingFeatures[key] === undefined) {
        delete mergedFeatures[key];
      } else {
        mergedFeatures[key] = cloneJson(incomingFeatures[key]);
      }
    }
  }

  return normalizeWorkspaceFeatures(mergedFeatures);
}

function mergeWorkspaceSettings(baseSettings, serverSettings, incomingSettings) {
  const mergedSettings = {
    ...DEFAULT_WORKSPACE_SETTINGS,
    ...serverSettings
  };
  const keys = new Set([
    ...Object.keys(baseSettings),
    ...Object.keys(serverSettings),
    ...Object.keys(incomingSettings)
  ]);

  for (const key of keys) {
    if (key === "features") {
      mergedSettings.features = mergeWorkspaceFeatures(
        normalizeWorkspaceFeatures(baseSettings.features),
        normalizeWorkspaceFeatures(serverSettings.features),
        normalizeWorkspaceFeatures(incomingSettings.features)
      );
      continue;
    }

    if (!jsonEqual(baseSettings[key], incomingSettings[key])) {
      if (incomingSettings[key] === undefined) {
        delete mergedSettings[key];
      } else {
        mergedSettings[key] = cloneJson(incomingSettings[key]);
      }
    }
  }

  return normalizeWorkspaceSettings(mergedSettings);
}

export function mergeWorkspaceSnapshots(baseWorkspace, serverWorkspace, incomingWorkspace) {
  const base = normalizeWorkspaceSnapshot(baseWorkspace);
  const server = normalizeWorkspaceSnapshot(serverWorkspace);
  const incoming = normalizeWorkspaceSnapshot(incomingWorkspace);
  const merged = {};

  for (const key of WORKSPACE_COLLECTION_KEYS) {
    merged[key] = mergeCollection(base[key], server[key], incoming[key]);
  }

  merged.activityItems = normalizeActivityItems(merged.activityItems);
  merged.workspaceSettings = mergeWorkspaceSettings(
    base.workspaceSettings,
    server.workspaceSettings,
    incoming.workspaceSettings
  );

  return normalizeWorkspaceSnapshot(merged);
}
