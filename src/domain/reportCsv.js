import {
  escapeCsvCell,
  formatDuration,
  groupDurationsByProject,
  sumBillableDurations,
  sumDurations
} from "../timeUtils.js";
import { DEFAULT_EMPLOYMENT_GRADES, DEFAULT_REPORT_FILTERS } from "./appConfig.js";
import { formatReadableDate } from "./dateUtils.js";
import {
  calculateMarginPercent,
  currency,
  formatMargin
} from "./formatters.js";
import {
  getProjectFinancialMetrics,
  memberName,
  projectName
} from "./projectUtils.js";

export function buildReportData({
  entries = [],
  projects = [],
  teamMembers = [],
  employmentGrades = DEFAULT_EMPLOYMENT_GRADES,
  scheduleItems = [],
  filters = DEFAULT_REPORT_FILTERS
}) {
  const safeFilters = { ...DEFAULT_REPORT_FILTERS, ...filters };
  const safeEmploymentGrades = employmentGrades.length ? employmentGrades : DEFAULT_EMPLOYMENT_GRADES;
  const allowedProjects = projects.filter((project) => {
    const matchesProject = safeFilters.projectId === "All" || project.id === safeFilters.projectId;
    const matchesClient = safeFilters.client === "All" || project.client === safeFilters.client;
    const matchesTag = safeFilters.projectTag === "All" || project.tags?.includes(safeFilters.projectTag);
    return matchesProject && matchesClient && matchesTag;
  });
  const allowedProjectIds = new Set(allowedProjects.map((project) => project.id));
  const filteredEntries = entries.filter((entry) => {
    return (
      allowedProjectIds.has(entry.projectId) &&
      (safeFilters.memberId === "All" || entry.memberId === safeFilters.memberId) &&
      (safeFilters.approvalStatus === "All" || entry.approvalStatus === safeFilters.approvalStatus) &&
      (safeFilters.billable === "All" || String(entry.billable) === safeFilters.billable) &&
      (!safeFilters.dateFrom || entry.dateKey >= safeFilters.dateFrom) &&
      (!safeFilters.dateTo || entry.dateKey <= safeFilters.dateTo)
    );
  });
  const filteredScheduleItems = scheduleItems.filter((item) => {
    return (
      allowedProjectIds.has(item.projectId) &&
      (safeFilters.memberId === "All" || item.memberId === safeFilters.memberId) &&
      (!safeFilters.dateFrom || item.dateKey >= safeFilters.dateFrom) &&
      (!safeFilters.dateTo || item.dateKey <= safeFilters.dateTo)
    );
  });
  const activeFilterChips = [
    safeFilters.projectId !== "All" ? `Project: ${projectName(safeFilters.projectId, projects)}` : "",
    safeFilters.client !== "All" ? `Client: ${safeFilters.client}` : "",
    safeFilters.projectTag !== "All" ? `Tag: ${safeFilters.projectTag}` : "",
    safeFilters.memberId !== "All" ? `Person: ${memberName(safeFilters.memberId, teamMembers)}` : "",
    safeFilters.approvalStatus !== "All" ? `Status: ${safeFilters.approvalStatus}` : "",
    safeFilters.billable !== "All" ? `Billing: ${safeFilters.billable === "true" ? "Billable" : "Non-billable"}` : "",
    safeFilters.dateFrom ? `From: ${formatReadableDate(safeFilters.dateFrom)}` : "",
    safeFilters.dateTo ? `To: ${formatReadableDate(safeFilters.dateTo)}` : ""
  ].filter(Boolean);
  const projectMetrics = allowedProjects.map((project) =>
    getProjectFinancialMetrics({
      project,
      entries: filteredEntries,
      scheduleItems: filteredScheduleItems,
      teamMembers,
      employmentGrades: safeEmploymentGrades,
      memberFilter: safeFilters.memberId
    })
  );
  const totalBudgetValue = projectMetrics.reduce((sum, metric) => sum + metric.budgetValue, 0);
  const totalActualCost = projectMetrics.reduce((sum, metric) => sum + metric.actualCost, 0);

  return {
    activeFilterChips,
    billableTotal: sumBillableDurations(filteredEntries),
    clientOptions: ["All", ...Array.from(new Set(projects.map((project) => project.client)))],
    filteredEntries,
    filteredScheduleItems,
    filters: safeFilters,
    hasActiveFilters: activeFilterChips.length > 0,
    projectGroups: groupDurationsByProject(filteredEntries),
    projectMetrics,
    projects,
    tagOptions: ["All", ...Array.from(new Set(projects.flatMap((project) => project.tags || [])))],
    teamMembers,
    total: sumDurations(filteredEntries),
    totalActualCost,
    totalBudgetValue,
    totalMarginPercent: calculateMarginPercent(totalBudgetValue, totalActualCost),
    totalScheduledSeconds: projectMetrics.reduce((sum, metric) => sum + metric.scheduledSeconds, 0),
    visibleProjects: allowedProjects
  };
}

export function buildReportCsv(reportData) {
  const rows = [
    [
      "Filters",
      reportData.activeFilterChips.length
        ? reportData.activeFilterChips.join("; ")
        : "No filters applied"
    ],
    [],
    ["Project performance"],
    ["Project", "Budget", "Scheduled Time", "Actual Time Spent", "Actual Cost", "Margin %"],
    ...reportData.projectMetrics.map((metric) => [
      metric.project.name,
      currency(metric.budgetValue),
      formatDuration(metric.scheduledSeconds),
      formatDuration(metric.actualSeconds),
      currency(metric.actualCost),
      formatMargin(metric.marginPercent)
    ]),
    [],
    ["Time entries"],
    ["Date", "Task", "Project", "Member", "Billable", "Duration", "Status"],
    ...reportData.filteredEntries.map((entry) => [
      entry.dateKey,
      entry.description,
      projectName(entry.projectId, reportData.projects),
      memberName(entry.memberId, reportData.teamMembers),
      entry.billable ? "Yes" : "No",
      formatDuration(entry.durationSeconds),
      entry.approvalStatus
    ])
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function buildReportCsvFromWorkspace(workspace) {
  return buildReportCsv(buildReportData(workspace));
}
