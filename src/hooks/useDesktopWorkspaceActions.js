import { useEffect, useRef } from "react";
import { buildTimesheetCsvImportResult } from "../domain/desktopTimesheetImport.js";
import { buildReportCsv, buildReportData } from "../domain/reportCsv.js";
import {
  createWorkspaceBackup,
  formatWorkspaceMergeSummary,
  mergeWorkspaceBackup,
  parseWorkspaceBackupText
} from "../domain/workspaceBackup.js";
import {
  confirmDesktopAction,
  openTextFile,
  saveTextFile,
  setupDesktopMenu,
  showDesktopMessage
} from "../services/desktopBridge.js";

export function useDesktopWorkspaceActions({
  activeProjects,
  activityItems,
  addActivity,
  addEntries,
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
}) {
  const desktopHandlersRef = useRef({});

  function getWorkspaceSnapshot() {
    return {
      activityItems,
      employmentGrades,
      entries,
      expenses,
      kioskSessions,
      projectDependencies,
      projects,
      scheduleItems,
      teamMembers,
      timeOffRequests,
      workspaceSettings
    };
  }

  function applyMergedWorkspace(workspace) {
    setActivityItems(workspace.activityItems);
    setEmploymentGrades(workspace.employmentGrades);
    setEntries(workspace.entries);
    setExpenses(workspace.expenses);
    setKioskSessions(workspace.kioskSessions);
    setProjectDependencies(workspace.projectDependencies);
    setProjects(workspace.projects);
    setScheduleItems(workspace.scheduleItems);
    setTeamMembers(workspace.teamMembers);
    setTimeOffRequests(workspace.timeOffRequests);
    setWorkspaceSettings(workspace.workspaceSettings);
  }

  async function exportWorkspaceBackup() {
    try {
      const backupText = JSON.stringify(createWorkspaceBackup(getWorkspaceSnapshot()), null, 2);
      const path = await saveTextFile({
        title: "Export Workspace Backup",
        defaultPath: `creative-operations-workspace-${todayKey}.json`,
        filters: [{ name: "Workspace Backup", extensions: ["json"] }],
        text: backupText
      });

      if (path) {
        setStatusMessage("Workspace backup exported.");
      }
    } catch (error) {
      const message = error?.message || "Workspace backup could not be exported.";
      setStatusMessage(message);
      await showDesktopMessage(message, { kind: "error" });
    }
  }

  async function importWorkspaceBackup() {
    try {
      const selectedFile = await openTextFile({
        title: "Import Workspace Backup",
        filters: [{ name: "Workspace Backup", extensions: ["json"] }]
      });

      if (!selectedFile) {
        return;
      }

      const backup = parseWorkspaceBackupText(selectedFile.text);
      const shouldMerge = await confirmDesktopAction(
        "Merge this workspace backup into the current workspace? Existing records will be kept."
      );

      if (!shouldMerge) {
        setStatusMessage("Workspace backup import canceled.");
        return;
      }

      const { stats, workspace } = mergeWorkspaceBackup(getWorkspaceSnapshot(), backup);
      applyMergedWorkspace(workspace);
      addActivity("Workspace", "Merged workspace backup");
      setStatusMessage(formatWorkspaceMergeSummary(stats));
    } catch (error) {
      const message = error?.message || "Workspace backup could not be imported.";
      setStatusMessage(message);
      await showDesktopMessage(message, { kind: "error" });
    }
  }

  async function importTimesheetCsv() {
    try {
      const selectedFile = await openTextFile({
        title: "Import Timesheet CSV",
        filters: [{ name: "CSV", extensions: ["csv"] }]
      });

      if (!selectedFile) {
        return;
      }

      const result = buildTimesheetCsvImportResult({
        csvText: selectedFile.text,
        projects: activeProjects,
        teamMembers
      });

      if (!result.previewRows.length) {
        setStatusMessage("No importable rows found. Include a header row and at least one timesheet row.");
        return;
      }

      if (result.entryDrafts.length) {
        addEntries(result.entryDrafts, "Imported native timesheet CSV");
      }

      setStatusMessage(
        `Timesheet CSV import complete: ${result.importedCount} rows imported, ${result.skippedCount} skipped.`
      );
    } catch (error) {
      const message = error?.message || "Timesheet CSV could not be imported.";
      setStatusMessage(message);
      await showDesktopMessage(message, { kind: "error" });
    }
  }

  async function exportReportCsv() {
    try {
      const reportData = buildReportData({
        entries,
        projects,
        teamMembers,
        employmentGrades,
        scheduleItems,
        filters: reportFilters
      });
      const path = await saveTextFile({
        title: "Export Report CSV",
        defaultPath: "timetrackr-report.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
        text: buildReportCsv(reportData)
      });

      if (path) {
        setStatusMessage("CSV report exported.");
      }
    } catch (error) {
      const message = error?.message || "CSV report could not be exported.";
      setStatusMessage(message);
      await showDesktopMessage(message, { kind: "error" });
    }
  }

  desktopHandlersRef.current = {
    exportReportCsv,
    exportWorkspaceBackup,
    importTimesheetCsv,
    importWorkspaceBackup
  };

  useEffect(() => {
    let cleanup = () => {};
    let isDisposed = false;

    setupDesktopMenu({
      onExportReportCsv: () => desktopHandlersRef.current.exportReportCsv?.(),
      onExportWorkspaceBackup: () => desktopHandlersRef.current.exportWorkspaceBackup?.(),
      onImportTimesheetCsv: () => desktopHandlersRef.current.importTimesheetCsv?.(),
      onImportWorkspaceBackup: () => desktopHandlersRef.current.importWorkspaceBackup?.()
    })
      .then((nextCleanup) => {
        if (isDisposed) {
          nextCleanup();
          return;
        }
        cleanup = nextCleanup;
      })
      .catch((error) => {
        console.error("[desktop-menu]", error);
        setStatusMessage("Desktop menu could not be installed.");
      });

    return () => {
      isDisposed = true;
      cleanup();
    };
  }, [setStatusMessage]);
}
