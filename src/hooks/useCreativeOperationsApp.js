import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatDuration,
  isSafeDisplayText,
  parseDurationInput,
  sumDurations
} from "../timeUtils.js";
import { DEFAULT_EMPLOYMENT_GRADES, STORAGE_PREFIX } from "../domain/appConfig.js";
import {
  formatClockTime,
  formatReadableDate,
  getCurrentWeekDays,
  getLocalDateKey
} from "../domain/dateUtils.js";
import { currency } from "../domain/formatters.js";
import { parseTags, slugify, validatePlainFields } from "../domain/formUtils.js";
import {
  getEmploymentGrade,
  memberName,
  projectName
} from "../domain/projectUtils.js";
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

export function useCreativeOperationsApp() {
  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const [activeSection, setActiveSection] = useState("Time Tracker");
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
  const [workspaceSettings, setWorkspaceSettings] = usePersistentState(
    `${STORAGE_PREFIX}.settings`,
    () => ({
      requireApprovals: true,
      defaultBillable: false,
      compactTables: false
    })
  );
  const [activeUtility, setActiveUtility] = useState(null);
  const [description, setDescription] = useState("");
  const [tagText, setTagText] = useState("");
  const [projectId, setProjectId] = useState("acme");
  const [billable, setBillable] = useState(workspaceSettings.defaultBillable);
  const [isRunning, setIsRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualDate, setManualDate] = useState(todayKey);
  const [manualDuration, setManualDuration] = useState("1:00");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Timer ready.");
  const [quickDescription, setQuickDescription] = useState("Quick work");
  const [quickProjectId, setQuickProjectId] = useState("acme");
  const [quickRunning, setQuickRunning] = useState(false);
  const [quickStartedAt, setQuickStartedAt] = useState(null);
  const [quickSeconds, setQuickSeconds] = useState(0);
  const descriptionRef = useRef(null);

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

  useEffect(() => {
    if (!isRunning || !startedAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, startedAt]);

  useEffect(() => {
    if (!activeProjects.some((project) => project.id === projectId) && activeProjects[0]) {
      setProjectId(activeProjects[0].id);
    }
  }, [activeProjects, projectId]);

  useEffect(() => {
    if (!activeProjects.some((project) => project.id === quickProjectId) && activeProjects[0]) {
      setQuickProjectId(activeProjects[0].id);
    }
  }, [activeProjects, quickProjectId]);

  useEffect(() => {
    if (!quickRunning || !quickStartedAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setQuickSeconds(Math.floor((Date.now() - quickStartedAt.getTime()) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [quickRunning, quickStartedAt]);

  function addActivity(type, descriptionText) {
    const nextActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      description: descriptionText,
      actor: "You",
      timestamp: new Date().toISOString()
    };
    setActivityItems((currentItems) => [nextActivity, ...currentItems].slice(0, 80));
  }

  function validateTaskEntry(taskDescription = description, tags = tagText) {
    const trimmedDescription = taskDescription.trim();

    if (!trimmedDescription) {
      return "Add a task description before saving time.";
    }

    if (!isSafeDisplayText(trimmedDescription) || !isSafeDisplayText(tags)) {
      return "Script-like text is blocked for safety. Please enter plain text.";
    }

    return "";
  }

  function addEntry(entryDraft, activityLabel = "Added a time entry") {
    const nextEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      dateKey: todayKey,
      memberId: "ava",
      tags: [],
      billable: false,
      approvalStatus: workspaceSettings.requireApprovals ? "Pending" : "Approved",
      timeRange: "Manual",
      source: "Manual",
      ...entryDraft
    };

    setEntries((currentEntries) => [nextEntry, ...currentEntries]);
    addActivity("Time", `${activityLabel}: ${nextEntry.description}`);
    setStatusMessage(`${nextEntry.description} saved for ${formatDuration(nextEntry.durationSeconds)}.`);
  }

  function addEntries(entryDrafts, activityLabel = "Imported timesheet") {
    const nextEntries = entryDrafts.map((entryDraft, index) => ({
      id: `entry-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      dateKey: todayKey,
      memberId: "ava",
      tags: [],
      billable: false,
      approvalStatus: workspaceSettings.requireApprovals ? "Pending" : "Approved",
      timeRange: "Timesheet import",
      source: "Timesheet import",
      ...entryDraft
    }));

    setEntries((currentEntries) => [...nextEntries, ...currentEntries]);
    addActivity("Timesheet", `${activityLabel}: ${nextEntries.length} rows`);
    setStatusMessage(`${nextEntries.length} timesheet rows imported.`);
  }

  function updateEntry(entryId, entryPatch) {
    const validationError = validatePlainFields([
      entryPatch.description,
      Array.isArray(entryPatch.tags) ? entryPatch.tags.join(", ") : ""
    ]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    setEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === entryId ? { ...entry, ...entryPatch } : entry))
    );
    addActivity("Calendar", `Updated time entry ${entryPatch.description || "time"}`);
    setStatusMessage("Calendar time entry updated.");
    return true;
  }

  function updateScheduleItem(scheduleId, itemPatch) {
    const validationError = validatePlainFields([itemPatch.location]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    setScheduleItems((currentItems) =>
      currentItems.map((item) => (item.id === scheduleId ? { ...item, ...itemPatch } : item))
    );
    addActivity("Calendar", "Updated scheduled work block");
    setStatusMessage("Calendar schedule block updated.");
    return true;
  }

  function moveScheduleItemToProject(scheduleId, nextProjectId, nextDateKey) {
    const scheduleItem = scheduleItems.find((item) => item.id === scheduleId);
    const nextProject = projects.find((project) => project.id === nextProjectId);
    const safeNextDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(nextDateKey || ""))
      ? nextDateKey
      : scheduleItem?.dateKey;

    if (!scheduleItem || !nextProject || !safeNextDateKey) {
      setStatusMessage("Schedule assignment could not be moved.");
      return false;
    }

    if (scheduleItem.projectId === nextProjectId && scheduleItem.dateKey === safeNextDateKey) {
      setStatusMessage(`${memberName(scheduleItem.memberId, teamMembers)} is already on ${nextProject.name}.`);
      return true;
    }

    setScheduleItems((currentItems) =>
      currentItems.map((item) =>
        item.id === scheduleId ? { ...item, projectId: nextProjectId, dateKey: safeNextDateKey } : item
      )
    );
    addActivity(
      "Schedule",
      `${memberName(scheduleItem.memberId, teamMembers)} moved from ${projectName(scheduleItem.projectId, projects)} to ${nextProject.name} on ${formatReadableDate(safeNextDateKey)}`
    );
    setStatusMessage(`${memberName(scheduleItem.memberId, teamMembers)} moved to ${nextProject.name} on ${formatReadableDate(safeNextDateKey)}.`);
    return true;
  }

  function addProjectDependency(dependencyDraft) {
    const validationError = validatePlainFields([dependencyDraft.label]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const fromProject = projects.find((project) => project.id === dependencyDraft.fromProjectId);
    const toProject = projects.find((project) => project.id === dependencyDraft.toProjectId);
    if (!fromProject || !toProject) {
      setStatusMessage("Choose two valid projects for the dependency.");
      return false;
    }

    if (fromProject.id === toProject.id) {
      setStatusMessage("A project cannot depend on itself.");
      return false;
    }

    const alreadyExists = projectDependencies.some(
      (dependency) =>
        dependency.fromProjectId === fromProject.id && dependency.toProjectId === toProject.id
    );
    if (alreadyExists) {
      setStatusMessage("That dependency already exists.");
      return false;
    }

    const nextDependency = {
      id: `dependency-${Date.now()}`,
      fromProjectId: fromProject.id,
      toProjectId: toProject.id,
      label: dependencyDraft.label.trim() || "Finish before starting"
    };

    setProjectDependencies((currentDependencies) => [nextDependency, ...currentDependencies]);
    addActivity("Schedule", `Linked ${fromProject.name} before ${toProject.name}`);
    setStatusMessage("Project dependency added.");
    return true;
  }

  function deleteProjectDependency(dependencyId) {
    const dependency = projectDependencies.find((item) => item.id === dependencyId);
    if (!dependency) {
      setStatusMessage("Dependency was not found.");
      return false;
    }

    setProjectDependencies((currentDependencies) =>
      currentDependencies.filter((item) => item.id !== dependencyId)
    );
    addActivity(
      "Schedule",
      `Removed dependency ${projectName(dependency.fromProjectId, projects)} to ${projectName(dependency.toProjectId, projects)}`
    );
    setStatusMessage("Project dependency removed.");
    return true;
  }

  function handleQuickClockToggle() {
    if (quickRunning) {
      const now = new Date();
      const trimmedDescription = quickDescription.trim() || "Quick work";
      if (!isSafeDisplayText(trimmedDescription)) {
        setStatusMessage("Script-like text is blocked for safety. Please enter plain text.");
        return;
      }

      addEntry(
        {
          dateKey: todayKey,
          description: trimmedDescription,
          projectId: quickProjectId,
          tags: ["Quick"],
          billable: workspaceSettings.defaultBillable,
          timeRange: `${formatClockTime(quickStartedAt || now)} - ${formatClockTime(now)}`,
          durationSeconds: Math.max(60, quickSeconds),
          source: "Quick clock"
        },
        "Saved quick clock"
      );
      setQuickRunning(false);
      setQuickStartedAt(null);
      setQuickSeconds(0);
      setQuickDescription("Quick work");
      return;
    }

    const trimmedDescription = quickDescription.trim() || "Quick work";
    if (!isSafeDisplayText(trimmedDescription)) {
      setStatusMessage("Script-like text is blocked for safety. Please enter plain text.");
      return;
    }

    setQuickDescription(trimmedDescription);
    setQuickStartedAt(new Date());
    setQuickSeconds(0);
    setQuickRunning(true);
    setStatusMessage(`Quick clock started for ${trimmedDescription}.`);
  }

  function handleStartStop() {
    if (isRunning) {
      stopAndSaveTimer();
      return;
    }

    const validationError = validateTaskEntry();
    if (validationError) {
      setError(validationError);
      setStatusMessage(validationError);
      descriptionRef.current?.focus();
      return;
    }

    const now = new Date();
    setStartedAt(now);
    setTimerSeconds(0);
    setIsRunning(true);
    setError("");
    setStatusMessage(`Timer started for ${description.trim()}.`);
  }

  function stopAndSaveTimer() {
    const validationError = validateTaskEntry();
    if (validationError) {
      setError(validationError);
      setStatusMessage(validationError);
      descriptionRef.current?.focus();
      return;
    }

    const now = new Date();
    const durationSeconds = Math.max(60, timerSeconds);
    addEntry(
      {
        dateKey: todayKey,
        description: description.trim(),
        projectId,
        tags: parseTags(tagText),
        billable,
        timeRange: `${formatClockTime(startedAt || now)} - ${formatClockTime(now)}`,
        durationSeconds,
        source: "Timer"
      },
      "Saved timer"
    );

    setIsRunning(false);
    setStartedAt(null);
    setTimerSeconds(0);
    setDescription("");
    setTagText("");
    setBillable(workspaceSettings.defaultBillable);
    setError("");
  }

  function handleManualSave() {
    const validationError = validateTaskEntry();
    const durationSeconds = parseDurationInput(manualDuration);

    if (validationError) {
      setError(validationError);
      setStatusMessage(validationError);
      descriptionRef.current?.focus();
      return;
    }

    if (!durationSeconds) {
      setError("Enter a duration as minutes or hours:minutes, such as 90 or 1:30.");
      setStatusMessage("Manual duration is invalid.");
      return;
    }

    addEntry(
      {
        dateKey: manualDate,
        description: description.trim(),
        projectId,
        tags: parseTags(tagText),
        billable,
        timeRange: "Manual",
        durationSeconds,
        source: "Manual"
      },
      "Added manual time"
    );

    setDescription("");
    setTagText("");
    setManualDuration("1:00");
    setError("");
  }

  function restartFromEntry(entry) {
    const project = projects.find((item) => item.id === entry.projectId) || activeProjects[0];

    setActiveSection("Time Tracker");
    setDescription(entry.description);
    setProjectId(project?.id || "acme");
    setTagText(entry.tags.join(", "));
    setBillable(entry.billable);
    setIsRunning(false);
    setStartedAt(null);
    setTimerSeconds(0);
    setError("");
    setStatusMessage(`Loaded ${entry.description}. Press START to begin a similar timer.`);
    window.setTimeout(() => descriptionRef.current?.focus(), 0);
  }

  function addProject(projectDraft) {
    const validationError = validatePlainFields([
      projectDraft.name,
      projectDraft.client,
      projectDraft.tagText
    ]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextProject = {
      id: `${slugify(projectDraft.name)}-${Date.now()}`,
      status: "Active",
      ...projectDraft,
      tags: parseTags(projectDraft.tagText),
      tagText: undefined,
      budgetHours: Number(projectDraft.budgetHours) || 0,
      hourlyRate: Number(projectDraft.hourlyRate) || 0
    };
    setProjects((currentProjects) => [nextProject, ...currentProjects]);
    addActivity("Projects", `Created project ${nextProject.name}`);
    setStatusMessage(`${nextProject.name} created.`);
    return true;
  }

  function updateProjectStatus(targetProjectId, nextStatus) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === targetProjectId ? { ...project, status: nextStatus } : project
      )
    );
    addActivity("Projects", `${projectName(targetProjectId, projects)} marked ${nextStatus}`);
    setStatusMessage(`Project marked ${nextStatus}.`);
  }

  function updateProjectTags(targetProjectId, tagTextValue) {
    const validationError = validatePlainFields([tagTextValue]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === targetProjectId ? { ...project, tags: parseTags(tagTextValue) } : project
      )
    );
    addActivity("Projects", `${projectName(targetProjectId, projects)} tags updated`);
    setStatusMessage("Project tags updated.");
    return true;
  }

  function addTeamMember(memberDraft) {
    const validationError = validatePlainFields([memberDraft.name, memberDraft.email, memberDraft.role]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextMember = {
      id: `${slugify(memberDraft.name)}-${Date.now()}`,
      status: "Active",
      ...memberDraft,
      capacityHours: Number(memberDraft.capacityHours) || 40
    };
    setTeamMembers((currentMembers) => [nextMember, ...currentMembers]);
    addActivity("Team", `Added ${nextMember.name} to the workspace`);
    setStatusMessage(`${nextMember.name} added to the team.`);
    return true;
  }

  function updateMemberStatus(memberId, nextStatus) {
    setTeamMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, status: nextStatus } : member
      )
    );
    addActivity("Team", `${memberName(memberId, teamMembers)} marked ${nextStatus}`);
    setStatusMessage(`Team member marked ${nextStatus}.`);
  }

  function deleteTeamMember(memberId) {
    const member = teamMembers.find((currentMember) => currentMember.id === memberId);
    if (!member) {
      setStatusMessage("Team member was not found.");
      return false;
    }

    setTeamMembers((currentMembers) =>
      currentMembers.filter((currentMember) => currentMember.id !== memberId)
    );
    addActivity("Team", `Deleted ${member.name} from the workspace`);
    setStatusMessage(`${member.name} deleted. Historical records remain available as Unassigned.`);
    return true;
  }

  function updateEmploymentGrade(gradeId, gradePatch) {
    const validationError = validatePlainFields([gradePatch.title, gradePatch.description]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextGrades = employmentGrades.map((grade) =>
      grade.id === gradeId
        ? {
            ...grade,
            ...gradePatch,
            hourlyRate: Number(gradePatch.hourlyRate) || 0
          }
        : grade
    );
    const hasIncreasingRates = nextGrades.every(
      (grade, index) => index === 0 || Number(grade.hourlyRate) > Number(nextGrades[index - 1].hourlyRate)
    );
    if (!hasIncreasingRates) {
      setStatusMessage("Employment grade rates must increase from Grade 1 through Grade 4.");
      return false;
    }

    setEmploymentGrades(nextGrades);
    addActivity("Team", `${getEmploymentGrade(gradeId, employmentGrades).label} updated`);
    setStatusMessage("Employment grade updated.");
    return true;
  }

  function addExpense(expenseDraft) {
    const validationError = validatePlainFields([expenseDraft.merchant, expenseDraft.note]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextExpense = {
      id: `expense-${Date.now()}`,
      status: "Pending",
      submittedBy: "ava",
      ...expenseDraft,
      amount: Number(expenseDraft.amount) || 0
    };
    setExpenses((currentExpenses) => [nextExpense, ...currentExpenses]);
    addActivity("Expenses", `Submitted ${currency(nextExpense.amount)} expense for ${nextExpense.merchant}`);
    setStatusMessage(`Expense for ${nextExpense.merchant} submitted.`);
    return true;
  }

  function updateExpenseStatus(expenseId, nextStatus) {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === expenseId ? { ...expense, status: nextStatus } : expense
      )
    );
    addActivity("Approvals", `Expense ${nextStatus.toLowerCase()}`);
    setStatusMessage(`Expense ${nextStatus.toLowerCase()}.`);
  }

  function addTimeOffRequest(requestDraft) {
    const validationError = validatePlainFields([requestDraft.note]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextRequest = {
      id: `timeoff-${Date.now()}`,
      status: "Pending",
      ...requestDraft,
      days: Number(requestDraft.days) || 1
    };
    setTimeOffRequests((currentRequests) => [nextRequest, ...currentRequests]);
    addActivity("Time Off", `${memberName(nextRequest.memberId, teamMembers)} requested time off`);
    setStatusMessage("Time off request submitted.");
    return true;
  }

  function updateTimeOffStatus(requestId, nextStatus) {
    setTimeOffRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status: nextStatus } : request
      )
    );
    addActivity("Approvals", `Time off request ${nextStatus.toLowerCase()}`);
    setStatusMessage(`Time off request ${nextStatus.toLowerCase()}.`);
  }

  function addScheduleItem(itemDraft) {
    const validationError = validatePlainFields([itemDraft.location]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextItem = {
      id: `schedule-${Date.now()}`,
      status: "Planned",
      ...itemDraft
    };
    setScheduleItems((currentItems) => [nextItem, ...currentItems]);
    addActivity("Schedule", `Scheduled ${memberName(nextItem.memberId, teamMembers)}`);
    setStatusMessage("Schedule item added.");
    return true;
  }

  function updateScheduleStatus(scheduleId, nextStatus) {
    setScheduleItems((currentItems) =>
      currentItems.map((item) => (item.id === scheduleId ? { ...item, status: nextStatus } : item))
    );
    addActivity("Schedule", `Schedule item marked ${nextStatus}`);
    setStatusMessage(`Schedule item marked ${nextStatus}.`);
  }

  function clockInKiosk(sessionDraft) {
    const nextSession = {
      id: `kiosk-${Date.now()}`,
      status: "Active",
      startedAt: new Date().toISOString(),
      endedAt: null,
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      ...sessionDraft
    };
    setKioskSessions((currentSessions) => [nextSession, ...currentSessions]);
    addActivity("Kiosks", `${memberName(nextSession.memberId, teamMembers)} clocked in`);
    setStatusMessage(`${memberName(nextSession.memberId, teamMembers)} clocked in.`);
  }

  function clockOutKiosk(sessionId) {
    setKioskSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: "Completed",
              endedAt: new Date().toISOString()
            }
          : session
      )
    );
    addActivity("Kiosks", "Kiosk session clocked out");
    setStatusMessage("Kiosk session clocked out.");
  }

  function updateEntryApproval(entryId, nextStatus) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, approvalStatus: nextStatus } : entry
      )
    );
    addActivity("Approvals", `Time entry ${nextStatus.toLowerCase()}`);
    setStatusMessage(`Time entry ${nextStatus.toLowerCase()}.`);
  }

  function addActivityNote(note) {
    const validationError = validatePlainFields([note]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }
    addActivity("Note", note.trim());
    setStatusMessage("Activity note added.");
    return true;
  }

  function clearActivity() {
    setActivityItems([]);
    setStatusMessage("Activity log cleared.");
  }

  function handleNavigate(section) {
    setActiveSection(section);
    setActiveUtility(null);
    setStatusMessage(`${section} opened.`);
  }

  function toggleUtility(utility) {
    setActiveUtility((currentUtility) => (currentUtility === utility ? null : utility));
    setStatusMessage(`${utility} panel ${activeUtility === utility ? "closed" : "opened"}.`);
  }

  function updateWorkspaceSetting(settingKey, value) {
    setWorkspaceSettings((currentSettings) => ({
      ...currentSettings,
      [settingKey]: value
    }));
    if (settingKey === "defaultBillable" && !isRunning) {
      setBillable(value);
    }
    setStatusMessage("Workspace setting updated.");
  }

  const commonProps = {
    entries,
    projects,
    activeProjects,
    teamMembers,
    employmentGrades,
    workspaceSettings,
    expenses,
    timeOffRequests,
    scheduleItems,
    projectDependencies,
    kioskSessions,
    activityItems,
    weekDays,
    todayKey,
    weeklyEntries,
    weeklyTotal,
    pendingApprovalCount,
    onNavigate: handleNavigate,
    onAddEntry: addEntry,
    onAddEntries: addEntries,
    onRestartEntry: restartFromEntry,
    onUpdateEntry: updateEntry,
    onAddProject: addProject,
    onProjectStatusChange: updateProjectStatus,
    onProjectTagsChange: updateProjectTags,
    onAddTeamMember: addTeamMember,
    onMemberStatusChange: updateMemberStatus,
    onDeleteTeamMember: deleteTeamMember,
    onEmploymentGradeChange: updateEmploymentGrade,
    onAddExpense: addExpense,
    onExpenseStatusChange: updateExpenseStatus,
    onAddTimeOff: addTimeOffRequest,
    onTimeOffStatusChange: updateTimeOffStatus,
    onAddSchedule: addScheduleItem,
    onUpdateSchedule: updateScheduleItem,
    onScheduleStatusChange: updateScheduleStatus,
    onMoveScheduleProject: moveScheduleItemToProject,
    onAddDependency: addProjectDependency,
    onDeleteDependency: deleteProjectDependency,
    onClockIn: clockInKiosk,
    onClockOut: clockOutKiosk,
    onEntryApprovalChange: updateEntryApproval,
    onAddActivityNote: addActivityNote,
    onClearActivity: clearActivity,
    setStatusMessage
  };

  return {
    activeSection,
    activeUtility,
    activeProjects,
    billable,
    commonProps,
    description,
    descriptionRef,
    employmentGrades,
    error,
    handleManualSave,
    handleNavigate,
    handleQuickClockToggle,
    handleStartStop,
    isRunning,
    manualDate,
    manualDuration,
    manualMode,
    pendingApprovalCount,
    projectId,
    quickDescription,
    quickProjectId,
    quickRunning,
    quickSeconds,
    setActiveUtility,
    setBillable,
    setDescription,
    setManualDate,
    setManualDuration,
    setManualMode,
    setProjectId,
    setQuickDescription,
    setQuickProjectId,
    setTagText,
    statusMessage,
    tagText,
    teamMembers,
    timerSeconds,
    toggleUtility,
    updateWorkspaceSetting,
    weeklyTotal,
    workspaceSettings
  };
}
