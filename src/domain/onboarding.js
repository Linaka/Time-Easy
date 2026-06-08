import { OVERVIEW_SECTION } from "./appConfig.js";

export const ONBOARDING_STATUS = {
  PENDING: "pending",
  STARTED: "started",
  DECLINED: "declined",
  COMPLETED: "completed",
  SKIPPED: "skipped"
};

export const GUIDANCE_STEPS = [
  {
    section: OVERVIEW_SECTION,
    targetId: "overview-metrics",
    title: "Overview",
    body: "Start here for weekly totals, billable time, approvals, and logged costs."
  },
  {
    section: "Time Tracker",
    targetId: "time-entry-bar",
    title: "Track Time",
    body: "Capture focused work with the timer, assign it to a project, and mark billable time as needed."
  },
  {
    section: "Projects",
    targetId: "project-portfolio",
    title: "Projects",
    body: "Use the portfolio view to scan budgets, rates, clients, and active project tags."
  },
  {
    section: "Reports",
    targetId: "report-filters",
    title: "Reports",
    body: "Filter time and schedule data before reading cost, margin, and project performance."
  }
];
