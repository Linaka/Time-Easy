import { useEffect, useRef, useState } from "react";
import {
  isSafeDisplayText,
  parseDurationInput
} from "../timeUtils.js";
import { formatClockTime } from "../domain/dateUtils.js";
import { parseTags } from "../domain/formUtils.js";

export function useTimeTrackingController({
  activeProjects,
  addEntry,
  projects,
  setActiveSection,
  setStatusMessage,
  todayKey,
  workspaceSettings
}) {
  const [description, setDescription] = useState("");
  const [tagText, setTagText] = useState("");
  const [projectId, setProjectId] = useState(activeProjects[0]?.id || "");
  const [billable, setBillable] = useState(workspaceSettings.defaultBillable);
  const [isRunning, setIsRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualDate, setManualDate] = useState(todayKey);
  const [manualDuration, setManualDuration] = useState("1:00");
  const [error, setError] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickProjectId, setQuickProjectId] = useState(activeProjects[0]?.id || "");
  const [quickRunning, setQuickRunning] = useState(false);
  const [quickStartedAt, setQuickStartedAt] = useState(null);
  const [quickSeconds, setQuickSeconds] = useState(0);
  const descriptionRef = useRef(null);

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
      setQuickDescription("");
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
    setProjectId(project?.id || activeProjects[0]?.id || "");
    setTagText(entry.tags.join(", "));
    setBillable(entry.billable);
    setIsRunning(false);
    setStartedAt(null);
    setTimerSeconds(0);
    setError("");
    setStatusMessage(`Loaded ${entry.description}. Press START to begin a similar timer.`);
    window.setTimeout(() => descriptionRef.current?.focus(), 0);
  }

  function resetDrafts({
    defaultBillable = workspaceSettings.defaultBillable,
    nextProjectId = activeProjects[0]?.id || ""
  } = {}) {
    setDescription("");
    setTagText("");
    setProjectId(nextProjectId);
    setBillable(defaultBillable);
    setIsRunning(false);
    setStartedAt(null);
    setTimerSeconds(0);
    setManualMode(false);
    setManualDate(todayKey);
    setManualDuration("1:00");
    setError("");
    setQuickDescription("");
    setQuickProjectId(nextProjectId);
    setQuickRunning(false);
    setQuickStartedAt(null);
    setQuickSeconds(0);
  }

  return {
    billable,
    description,
    descriptionRef,
    error,
    handleManualSave,
    handleQuickClockToggle,
    handleStartStop,
    isRunning,
    manualDate,
    manualDuration,
    manualMode,
    projectId,
    quickDescription,
    quickProjectId,
    quickRunning,
    quickSeconds,
    resetDrafts,
    restartFromEntry,
    setBillable,
    setDescription,
    setManualDate,
    setManualDuration,
    setManualMode,
    setProjectId,
    setQuickDescription,
    setQuickProjectId,
    setTagText,
    tagText,
    timerSeconds
  };
}
