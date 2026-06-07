import { useEffect, useMemo } from "react";
import {
  DEFAULT_EMPLOYMENT_GRADES,
  DEFAULT_WORKSPACE_SETTINGS,
  STORAGE_PREFIX
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
import { usePersistentState } from "./usePersistentState.js";

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
    () => DEFAULT_WORKSPACE_SETTINGS
  );
  const workspaceSettings = useMemo(
    () => ({
      ...DEFAULT_WORKSPACE_SETTINGS,
      ...(storedWorkspaceSettings && typeof storedWorkspaceSettings === "object"
        ? storedWorkspaceSettings
        : {})
    }),
    [storedWorkspaceSettings]
  );

  useEffect(() => {
    const missingDefaultSetting = Object.keys(DEFAULT_WORKSPACE_SETTINGS).some(
      (settingKey) => storedWorkspaceSettings?.[settingKey] === undefined
    );

    if (!missingDefaultSetting) {
      return;
    }

    setWorkspaceSettings((currentSettings) => ({
      ...DEFAULT_WORKSPACE_SETTINGS,
      ...(currentSettings && typeof currentSettings === "object" ? currentSettings : {})
    }));
  }, [setWorkspaceSettings, storedWorkspaceSettings]);

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
