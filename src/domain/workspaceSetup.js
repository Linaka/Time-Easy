import {
  DEFAULT_EMPLOYMENT_GRADES,
  DEFAULT_TEAM_CAPACITY_HOURS,
  DEFAULT_WORKSPACE_SETTINGS,
  normalizeWorkspaceSettings
} from "./appConfig.js";

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

export function createFreshWorkspace(timestamp = new Date()) {
  return {
    activityItems: [
      {
        id: `activity-fresh-${timestamp.getTime()}`,
        type: "Setup",
        actor: "System",
        description: "Fresh workspace setup created",
        timestamp: timestamp.toISOString()
      }
    ],
    employmentGrades: cloneItems(DEFAULT_EMPLOYMENT_GRADES),
    entries: [],
    expenses: [],
    kioskSessions: [],
    projectDependencies: [],
    projects: [
      {
        id: "starter",
        name: "Starter Project",
        client: "Internal",
        colorKey: "green",
        status: "Active",
        budgetHours: 0,
        hourlyRate: 0,
        tags: ["Setup"]
      }
    ],
    scheduleItems: [],
    teamMembers: [
      {
        id: "ava",
        name: "Ava Morgan",
        email: "ava@timetrackr.local",
        role: "Workspace Owner",
        accessRole: "Owner",
        status: "Active",
        capacityHours: DEFAULT_TEAM_CAPACITY_HOURS,
        gradeId: "grade-4"
      }
    ],
    timeOffRequests: [],
    workspaceSettings: normalizeWorkspaceSettings(DEFAULT_WORKSPACE_SETTINGS)
  };
}
