import { sumDurations } from "../timeUtils.js";
import { DEFAULT_EMPLOYMENT_GRADES, PROJECT_COLORS } from "./appConfig.js";
import { calculateMarginPercent } from "./formatters.js";
import { scheduleDurationSeconds } from "./scheduleUtils.js";

export function getProject(projects, projectId) {
  return projects.find((project) => project.id === projectId) || {
    id: "unknown",
    name: "Unassigned",
    client: "No client",
    colorKey: "slate",
    status: "Active"
  };
}

export function getEmploymentGrade(gradeId, employmentGrades = DEFAULT_EMPLOYMENT_GRADES) {
  return employmentGrades.find((grade) => grade.id === gradeId) || employmentGrades[0] || DEFAULT_EMPLOYMENT_GRADES[0];
}

export function projectStyle(project) {
  return PROJECT_COLORS[project?.colorKey] || PROJECT_COLORS.slate;
}

export function projectName(projectId, projects) {
  return getProject(projects, projectId).name;
}

export function memberName(memberId, members) {
  return members.find((member) => member.id === memberId)?.name || "Unassigned";
}

export function memberHourlyRate(memberId, members, employmentGrades) {
  const member = members.find((currentMember) => currentMember.id === memberId);
  return getEmploymentGrade(member?.gradeId, employmentGrades).hourlyRate;
}

export function getProjectFinancialMetrics({ project, entries, scheduleItems, teamMembers, employmentGrades, memberFilter }) {
  const projectEntries = entries.filter((entry) => entry.projectId === project.id);
  const projectScheduleItems = scheduleItems.filter((item) => {
    const matchesProject = item.projectId === project.id;
    const matchesMember = memberFilter === "All" || item.memberId === memberFilter;
    return matchesProject && matchesMember;
  });
  const budgetSeconds = Number(project.budgetHours || 0) * 3600;
  const budgetValue = Number(project.budgetHours || 0) * Number(project.hourlyRate || 0);
  const actualSeconds = sumDurations(projectEntries);
  const scheduledSeconds = projectScheduleItems.reduce(
    (sum, item) => sum + scheduleDurationSeconds(item),
    0
  );
  const actualCost = projectEntries.reduce((sum, entry) => {
    const hours = Number(entry.durationSeconds || 0) / 3600;
    return sum + hours * memberHourlyRate(entry.memberId, teamMembers, employmentGrades);
  }, 0);

  return {
    project,
    budgetSeconds,
    budgetValue,
    scheduledSeconds,
    actualSeconds,
    actualCost,
    marginPercent: calculateMarginPercent(budgetValue, actualCost)
  };
}
