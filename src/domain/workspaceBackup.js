import { isSafeDisplayText } from "../timeUtils.js";
import { ACTIVITY_LIMIT, STORAGE_PREFIX } from "./appConfig.js";

export const WORKSPACE_BACKUP_APP = "creative-operations";
export const WORKSPACE_BACKUP_SCHEMA_VERSION = 1;

const ARRAY_BACKUP_KEYS = [
  "projects",
  "teamMembers",
  "grades",
  "entries",
  "expenses",
  "timeOff",
  "schedule",
  "dependencies",
  "kiosks",
  "activity"
];

export function createWorkspaceBackup(workspace, exportedAt = new Date().toISOString()) {
  const normalizedWorkspace = normalizeWorkspaceState(workspace);

  return {
    app: WORKSPACE_BACKUP_APP,
    schemaVersion: WORKSPACE_BACKUP_SCHEMA_VERSION,
    storagePrefix: STORAGE_PREFIX,
    exportedAt,
    data: {
      projects: normalizedWorkspace.projects,
      teamMembers: normalizedWorkspace.teamMembers,
      grades: normalizedWorkspace.employmentGrades,
      entries: normalizedWorkspace.entries,
      expenses: normalizedWorkspace.expenses,
      timeOff: normalizedWorkspace.timeOffRequests,
      schedule: normalizedWorkspace.scheduleItems,
      dependencies: normalizedWorkspace.projectDependencies,
      kiosks: normalizedWorkspace.kioskSessions,
      activity: normalizedWorkspace.activityItems,
      settings: normalizedWorkspace.workspaceSettings
    }
  };
}

export function parseWorkspaceBackupText(backupText) {
  let backup;

  try {
    backup = JSON.parse(backupText);
  } catch {
    throw new Error("Workspace backup must be valid JSON.");
  }

  return validateWorkspaceBackup(backup);
}

export function validateWorkspaceBackup(backup) {
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
    throw new Error("Workspace backup must be a JSON object.");
  }

  if (backup.app !== WORKSPACE_BACKUP_APP) {
    throw new Error("Workspace backup is for a different app.");
  }

  if (backup.schemaVersion !== WORKSPACE_BACKUP_SCHEMA_VERSION) {
    throw new Error("Workspace backup version is not supported.");
  }

  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) {
    throw new Error("Workspace backup is missing its data object.");
  }

  for (const key of ARRAY_BACKUP_KEYS) {
    if (backup.data[key] !== undefined && !Array.isArray(backup.data[key])) {
      throw new Error(`Workspace backup ${key} data must be an array.`);
    }
  }

  if (
    backup.data.settings !== undefined &&
    (!backup.data.settings || typeof backup.data.settings !== "object" || Array.isArray(backup.data.settings))
  ) {
    throw new Error("Workspace backup settings data must be an object.");
  }

  if (hasUnsafeText(backup.data)) {
    throw new Error("Workspace backup contains script-like text and was not imported.");
  }

  return backup;
}

export function mergeWorkspaceBackup(currentWorkspace, backup) {
  const validatedBackup = validateWorkspaceBackup(backup);
  const current = normalizeWorkspaceState(currentWorkspace);
  const incoming = normalizeWorkspaceState(workspaceStateFromBackupData(validatedBackup.data));
  const stats = createEmptyMergeStats();
  const gradeIds = new Set(current.employmentGrades.map((grade) => grade.id));
  const fallbackGradeId = current.employmentGrades[0]?.id || "grade-1";

  const projectMerge = mergeRecordCollection({
    currentRecords: current.projects,
    incomingRecords: incoming.projects,
    prefix: "project"
  });
  collectStats(stats, "projects", projectMerge.stats);

  const teamMerge = mergeRecordCollection({
    currentRecords: current.teamMembers,
    incomingRecords: incoming.teamMembers.map((member) => ({
      ...member,
      gradeId: gradeIds.has(member.gradeId) ? member.gradeId : fallbackGradeId
    })),
    prefix: "member"
  });
  collectStats(stats, "teamMembers", teamMerge.stats);

  const entryMerge = mergeRecordCollection({
    currentRecords: current.entries,
    incomingRecords: incoming.entries.map((entry) => ({
      ...entry,
      memberId: remapReference(entry.memberId, teamMerge.idMap),
      projectId: remapReference(entry.projectId, projectMerge.idMap)
    })),
    prefix: "entry"
  });
  collectStats(stats, "entries", entryMerge.stats);

  const expenseMerge = mergeRecordCollection({
    currentRecords: current.expenses,
    incomingRecords: incoming.expenses.map((expense) => ({
      ...expense,
      projectId: remapReference(expense.projectId, projectMerge.idMap),
      submittedBy: remapReference(expense.submittedBy, teamMerge.idMap)
    })),
    prefix: "expense"
  });
  collectStats(stats, "expenses", expenseMerge.stats);

  const timeOffMerge = mergeRecordCollection({
    currentRecords: current.timeOffRequests,
    incomingRecords: incoming.timeOffRequests.map((request) => ({
      ...request,
      memberId: remapReference(request.memberId, teamMerge.idMap)
    })),
    prefix: "timeoff"
  });
  collectStats(stats, "timeOffRequests", timeOffMerge.stats);

  const scheduleMerge = mergeRecordCollection({
    currentRecords: current.scheduleItems,
    incomingRecords: incoming.scheduleItems.map((item) => ({
      ...item,
      memberId: remapReference(item.memberId, teamMerge.idMap),
      projectId: remapReference(item.projectId, projectMerge.idMap)
    })),
    prefix: "schedule"
  });
  collectStats(stats, "scheduleItems", scheduleMerge.stats);

  const dependencyMerge = mergeRecordCollection({
    currentRecords: current.projectDependencies,
    incomingRecords: incoming.projectDependencies.map((dependency) => ({
      ...dependency,
      fromProjectId: remapReference(dependency.fromProjectId, projectMerge.idMap),
      toProjectId: remapReference(dependency.toProjectId, projectMerge.idMap)
    })),
    prefix: "dependency"
  });
  collectStats(stats, "projectDependencies", dependencyMerge.stats);

  const kioskMerge = mergeRecordCollection({
    currentRecords: current.kioskSessions,
    incomingRecords: incoming.kioskSessions.map((session) => ({
      ...session,
      memberId: remapReference(session.memberId, teamMerge.idMap),
      projectId: remapReference(session.projectId, projectMerge.idMap)
    })),
    prefix: "kiosk"
  });
  collectStats(stats, "kioskSessions", kioskMerge.stats);

  const activityMerge = mergeRecordCollection({
    currentRecords: current.activityItems,
    incomingRecords: incoming.activityItems,
    prefix: "activity"
  });
  collectStats(stats, "activityItems", activityMerge.stats);

  return {
    stats,
    workspace: {
      activityItems: [...activityMerge.records]
        .sort((a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp))
        .slice(0, ACTIVITY_LIMIT),
      employmentGrades: current.employmentGrades,
      entries: entryMerge.records,
      expenses: expenseMerge.records,
      kioskSessions: kioskMerge.records,
      projectDependencies: dependencyMerge.records,
      projects: projectMerge.records,
      scheduleItems: scheduleMerge.records,
      teamMembers: teamMerge.records,
      timeOffRequests: timeOffMerge.records,
      workspaceSettings: {
        ...incoming.workspaceSettings,
        ...current.workspaceSettings
      }
    }
  };
}

export function formatWorkspaceMergeSummary(stats) {
  const importedCount = stats.added;
  const skippedCount = stats.skipped;
  const remappedCount = stats.remapped;
  const parts = [`${importedCount} imported`, `${skippedCount} skipped`];

  if (remappedCount) {
    parts.push(`${remappedCount} remapped`);
  }

  return `Workspace backup merged: ${parts.join(", ")}.`;
}

function workspaceStateFromBackupData(data) {
  return {
    activityItems: data.activity || [],
    employmentGrades: data.grades || [],
    entries: data.entries || [],
    expenses: data.expenses || [],
    kioskSessions: data.kiosks || [],
    projectDependencies: data.dependencies || [],
    projects: data.projects || [],
    scheduleItems: data.schedule || [],
    teamMembers: data.teamMembers || [],
    timeOffRequests: data.timeOff || [],
    workspaceSettings: data.settings || {}
  };
}

function normalizeWorkspaceState(workspace = {}) {
  return {
    activityItems: arrayOrEmpty(workspace.activityItems),
    employmentGrades: arrayOrEmpty(workspace.employmentGrades || workspace.grades),
    entries: arrayOrEmpty(workspace.entries),
    expenses: arrayOrEmpty(workspace.expenses),
    kioskSessions: arrayOrEmpty(workspace.kioskSessions || workspace.kiosks),
    projectDependencies: arrayOrEmpty(workspace.projectDependencies || workspace.dependencies),
    projects: arrayOrEmpty(workspace.projects),
    scheduleItems: arrayOrEmpty(workspace.scheduleItems || workspace.schedule),
    teamMembers: arrayOrEmpty(workspace.teamMembers),
    timeOffRequests: arrayOrEmpty(workspace.timeOffRequests || workspace.timeOff),
    workspaceSettings:
      workspace.workspaceSettings && typeof workspace.workspaceSettings === "object"
        ? { ...workspace.workspaceSettings }
        : {}
  };
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

function mergeRecordCollection({ currentRecords, incomingRecords, prefix }) {
  const records = currentRecords.map((record) => ({ ...record }));
  const existingIds = new Set(records.map((record) => record.id).filter(Boolean));
  const fingerprintToId = new Map(
    records.map((record) => [recordFingerprint(record), record.id]).filter(([, id]) => Boolean(id))
  );
  const idMap = new Map();
  const stats = { added: 0, remapped: 0, skipped: 0 };

  incomingRecords.forEach((record, index) => {
    const originalId = String(record.id || `${prefix}-${index + 1}`);
    const candidate = { ...record, id: originalId };
    const fingerprint = recordFingerprint(candidate);
    const duplicateId = fingerprintToId.get(fingerprint);

    if (duplicateId) {
      idMap.set(originalId, duplicateId);
      stats.skipped += 1;
      return;
    }

    if (existingIds.has(candidate.id)) {
      candidate.id = createImportedId({ originalId, prefix, fingerprint, existingIds });
      stats.remapped += 1;
    }

    records.push(candidate);
    existingIds.add(candidate.id);
    fingerprintToId.set(fingerprint, candidate.id);
    idMap.set(originalId, candidate.id);
    stats.added += 1;
  });

  return { idMap, records, stats };
}

function createImportedId({ originalId, prefix, fingerprint, existingIds }) {
  const baseId = `${prefix}-imported-${hashText(`${originalId}:${fingerprint}`)}`;
  let candidateId = baseId;
  let suffix = 2;

  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

function remapReference(value, idMap) {
  return idMap.get(value) || idMap.get(String(value || "")) || value;
}

function recordFingerprint(record) {
  const { id, ...fingerprintSource } = record;
  return stableStringify(fingerprintSource);
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hasUnsafeText(value) {
  if (typeof value === "string") {
    return !isSafeDisplayText(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasUnsafeText);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(hasUnsafeText);
  }

  return false;
}

function hashText(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function timestampValue(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function createEmptyMergeStats() {
  return {
    added: 0,
    collections: {},
    remapped: 0,
    skipped: 0
  };
}

function collectStats(parentStats, collectionName, collectionStats) {
  parentStats.collections[collectionName] = collectionStats;
  parentStats.added += collectionStats.added;
  parentStats.remapped += collectionStats.remapped;
  parentStats.skipped += collectionStats.skipped;
}
