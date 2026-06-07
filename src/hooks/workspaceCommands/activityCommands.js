import { ACTIVITY_LIMIT } from "../../domain/appConfig.js";
import { validatePlainFields } from "../../domain/formUtils.js";
import { trackClientEvent } from "../../services/clientLogger.js";
import { actorNameForActivity } from "./recordIdentity.js";

export function createActivityCommands({
  currentUser,
  setActivityItems,
  setStatusMessage
}) {
  function addActivity(type, descriptionText) {
    const nextActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      description: descriptionText,
      actor: actorNameForActivity(currentUser),
      timestamp: new Date().toISOString()
    };
    setActivityItems((currentItems) => [nextActivity, ...currentItems].slice(0, ACTIVITY_LIMIT));
    trackClientEvent("workspace_activity", { type });
  }

  function addActivityNote(note) {
    const validationError = validatePlainFields([note]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }
    addActivity("Note", note.trim());
    setStatusMessage("Activity note added.");
    return true;
  }

  function clearActivity() {
    setActivityItems([]);
    setStatusMessage("Activity log cleared.");
  }

  return {
    addActivity,
    addActivityNote,
    clearActivity
  };
}
