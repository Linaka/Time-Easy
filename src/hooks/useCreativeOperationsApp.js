import { useEffect, useMemo, useState } from "react";
import { sumDurations } from "../timeUtils.js";
import {
  canAccessSection,
  canPerform,
  firstAccessibleSection,
  PERMISSIONS,
  resolveCurrentUser
} from "../domain/auth.js";
import {
  dateFromKey,
  getCurrentWeekDays,
  getLocalDateKey,
  getRollingWeekDays
} from "../domain/dateUtils.js";
import { DEFAULT_REPORT_FILTERS } from "../domain/appConfig.js";
import { createFreshWorkspace } from "../domain/workspaceSetup.js";
import { buildPagePropsBySection } from "../pages/pagePropsBySection.js";
import { trackClientEvent } from "../services/clientLogger.js";
import { useDesktopWorkspaceActions } from "./useDesktopWorkspaceActions.js";
import { useOnboardingController } from "./useOnboardingController.js";
import { useReportExportAction } from "./useReportExportAction.js";
import { useTimeTrackingController } from "./useTimeTrackingController.js";
import { useWorkspaceCommands } from "./useWorkspaceCommands.js";
import { useWorkspaceState } from "./useWorkspaceState.js";

export function useCreativeOperationsApp() {
  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const planningDays = useMemo(() => getRollingWeekDays(dateFromKey(todayKey)), [todayKey]);
  const [activeSection, setActiveSection] = useState("Time Tracker");
  const {
    activityItems,
    employmentGrades,
    entries,
    expenses,
    kioskSessions,
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
    setTeamMembers,
    setTimeOffRequests,
    setWorkspaceSettings,
    teamMembers,
    timeOffRequests,
    workspaceSettings
  } = useWorkspaceState(todayKey);
  const [activeUtility, setActiveUtility] = useState(null);
  const [reportFilters, setReportFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [statusMessage, setStatusMessage] = useState("Timer ready.");
  const currentUser = useMemo(() => resolveCurrentUser(teamMembers), [teamMembers]);

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== "Archived"),
    [projects]
  );
  const weeklyEntries = useMemo(
    () => entries.filter((entry) => weekDays.some((day) => day.dateKey === entry.dateKey)),
    [entries, weekDays]
  );
  const weeklyTotal = useMemo(() => sumDurations(weeklyEntries), [weeklyEntries]);
  const pendingApprovalCount = useMemo(
    () =>
      entries.filter((entry) => entry.approvalStatus === "Pending").length +
      expenses.filter((expense) => expense.status === "Pending").length +
      timeOffRequests.filter((request) => request.status === "Pending").length,
    [entries, expenses, timeOffRequests]
  );

  const commands = useWorkspaceCommands({
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
  });
  const onExportReportCsv = useReportExportAction({ setStatusMessage });
  const onboarding = useOnboardingController({
    currentUser,
    setActiveSection,
    setActiveUtility,
    setStatusMessage,
    setWorkspaceSettings,
    workspaceSettings
  });

  useEffect(() => {
    if (!canAccessSection(currentUser, activeSection)) {
      const nextSection = firstAccessibleSection(currentUser);
      setActiveSection(nextSection);
      setActiveUtility(null);
      setStatusMessage(`${nextSection} opened.`);
    }
  }, [activeSection, currentUser]);

  useEffect(() => {
    if (activeUtility === "Settings" && !canPerform(currentUser, PERMISSIONS.MANAGE_SETTINGS)) {
      setActiveUtility(null);
      setStatusMessage("Settings require owner access.");
    }
  }, [activeUtility, currentUser]);

  const timeTracking = useTimeTrackingController({
    activeProjects,
    addEntry: commands.addEntry,
    projects,
    setActiveSection,
    setStatusMessage,
    todayKey,
    workspaceSettings
  });

  function handleNavigate(section) {
    if (!canAccessSection(currentUser, section)) {
      setActiveUtility(null);
      setStatusMessage(`You do not have permission to open ${section}.`);
      trackClientEvent("navigation_blocked", { section });
      return false;
    }

    setActiveSection(section);
    setActiveUtility(null);
    setStatusMessage(`${section} opened.`);
    trackClientEvent("navigation", { section });
    return true;
  }

  function toggleUtility(utility) {
    if (utility === "Settings" && !canPerform(currentUser, PERMISSIONS.MANAGE_SETTINGS)) {
      setActiveUtility(null);
      setStatusMessage("Settings require owner access.");
      trackClientEvent("utility_blocked", { utility });
      return false;
    }

    setActiveUtility((currentUtility) => (currentUtility === utility ? null : utility));
    setStatusMessage(`${utility} panel ${activeUtility === utility ? "closed" : "opened"}.`);
    trackClientEvent("utility_toggle", { utility });
    return true;
  }

  function updateWorkspaceSetting(settingKey, value) {
    setWorkspaceSettings((currentSettings) => ({
      ...currentSettings,
      [settingKey]: value
    }));
    if (settingKey === "defaultBillable" && !timeTracking.isRunning) {
      timeTracking.setBillable(value);
    }
    setStatusMessage("Workspace setting updated.");
  }

  function clearDemoDataForFreshSetup() {
    const confirmed =
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      window.confirm(
        "Clear demo data and start fresh? This removes current projects, time entries, expenses, schedules, approvals, kiosks, dependencies, and activity."
      );

    if (!confirmed) {
      setStatusMessage("Fresh setup cancelled.");
      return false;
    }

    const freshWorkspace = createFreshWorkspace();
    setProjects(freshWorkspace.projects);
    setTeamMembers(freshWorkspace.teamMembers);
    setEmploymentGrades(freshWorkspace.employmentGrades);
    setEntries(freshWorkspace.entries);
    setExpenses(freshWorkspace.expenses);
    setTimeOffRequests(freshWorkspace.timeOffRequests);
    setScheduleItems(freshWorkspace.scheduleItems);
    setProjectDependencies(freshWorkspace.projectDependencies);
    setKioskSessions(freshWorkspace.kioskSessions);
    setActivityItems(freshWorkspace.activityItems);
    setWorkspaceSettings(freshWorkspace.workspaceSettings);
    setReportFilters(DEFAULT_REPORT_FILTERS);
    timeTracking.resetDrafts({
      defaultBillable: freshWorkspace.workspaceSettings.defaultBillable,
      nextProjectId: freshWorkspace.projects[0]?.id
    });
    setActiveSection("Time Tracker");
    setActiveUtility(null);
    setStatusMessage("Demo data cleared. Fresh setup is ready.");
    trackClientEvent("workspace_reset", { mode: "fresh_setup" });
    return true;
  }

  useDesktopWorkspaceActions({
    activeProjects,
    activityItems,
    addActivity: commands.addActivity,
    addEntries: commands.addEntries,
    employmentGrades,
    entries,
    expenses,
    kioskSessions,
    projectDependencies,
    projects,
    reportFilters,
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
    setWorkspaceSettings,
    teamMembers,
    timeOffRequests,
    todayKey,
    workspaceSettings
  });

  const pagePropsBySection = buildPagePropsBySection({
    activeProjects,
    activityItems,
    employmentGrades,
    entries,
    expenses,
    handleNavigate,
    kioskSessions,
    onExportReportCsv,
    pendingApprovalCount,
    planningDays,
    projectDependencies,
    projects,
    reportFilters,
    scheduleItems,
    setReportFilters,
    teamMembers,
    timeOffRequests,
    timeTracking,
    todayKey,
    weekDays,
    weeklyEntries,
    weeklyTotal,
    ...commands
  });

  return {
    activeSection,
    activeUtility,
    activeProjects,
    currentUser,
    employmentGrades,
    guidanceStep: onboarding.guidanceStep,
    guidanceStepCount: onboarding.guidanceStepCount,
    guidanceStepIndex: onboarding.guidanceStepIndex,
    handleDeclineGuidance: onboarding.handleDeclineGuidance,
    handleNavigate,
    handleNextGuidance: onboarding.handleNextGuidance,
    handlePreviousGuidance: onboarding.handlePreviousGuidance,
    handleQuickClockToggle: timeTracking.handleQuickClockToggle,
    handleSkipGuidance: onboarding.handleSkipGuidance,
    handleStartGuidance: onboarding.handleStartGuidance,
    onClearDemoData: clearDemoDataForFreshSetup,
    pagePropsBySection,
    pendingApprovalCount,
    quickDescription: timeTracking.quickDescription,
    quickProjectId: timeTracking.quickProjectId,
    quickRunning: timeTracking.quickRunning,
    quickSeconds: timeTracking.quickSeconds,
    setActiveUtility,
    setQuickDescription: timeTracking.setQuickDescription,
    setQuickProjectId: timeTracking.setQuickProjectId,
    showOnboardingPrompt: onboarding.showOnboardingPrompt,
    statusMessage,
    toggleUtility,
    updateWorkspaceSetting,
    weeklyTotal,
    workspaceSettings
  };
}
