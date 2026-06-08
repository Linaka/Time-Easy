import { addDays, addMinutes, dateFromKey, getLocalDateKey } from "./dateUtils.js";

export function createInitialProjects() {
  return [
    { id: "acme", name: "ACME", client: "Creative Studio", colorKey: "blue", status: "Active", budgetHours: 36, hourlyRate: 120, tags: ["Retainer", "Design"] },
    { id: "project-x", name: "Project X", client: "Core Product", colorKey: "purple", status: "Active", budgetHours: 48, hourlyRate: 110, tags: ["Product", "Engineering"] },
    { id: "office", name: "Office", client: "Internal", colorKey: "orange", status: "Active", budgetHours: 24, hourlyRate: 0, tags: ["Internal", "Admin"] },
    { id: "break", name: "Break", client: "Personal", colorKey: "slate", status: "Active", budgetHours: 8, hourlyRate: 0, tags: ["Non-billable"] }
  ];
}

export function createInitialTeamMembers() {
  return [
    { id: "ava", name: "Ava Morgan", email: "ava@timetrackr.local", role: "Design Lead", accessRole: "Owner", status: "Active", capacityHours: 40, gradeId: "grade-4" },
    { id: "noah", name: "Noah Kim", email: "noah@timetrackr.local", role: "Frontend Engineer", accessRole: "Manager", status: "Active", capacityHours: 40, gradeId: "grade-3" },
    { id: "mia", name: "Mia Patel", email: "mia@timetrackr.local", role: "Operations", accessRole: "Member", status: "Active", capacityHours: 32, gradeId: "grade-2" }
  ];
}

export function createInitialEntries(todayKey) {
  const yesterdayKey = getLocalDateKey(addDays(dateFromKey(todayKey), -1));
  return [
    { id: "entry-1", dateKey: todayKey, memberId: "ava", description: "Illustrations", projectId: "acme", tags: ["GBP", "Invoiced"], billable: true, timeRange: "1:00 PM - 3:00 PM", durationSeconds: 7200, approvalStatus: "Approved", source: "Timer" },
    { id: "entry-2", dateKey: todayKey, memberId: "noah", description: "Fixing bug #212", projectId: "project-x", tags: [], billable: true, timeRange: "9:30 AM - 1:00 PM", durationSeconds: 12600, approvalStatus: "Approved", source: "Timer" },
    { id: "entry-3", dateKey: todayKey, memberId: "mia", description: "Filing tax return", projectId: "office", tags: ["Overtime"], billable: false, timeRange: "8:00 AM - 9:30 AM", durationSeconds: 5400, approvalStatus: "Approved", source: "Manual" },
    { id: "entry-4", dateKey: yesterdayKey, memberId: "noah", description: "Developing new feature", projectId: "project-x", tags: ["Overtime"], billable: true, timeRange: "3:00 PM - 6:00 PM", durationSeconds: 10800, approvalStatus: "Approved", source: "Timer" },
    { id: "entry-5", dateKey: yesterdayKey, memberId: "ava", description: "Interface design", projectId: "acme", tags: [], billable: true, timeRange: "1:30 PM - 3:00 PM", durationSeconds: 5400, approvalStatus: "Approved", source: "Timer" },
    { id: "entry-6", dateKey: yesterdayKey, memberId: "ava", description: "Lunch", projectId: "break", tags: [], billable: false, timeRange: "1:00 PM - 1:30 PM", durationSeconds: 1800, approvalStatus: "Approved", source: "Timer" },
    { id: "entry-7", dateKey: yesterdayKey, memberId: "mia", description: "Company training", projectId: "office", tags: [], billable: false, timeRange: "10:00 AM - 1:00 PM", durationSeconds: 10800, approvalStatus: "Approved", source: "Manual" }
  ];
}

export function createInitialExpenses(todayKey) {
  const yesterdayKey = getLocalDateKey(addDays(dateFromKey(todayKey), -1));
  return [
    { id: "expense-1", merchant: "Adobe", category: "Software", amount: 42, dateKey: todayKey, projectId: "acme", submittedBy: "ava", status: "Pending", note: "Illustration tools" },
    { id: "expense-2", merchant: "Trainline", category: "Travel", amount: 68.5, dateKey: yesterdayKey, projectId: "project-x", submittedBy: "noah", status: "Approved", note: "Client workshop" }
  ];
}

export function createInitialTimeOff(todayKey) {
  const startDate = getLocalDateKey(addDays(dateFromKey(todayKey), 3));
  const endDate = getLocalDateKey(addDays(dateFromKey(todayKey), 4));
  return [
    { id: "timeoff-1", memberId: "mia", type: "Vacation", startDate, endDate, days: 2, status: "Pending", note: "Family trip" },
    { id: "timeoff-2", memberId: "ava", type: "Personal", startDate: todayKey, endDate: todayKey, days: 1, status: "Approved", note: "Appointment" }
  ];
}

export function createInitialSchedule(todayKey) {
  const tomorrowKey = getLocalDateKey(addDays(dateFromKey(todayKey), 1));
  const twoWeeksKey = getLocalDateKey(addDays(dateFromKey(todayKey), 14));
  const nextMonthKey = getLocalDateKey(addDays(dateFromKey(todayKey), 45));
  const nextQuarterKey = getLocalDateKey(addDays(dateFromKey(todayKey), 120));
  const laterYearKey = getLocalDateKey(addDays(dateFromKey(todayKey), 250));
  return [
    { id: "schedule-1", memberId: "ava", projectId: "acme", dateKey: todayKey, start: "09:00", end: "17:00", location: "Remote", status: "Published" },
    { id: "schedule-2", memberId: "noah", projectId: "project-x", dateKey: tomorrowKey, start: "10:00", end: "18:00", location: "Studio", status: "Planned" },
    { id: "schedule-3", memberId: "mia", projectId: "office", dateKey: twoWeeksKey, start: "09:30", end: "13:30", location: "Planning", status: "Planned" },
    { id: "schedule-4", memberId: "ava", projectId: "acme", dateKey: nextMonthKey, start: "10:00", end: "16:00", location: "Client review", status: "Planned" },
    { id: "schedule-5", memberId: "noah", projectId: "project-x", dateKey: nextQuarterKey, start: "09:00", end: "17:00", location: "Delivery sprint", status: "Planned" },
    { id: "schedule-6", memberId: "mia", projectId: "office", dateKey: laterYearKey, start: "11:00", end: "15:00", location: "Enablement", status: "Planned" }
  ];
}

export function createInitialDependencies() {
  return [
    { id: "dependency-1", fromProjectId: "acme", toProjectId: "project-x", label: "Design approval before engineering build." },
    { id: "dependency-2", fromProjectId: "project-x", toProjectId: "office", label: "Release plan before internal training." }
  ];
}

export function createInitialKiosks(todayKey) {
  return [
    { id: "kiosk-1", memberId: "mia", projectId: "office", pin: "4821", status: "Completed", startedAt: `${todayKey}T09:00:00.000Z`, endedAt: `${todayKey}T12:00:00.000Z` }
  ];
}

export function createInitialActivity() {
  const now = new Date();
  return [
    { id: "activity-1", type: "Time", actor: "Ava Morgan", description: "Saved timer: Illustrations", timestamp: addMinutes(now, -18).toISOString() },
    { id: "activity-2", type: "Projects", actor: "Noah Kim", description: "Updated Project X schedule", timestamp: addMinutes(now, -70).toISOString() },
    { id: "activity-3", type: "Expenses", actor: "Mia Patel", description: "Submitted Adobe expense", timestamp: addMinutes(now, -130).toISOString() }
  ];
}
