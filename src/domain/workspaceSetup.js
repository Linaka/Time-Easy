import {
  DEFAULT_EMPLOYMENT_GRADES,
  DEFAULT_WORKSPACE_SETTINGS
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
        capacityHours: 40,
        gradeId: "grade-4"
      }
    ],
    timeOffRequests: [],
    workspaceSettings: { ...DEFAULT_WORKSPACE_SETTINGS }
  };
}
