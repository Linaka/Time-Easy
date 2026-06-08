import { useCallback, useEffect, useMemo } from "react";
import {
  DEFAULT_WORKSPACE_FEATURES,
  DEFAULT_EMPLOYMENT_GRADES,
  DEFAULT_WORKSPACE_SETTINGS,
  STORAGE_PREFIX,
  normalizeWorkspaceSettings
} from "../domain/appConfig.js";
import {
  createInitialActivity,
  createInitialDependencies,
  createInitialEntries,
  createInitialExpenses,
  createInitialKiosks,
  createInitialProjects,
  createInitialSchedule,
  createInitialTeamMembers,
  createInitialTimeOff
} from "../domain/seedData.js";
import { ensureWorkspaceOwner } from "../domain/auth.js";
import { usePersistentState } from "./usePersistentState.js";
import { useSharedWorkspacePersistence } from "./useSharedWorkspacePersistence.js";

export function useWorkspaceState(todayKey) {
  const [projects, setProjects] = usePersistentState(
    `${STORAGE_PREFIX}.projects`,
    createInitialProjects
  );
  const [teamMembers, setTeamMembers] = usePersistentState(
    `${STORAGE_PREFIX}.team`,
    createInitialTeamMembers
  );
  const [employmentGrades, setEmploymentGrades] = usePersistentState(
    `${STORAGE_PREFIX}.grades`,
    () => DEFAULT_EMPLOYMENT_GRADES
  );
  const [entries, setEntries] = usePersistentState(`${STORAGE_PREFIX}.entries`, () =>
    createInitialEntries(todayKey)
  );
  const [expenses, setExpenses] = usePersistentState(`${STORAGE_PREFIX}.expenses`, () =>
    createInitialExpenses(todayKey)
  );
  const [timeOffRequests, setTimeOffRequests] = usePersistentState(
    `${STORAGE_PREFIX}.timeOff`,
    () => createInitialTimeOff(todayKey)
  );
  const [scheduleItems, setScheduleItems] = usePersistentState(
    `${STORAGE_PREFIX}.schedule`,
    () => createInitialSchedule(todayKey)
  );
  const [projectDependencies, setProjectDependencies] = usePersistentState(
    `${STORAGE_PREFIX}.dependencies`,
    createInitialDependencies
  );
  const [kioskSessions, setKioskSessions] = usePersistentState(
    `${STORAGE_PREFIX}.kiosks`,
    () => createInitialKiosks(todayKey)
  );
  const [activityItems, setActivityItems] = usePersistentState(
    `${STORAGE_PREFIX}.activity`,
    createInitialActivity
  );
  const [storedWorkspaceSettings, setWorkspaceSettings] = usePersistentState(
    `${STORAGE_PREFIX}.settings`,
    () => normalizeWorkspaceSettings(DEFAULT_WORKSPACE_SETTINGS)
  );
  const workspaceSettings = useMemo(
    () => normalizeWorkspaceSettings(storedWorkspaceSettings),
    [storedWorkspaceSettings]
  );

  useEffect(() => {
    const missingDefaultSetting = Object.keys(DEFAULT_WORKSPACE_SETTINGS).some(
      (settingKey) => storedWorkspaceSettings?.[settingKey] === undefined
    );
    const missingFeatureSetting = Object.keys(DEFAULT_WORKSPACE_FEATURES).some(
      (featureKey) => storedWorkspaceSettings?.features?.[featureKey] === undefined
    );

    if (!missingDefaultSetting && !missingFeatureSetting) {
      return;
    }

    setWorkspaceSettings((currentSettings) => normalizeWorkspaceSettings(currentSettings));
  }, [setWorkspaceSettings, storedWorkspaceSettings]);

  useEffect(() => {
    const nextTeamMembers = ensureWorkspaceOwner(teamMembers);
    if (nextTeamMembers !== teamMembers) {
      setTeamMembers(nextTeamMembers);
    }
  }, [setTeamMembers, teamMembers]);

  const workspaceSnapshot = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
  const applyWorkspaceSnapshot = useCallback(
    (nextWorkspace) => {
      setActivityItems(nextWorkspace.activityItems);
      setEmploymentGrades(nextWorkspace.employmentGrades);
      setEntries(nextWorkspace.entries);
      setExpenses(nextWorkspace.expenses);
      setKioskSessions(nextWorkspace.kioskSessions);
      setProjectDependencies(nextWorkspace.projectDependencies);
      setProjects(nextWorkspace.projects);
      setScheduleItems(nextWorkspace.scheduleItems);
      setTeamMembers(nextWorkspace.teamMembers);
      setTimeOffRequests(nextWorkspace.timeOffRequests);
      setWorkspaceSettings(nextWorkspace.workspaceSettings);
    },
    [
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
      setWorkspaceSettings
    ]
  );

  useSharedWorkspacePersistence({
    onWorkspaceChange: applyWorkspaceSnapshot,
    workspace: workspaceSnapshot
  });

  return {
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
  };
}
