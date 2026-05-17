export function sectionSubtitle(section) {
  const subtitles = {
    Timesheet: "Review weekly totals and add manual rows for people and projects.",
    "Time Tracker": "Start timers, add manual entries, restart previous work, and submit time for approval.",
    "Week ahead": "See time and scheduled work across the next seven days.",
    Schedule: "Plan shifts, dependencies, and project assignments across week, month, and year horizons.",
    Expenses: "Submit costs and track reimbursement status.",
    "Time Off": "Request time away and monitor balances.",
    Dashboard: "A compact command center for weekly productivity and pending work.",
    Reports: "Filter, summarize, and export time data.",
    Activity: "Audit recent workspace actions and add notes.",
    Kiosks: "Clock people in and out from a shared-device workflow.",
    Approvals: "Approve or reject pending time, expenses, and time off.",
    Projects: "Create projects, track budgets, and manage active work.",
    Team: "Manage members, capacity, rates, and status."
  };
  return subtitles[section] || "";
}

export function utilitySubtitle(activeUtility) {
  const subtitles = {
    Settings: "Workspace preferences and shortcuts.",
    Notifications: "Pending work that needs attention.",
    Help: "Quick guidance for common workflows.",
    Profile: "Current user and employment grade."
  };
  return subtitles[activeUtility] || "";
}
