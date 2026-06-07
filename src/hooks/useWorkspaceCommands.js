import { createActivityCommands } from "./workspaceCommands/activityCommands.js";
import { createEntryCommands } from "./workspaceCommands/entryCommands.js";
import { createProjectCommands } from "./workspaceCommands/projectCommands.js";
import { createRequestCommands } from "./workspaceCommands/requestCommands.js";
import { createScheduleCommands } from "./workspaceCommands/scheduleCommands.js";
import { createTeamCommands } from "./workspaceCommands/teamCommands.js";

export function useWorkspaceCommands({
  currentUser,
  employmentGrades,
  projectDependencies,
  projects,
  scheduleItems,
  setActivityItems,
  setEmploymentGrades,
  setEntries,
  setExpenses,
  setKioskSessions,
  setProjectDependencies,
  setProjects,
  setScheduleItems,
  setStatusMessage,
  setTeamMembers,
  setTimeOffRequests,
  teamMembers,
  todayKey,
  workspaceSettings
}) {
  const activityCommands = createActivityCommands({
    currentUser,
    setActivityItems,
    setStatusMessage
  });
  const entryCommands = createEntryCommands({
    addActivity: activityCommands.addActivity,
    currentUser,
    setEntries,
    setStatusMessage,
    todayKey,
    workspaceSettings
  });
  const scheduleCommands = createScheduleCommands({
    addActivity: activityCommands.addActivity,
    projectDependencies,
    projects,
    scheduleItems,
    setProjectDependencies,
    setScheduleItems,
    setStatusMessage,
    teamMembers
  });
  const projectCommands = createProjectCommands({
    addActivity: activityCommands.addActivity,
    projects,
    setProjects,
    setStatusMessage
  });
  const teamCommands = createTeamCommands({
    addActivity: activityCommands.addActivity,
    employmentGrades,
    setEmploymentGrades,
    setStatusMessage,
    setTeamMembers,
    teamMembers
  });
  const requestCommands = createRequestCommands({
    addActivity: activityCommands.addActivity,
    currentUser,
    setExpenses,
    setKioskSessions,
    setStatusMessage,
    setTimeOffRequests,
    teamMembers
  });

  return {
    ...activityCommands,
    ...entryCommands,
    ...projectCommands,
    ...requestCommands,
    ...scheduleCommands,
    ...teamCommands
  };
}
