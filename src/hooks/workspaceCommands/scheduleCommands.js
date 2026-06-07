import { formatReadableDate } from "../../domain/dateUtils.js";
import { validatePlainFields } from "../../domain/formUtils.js";
import {
  memberName,
  projectName
} from "../../domain/projectUtils.js";
import { validateScheduleBlockDraft } from "../../domain/scheduleUtils.js";

export function createScheduleCommands({
  addActivity,
  projectDependencies,
  projects,
  scheduleItems,
  setProjectDependencies,
  setScheduleItems,
  setStatusMessage,
  teamMembers
}) {
  function updateScheduleItem(scheduleId, itemPatch) {
    const currentItem = scheduleItems.find((item) => item.id === scheduleId);
    if (!currentItem) {
      setStatusMessage("Scheduled block was not found.");
      return false;
    }

    const nextItem = { ...currentItem, ...itemPatch };
    const nextLocation = String(nextItem.location || "").trim();
    const validationError = validateScheduleBlockDraft(nextItem, { projects, teamMembers });
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    setScheduleItems((currentItems) =>
      currentItems.map((item) =>
        item.id === scheduleId ? { ...item, ...itemPatch, location: nextLocation } : item
      )
    );
    addActivity("Calendar", "Updated scheduled work block");
    setStatusMessage("Calendar schedule block updated.");
    return true;
  }

  function moveScheduleItemToProject(scheduleId, nextProjectId, nextDateKey) {
    const scheduleItem = scheduleItems.find((item) => item.id === scheduleId);
    const nextProject = projects.find((project) => project.id === nextProjectId);
    const safeNextDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(nextDateKey || ""))
      ? nextDateKey
      : scheduleItem?.dateKey;

    if (!scheduleItem || !nextProject || !safeNextDateKey) {
      setStatusMessage("Schedule assignment could not be moved.");
      return false;
    }

    if (scheduleItem.projectId === nextProjectId && scheduleItem.dateKey === safeNextDateKey) {
      setStatusMessage(`${memberName(scheduleItem.memberId, teamMembers)} is already on ${nextProject.name}.`);
      return true;
    }

    setScheduleItems((currentItems) =>
      currentItems.map((item) =>
        item.id === scheduleId ? { ...item, projectId: nextProjectId, dateKey: safeNextDateKey } : item
      )
    );
    addActivity(
      "Schedule",
      `${memberName(scheduleItem.memberId, teamMembers)} moved from ${projectName(scheduleItem.projectId, projects)} to ${nextProject.name} on ${formatReadableDate(safeNextDateKey)}`
    );
    setStatusMessage(`${memberName(scheduleItem.memberId, teamMembers)} moved to ${nextProject.name} on ${formatReadableDate(safeNextDateKey)}.`);
    return true;
  }

  function addProjectDependency(dependencyDraft) {
    const validationError = validatePlainFields([dependencyDraft.label]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const fromProject = projects.find((project) => project.id === dependencyDraft.fromProjectId);
    const toProject = projects.find((project) => project.id === dependencyDraft.toProjectId);
    if (!fromProject || !toProject) {
      setStatusMessage("Choose two valid projects for the dependency.");
      return false;
    }

    if (fromProject.id === toProject.id) {
      setStatusMessage("A project cannot depend on itself.");
      return false;
    }

    const alreadyExists = projectDependencies.some(
      (dependency) =>
        dependency.fromProjectId === fromProject.id && dependency.toProjectId === toProject.id
    );
    if (alreadyExists) {
      setStatusMessage("That dependency already exists.");
      return false;
    }

    const nextDependency = {
      id: `dependency-${Date.now()}`,
      fromProjectId: fromProject.id,
      toProjectId: toProject.id,
      label: dependencyDraft.label.trim() || "Finish before starting"
    };

    setProjectDependencies((currentDependencies) => [nextDependency, ...currentDependencies]);
    addActivity("Schedule", `Linked ${fromProject.name} before ${toProject.name}`);
    setStatusMessage("Project dependency added.");
    return true;
  }

  function deleteProjectDependency(dependencyId) {
    const dependency = projectDependencies.find((item) => item.id === dependencyId);
    if (!dependency) {
      setStatusMessage("Dependency was not found.");
      return false;
    }

    setProjectDependencies((currentDependencies) =>
      currentDependencies.filter((item) => item.id !== dependencyId)
    );
    addActivity(
      "Schedule",
      `Removed dependency ${projectName(dependency.fromProjectId, projects)} to ${projectName(dependency.toProjectId, projects)}`
    );
    setStatusMessage("Project dependency removed.");
    return true;
  }

  function addScheduleItem(itemDraft) {
    const validationError = validateScheduleBlockDraft(itemDraft, { projects, teamMembers });
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextItem = {
      id: `schedule-${Date.now()}`,
      status: "Planned",
      ...itemDraft,
      location: String(itemDraft.location || "").trim()
    };
    setScheduleItems((currentItems) => [nextItem, ...currentItems]);
    addActivity("Schedule", `Scheduled ${memberName(nextItem.memberId, teamMembers)}`);
    setStatusMessage("Schedule item added.");
    return true;
  }

  function updateScheduleStatus(scheduleId, nextStatus) {
    setScheduleItems((currentItems) =>
      currentItems.map((item) => (item.id === scheduleId ? { ...item, status: nextStatus } : item))
    );
    addActivity("Schedule", `Schedule item marked ${nextStatus}`);
    setStatusMessage(`Schedule item marked ${nextStatus}.`);
  }

  return {
    addProjectDependency,
    addScheduleItem,
    deleteProjectDependency,
    moveScheduleItemToProject,
    updateScheduleItem,
    updateScheduleStatus
  };
}
