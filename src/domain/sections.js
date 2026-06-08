import { PERMISSIONS } from "./accessControl.js";

export const DEFAULT_SECTION = "Time Tracker";

export const SECTION_DEFINITIONS = [
  {
    id: "Timesheet",
    componentName: "TimesheetPage",
    group: "Track",
    groupDescription: "Time capture and planning",
    iconKey: "listChecks",
    permission: PERMISSIONS.VIEW_TIMESHEET,
    subtitle: "Review weekly totals and add manual rows for people and projects."
  },
  {
    id: "Time Tracker",
    componentName: "TimeTrackerPage",
    group: "Track",
    groupDescription: "Time capture and planning",
    iconKey: "clock",
    permission: PERMISSIONS.TRACK_TIME,
    subtitle: "Start timers, add manual entries, restart previous work, and submit time for approval.",
    chrome: { quickClock: true }
  },
  {
    id: "Week ahead",
    componentName: "CalendarPage",
    group: "Track",
    groupDescription: "Time capture and planning",
    iconKey: "calendarDays",
    permission: PERMISSIONS.VIEW_WEEK_AHEAD,
    subtitle: "See time and scheduled work across the next seven days."
  },
  {
    id: "Schedule",
    componentName: "SchedulePage",
    group: "Track",
    groupDescription: "Time capture and planning",
    iconKey: "calendarClock",
    permission: PERMISSIONS.MANAGE_SCHEDULE,
    subtitle: "Plan shifts, dependencies, and project assignments across week, month, and year horizons."
  },
  {
    id: "Projects",
    componentName: "ProjectsPage",
    group: "Manage",
    groupDescription: "People, work, and requests",
    iconKey: "briefcase",
    permission: PERMISSIONS.MANAGE_PROJECTS,
    subtitle: "Create projects, track budgets, and manage active work."
  },
  {
    id: "Team",
    componentName: "TeamPage",
    group: "Manage",
    groupDescription: "People, work, and requests",
    iconKey: "users",
    permission: PERMISSIONS.MANAGE_TEAM,
    subtitle: "Manage members, capacity, rates, and status."
  },
  {
    id: "Expenses",
    componentName: "ExpensesPage",
    group: "Manage",
    groupDescription: "People, work, and requests",
    iconKey: "receipt",
    permission: PERMISSIONS.SUBMIT_EXPENSES,
    subtitle: "Submit costs and track reimbursement status."
  },
  {
    id: "Time Off",
    componentName: "TimeOffPage",
    group: "Manage",
    groupDescription: "People, work, and requests",
    iconKey: "alarm",
    permission: PERMISSIONS.REQUEST_TIME_OFF,
    subtitle: "Request time away and monitor balances."
  },
  {
    id: "Kiosks",
    componentName: "KiosksPage",
    group: "Manage",
    groupDescription: "People, work, and requests",
    iconKey: "grid",
    permission: PERMISSIONS.USE_KIOSK,
    subtitle: "Clock people in and out from a shared-device workflow."
  },
  {
    id: "Overview",
    componentName: "DashboardPage",
    group: "Review",
    groupDescription: "Insights and approvals",
    iconKey: "layoutDashboard",
    permission: PERMISSIONS.VIEW_DASHBOARD,
    subtitle: "A compact command center for weekly productivity and pending work."
  },
  {
    id: "Dashboard",
    componentName: "DashboardPage",
    group: "Review",
    groupDescription: "Insights and approvals",
    iconKey: "layoutDashboard",
    permission: PERMISSIONS.VIEW_DASHBOARD,
    subtitle: "A compact command center for weekly productivity and pending work.",
    hiddenFromNavigation: true
  },
  {
    id: "Reports",
    componentName: "ReportsPage",
    group: "Review",
    groupDescription: "Insights and approvals",
    iconKey: "gauge",
    permission: PERMISSIONS.VIEW_REPORTS,
    subtitle: "Filter, summarize, and export time data."
  },
  {
    id: "Activity",
    componentName: "ActivityPage",
    group: "Review",
    groupDescription: "Insights and approvals",
    iconKey: "sparkles",
    permission: PERMISSIONS.VIEW_ACTIVITY,
    subtitle: "Audit recent workspace actions and add notes."
  },
  {
    id: "Approvals",
    componentName: "ApprovalsPage",
    group: "Review",
    groupDescription: "Insights and approvals",
    iconKey: "fileCheck",
    permission: PERMISSIONS.REVIEW_APPROVALS,
    subtitle: "Approve or reject pending time, expenses, and time off."
  }
];

const SECTION_BY_ID = new Map(SECTION_DEFINITIONS.map((section) => [section.id, section]));

export function getSectionDefinition(sectionId) {
  return SECTION_BY_ID.get(sectionId) || null;
}

export function getSectionSubtitle(sectionId) {
  return getSectionDefinition(sectionId)?.subtitle || "";
}

export function getSectionPermission(sectionId) {
  return getSectionDefinition(sectionId)?.permission || null;
}

export function sectionUsesQuickClock(sectionId) {
  return Boolean(getSectionDefinition(sectionId)?.chrome?.quickClock);
}

export function buildNavigationGroups() {
  const groups = [];
  const groupByLabel = new Map();

  SECTION_DEFINITIONS.filter((section) => !section.hiddenFromNavigation).forEach((section) => {
    if (!groupByLabel.has(section.group)) {
      const nextGroup = {
        label: section.group,
        description: section.groupDescription,
        items: []
      };
      groupByLabel.set(section.group, nextGroup);
      groups.push(nextGroup);
    }

    groupByLabel.get(section.group).items.push({
      label: section.id,
      iconKey: section.iconKey
    });
  });

  return groups;
}
