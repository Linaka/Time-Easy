import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_EMPLOYMENT_GRADES } from "../src/domain/appConfig.js";
import {
  buildReportCsv,
  buildReportCsvFromWorkspace,
  buildReportData
} from "../src/domain/reportCsv.js";

const projects = [
  {
    id: "acme",
    name: "ACME",
    client: "Creative Studio",
    colorKey: "blue",
    budgetHours: 10,
    hourlyRate: 100,
    status: "Active",
    tags: ["Design"]
  }
];
const teamMembers = [
  { id: "ava", name: "Ava Morgan", email: "ava@example.test", gradeId: "grade-4" }
];
const scheduleItems = [
  { id: "schedule-1", projectId: "acme", memberId: "ava", dateKey: "2026-06-06", start: "09:00", end: "10:00" }
];
const entries = [
  {
    id: "entry-1",
    dateKey: "2026-06-06",
    description: "=SUM(1,1)",
    projectId: "acme",
    memberId: "ava",
    durationSeconds: 3600,
    billable: true,
    approvalStatus: "Approved"
  },
  {
    id: "entry-2",
    dateKey: "2026-06-07",
    description: "Internal admin",
    projectId: "acme",
    memberId: "ava",
    durationSeconds: 1800,
    billable: false,
    approvalStatus: "Pending"
  }
];

test("report CSV generation escapes formula-like cells", () => {
  const csv = buildReportCsvFromWorkspace({
    employmentGrades: DEFAULT_EMPLOYMENT_GRADES,
    entries,
    projects,
    scheduleItems,
    teamMembers
  });

  assert.match(csv, /'=SUM\(1,1\)/);
  assert.match(csv, /Project performance/);
  assert.match(csv, /Time entries/);
});

test("report data and CSV honor active filters", () => {
  const reportData = buildReportData({
    employmentGrades: DEFAULT_EMPLOYMENT_GRADES,
    entries,
    filters: { billable: "false" },
    projects,
    scheduleItems,
    teamMembers
  });
  const csv = buildReportCsv(reportData);

  assert.equal(reportData.filteredEntries.length, 1);
  assert.match(csv, /Internal admin/);
  assert.doesNotMatch(csv, /'=SUM\(1,1\)/);
  assert.deepEqual(reportData.activeFilterChips, ["Billing: Non-billable"]);
});
