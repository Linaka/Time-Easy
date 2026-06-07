import { formatDuration } from "../../timeUtils.js";
import { validatePlainFields } from "../../domain/formUtils.js";
import { userIdForRecord } from "./recordIdentity.js";

export function createEntryCommands({
  addActivity,
  currentUser,
  setEntries,
  setStatusMessage,
  todayKey,
  workspaceSettings
}) {
  function addEntry(entryDraft, activityLabel = "Added a time entry") {
    const nextEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      dateKey: todayKey,
      memberId: userIdForRecord(currentUser),
      tags: [],
      billable: false,
      approvalStatus: workspaceSettings.requireApprovals ? "Pending" : "Approved",
      timeRange: "Manual",
      source: "Manual",
      ...entryDraft
    };

    setEntries((currentEntries) => [nextEntry, ...currentEntries]);
    addActivity("Time", `${activityLabel}: ${nextEntry.description}`);
    setStatusMessage(`${nextEntry.description} saved for ${formatDuration(nextEntry.durationSeconds)}.`);
  }

  function addEntries(entryDrafts, activityLabel = "Imported timesheet") {
    const nextEntries = entryDrafts.map((entryDraft, index) => ({
      id: `entry-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      dateKey: todayKey,
      memberId: userIdForRecord(currentUser),
      tags: [],
      billable: false,
      approvalStatus: workspaceSettings.requireApprovals ? "Pending" : "Approved",
      timeRange: "Timesheet import",
      source: "Timesheet import",
      ...entryDraft
    }));

    setEntries((currentEntries) => [...nextEntries, ...currentEntries]);
    addActivity("Timesheet", `${activityLabel}: ${nextEntries.length} rows`);
    setStatusMessage(`${nextEntries.length} timesheet rows imported.`);
  }

  function updateEntry(entryId, entryPatch) {
    const validationError = validatePlainFields([
      entryPatch.description,
      Array.isArray(entryPatch.tags) ? entryPatch.tags.join(", ") : ""
    ]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    setEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === entryId ? { ...entry, ...entryPatch } : entry))
    );
    addActivity("Calendar", `Updated time entry ${entryPatch.description || "time"}`);
    setStatusMessage("Calendar time entry updated.");
    return true;
  }

  function updateEntryApproval(entryId, nextStatus) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, approvalStatus: nextStatus } : entry
      )
    );
    addActivity("Approvals", `Time entry ${nextStatus.toLowerCase()}`);
    setStatusMessage(`Time entry ${nextStatus.toLowerCase()}.`);
  }

  return {
    addEntries,
    addEntry,
    updateEntry,
    updateEntryApproval
  };
}
