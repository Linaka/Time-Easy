import { useEffect, useMemo, useState } from "react";
import { getLocalDateKey } from "../../domain/dateUtils.js";
import { scheduleDurationSeconds } from "../../domain/scheduleUtils.js";
import {
  buildGanttTimeline,
  getScheduleEndDateKey
} from "../../ganttUtils.js";

const TIMELINE_LANE_WIDTH = 200;

export function useGanttPlanner({
  onAddDependency,
  onAddSchedule,
  onMoveScheduleProject,
  projects,
  scheduleItems,
  teamMembers,
  weekDays
}) {
  const [dependencyForm, setDependencyForm] = useState({
    fromProjectId: projects[0]?.id || "",
    toProjectId: projects[1]?.id || projects[0]?.id || "",
    label: "Design approval before build"
  });
  const [timelineMode, setTimelineMode] = useState("Week");
  const [timelineStart, setTimelineStart] = useState(
    weekDays.find((day) => day.isToday)?.dateKey || weekDays[0]?.dateKey || getLocalDateKey(new Date())
  );
  const [planForm, setPlanForm] = useState({
    memberId: teamMembers[0]?.id || "",
    projectId: projects[0]?.id || "",
    slotKey: "",
    start: "09:00",
    end: "17:00",
    location: "Focus block"
  });

  useEffect(() => {
    setDependencyForm((current) => {
      const firstProjectId = projects[0]?.id || "";
      const secondProjectId = projects[1]?.id || firstProjectId;
      const fromProjectId = projects.some((project) => project.id === current.fromProjectId)
        ? current.fromProjectId
        : firstProjectId;
      const toProjectId = projects.some((project) => project.id === current.toProjectId)
        ? current.toProjectId
        : secondProjectId;
      return { ...current, fromProjectId, toProjectId };
    });
  }, [projects]);

  const timeline = useMemo(
    () => buildGanttTimeline(timelineMode, timelineStart),
    [timelineMode, timelineStart]
  );
  const timelineScheduleItems = useMemo(
    () =>
      scheduleItems.filter((item) =>
        item.dateKey <= timeline.endKey && getScheduleEndDateKey(item) >= timeline.startKey
      ),
    [scheduleItems, timeline.startKey, timeline.endKey]
  );
  const assignedSeconds = timelineScheduleItems.reduce(
    (sum, item) => sum + scheduleDurationSeconds(item),
    0
  );
  const timelineGridStyle = {
    gridTemplateColumns: `${TIMELINE_LANE_WIDTH}px repeat(${timeline.slots.length}, minmax(${timeline.slotMinWidth}px, 1fr))`,
    minWidth: `${Math.max(860, TIMELINE_LANE_WIDTH + timeline.slots.length * timeline.slotMinWidth)}px`
  };

  useEffect(() => {
    setPlanForm((current) => {
      const nextMemberId = teamMembers.some((member) => member.id === current.memberId)
        ? current.memberId
        : teamMembers[0]?.id || "";
      const nextProjectId = projects.some((project) => project.id === current.projectId)
        ? current.projectId
        : projects[0]?.id || "";
      const nextSlotKey = timeline.slots.some((slot) => slot.key === current.slotKey)
        ? current.slotKey
        : timeline.slots[0]?.key || "";
      return { ...current, memberId: nextMemberId, projectId: nextProjectId, slotKey: nextSlotKey };
    });
  }, [projects, teamMembers, timeline.slots]);

  function handleDragStart(event, item) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  }

  function handleDrop(event, projectId, slot) {
    event.preventDefault();
    const scheduleId = event.dataTransfer.getData("text/plain");
    if (scheduleId) {
      onMoveScheduleProject(scheduleId, projectId, slot.dropDateKey);
    }
  }

  function handleDependencySubmit(event) {
    event.preventDefault();
    if (onAddDependency(dependencyForm)) {
      setDependencyForm((current) => ({ ...current, label: "" }));
    }
  }

  function handlePlanSubmit(event) {
    event.preventDefault();
    const slot = timeline.slots.find((timelineSlot) => timelineSlot.key === planForm.slotKey);
    if (!slot) {
      return;
    }

    if (onAddSchedule({ ...planForm, dateKey: slot.dropDateKey, slotKey: undefined })) {
      setPlanForm((current) => ({ ...current, location: "Focus block" }));
    }
  }

  return {
    assignedSeconds,
    dependencyForm,
    handleDependencySubmit,
    handleDragStart,
    handleDrop,
    handlePlanSubmit,
    planForm,
    setDependencyForm,
    setPlanForm,
    setTimelineMode,
    setTimelineStart,
    timeline,
    timelineGridStyle,
    timelineMode,
    timelineScheduleItems,
    timelineStart
  };
}
