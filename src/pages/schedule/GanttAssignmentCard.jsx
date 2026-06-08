import React, {
  useEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  GripVertical,
  Pencil,
  Trash2
} from "lucide-react";
import {
  StatusBadge
} from "../../components/ui.jsx";
import { cx } from "../../components/classNames.js";
import { formatReadableDate } from "../../domain/dateUtils.js";
import {
  getProject,
  memberName,
  projectStyle
} from "../../domain/projectUtils.js";
import {
  getScheduleEndDateKey,
  getTimelineSlotKeyForDate,
  scheduleSpansMultipleDays
} from "../../ganttUtils.js";
import { ScheduleEditModal } from "./ScheduleEditModal.jsx";
import { useFloatingPicker } from "./useFloatingPicker.js";
import styles from "../SchedulePage.module.css";

export function GanttAssignmentCard({
  item,
  slot,
  projects,
  teamMembers,
  timelineSlots,
  onDragStart,
  onUpdateSchedule,
  onMoveScheduleProject,
  onDeleteSchedule
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const editButtonRef = useRef(null);
  const picker = useFloatingPicker();
  const {
    openPicker,
    periodButtonRef,
    pickerRef,
    pickerStyle,
    projectButtonRef,
    setOpenPicker,
    togglePicker
  } = picker;
  const memberLabel = memberName(item.memberId, teamMembers);
  const project = getProject(projects, item.projectId);
  const style = projectStyle(project);
  const activeSlotKey = getTimelineSlotKeyForDate(timelineSlots, item.dateKey);
  const activeSlot = timelineSlots.find((timelineSlot) => timelineSlot.key === activeSlotKey);
  const endDateKey = getScheduleEndDateKey(item);
  const spansMultipleDays = scheduleSpansMultipleDays(item);
  const dateLabel = spansMultipleDays
    ? `${formatReadableDate(item.dateKey)} - ${formatReadableDate(endDateKey)}`
    : slot?.selectLabel || activeSlot?.selectLabel || formatReadableDate(item.dateKey);
  const projectPickerId = `gantt-project-picker-${item.id}`;
  const periodPickerId = `gantt-period-picker-${item.id}`;

  function startAssignmentEdit() {
    setOpenPicker(null);
    setEditModalOpen(true);
  }

  function cancelAssignmentEdit() {
    setEditModalOpen(false);
    window.requestAnimationFrame(() => editButtonRef.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    if (!openPicker) {
      return undefined;
    }

    function handlePointerDown(event) {
      const target = event.target;
      if (
        projectButtonRef.current?.contains(target) ||
        periodButtonRef.current?.contains(target) ||
        pickerRef.current?.contains(target)
      ) {
        return;
      }

      setOpenPicker(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openPicker, periodButtonRef, pickerRef, projectButtonRef, setOpenPicker]);

  const projectPicker = openPicker === "project" && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={pickerRef}
          id={projectPickerId}
          style={pickerStyle || undefined}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpenPicker(null);
              projectButtonRef.current?.focus();
            }
          }}
          className={styles["schedule-page__style-063"]}
        >
          {projects.map((projectOption) => (
            <button
              key={projectOption.id}
              type="button"
              onClick={() => {
                onMoveScheduleProject(item.id, projectOption.id, item.dateKey);
                setOpenPicker(null);
              }}
              className={cx(
                styles["schedule-page__picker-button"],
                projectOption.id === item.projectId
                  ? styles["schedule-page__picker-button--active"]
                  : styles["schedule-page__picker-button--idle"]
              )}
            >
              <span className={cx(styles["schedule-page__picker-marker"], projectStyle(projectOption).dot)} aria-hidden="true" />
              <span className={styles["schedule-page__style-064"]}>{projectOption.name}</span>
            </button>
          ))}
        </div>,
        document.body
      )
    : null;
  const periodPicker = openPicker === "period" && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={pickerRef}
          id={periodPickerId}
          style={pickerStyle || undefined}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpenPicker(null);
              periodButtonRef.current?.focus();
            }
          }}
          className={styles["schedule-page__style-065"]}
        >
          {timelineSlots.map((timelineSlot) => (
            <button
              key={timelineSlot.key}
              type="button"
              onClick={() => {
                onMoveScheduleProject(item.id, item.projectId, timelineSlot.dropDateKey);
                setOpenPicker(null);
              }}
              className={cx(
                styles["schedule-page__period-button"],
                timelineSlot.key === activeSlotKey
                  ? styles["schedule-page__period-button--active"]
                  : styles["schedule-page__period-button--idle"]
              )}
            >
              {timelineSlot.selectLabel}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <article
        draggable
        onDragStart={(event) => onDragStart(event, item)}
        className={cx(styles["schedule-page__assignment-card"], style.border, style.soft)}
        aria-label={`${memberLabel} assigned to ${project.name} from ${item.start} to ${item.end} on ${dateLabel}`}
      >
        <div className={styles["schedule-page__style-049"]}>
          <div className={styles["schedule-page__style-050"]}>
            <p className={cx(styles["schedule-page__assignment-title"], style.text)}>
              <GripVertical className={styles["schedule-page__style-051"]} aria-hidden="true" />
              <span className={styles["schedule-page__style-052"]}>{memberLabel}</span>
            </p>
            <p className={styles["schedule-page__style-053"]}>
              {item.start} - {item.end}
            </p>
          </div>
          <div className={styles["schedule-page__style-054"]}>
            <StatusBadge status={item.status} />
          </div>
        </div>
        <p className={styles["schedule-page__style-055"]}>{item.location}</p>

        <div className={styles["schedule-page__style-056"]}>
          <span className={styles["schedule-page__style-057"]}>
            {dateLabel}
          </span>
          <span className={styles["schedule-page__style-058"]}>
            <button
              ref={editButtonRef}
              type="button"
              onClick={startAssignmentEdit}
              aria-label={`Edit scheduled block for ${memberLabel}`}
              title="Edit scheduled block"
              className={styles["schedule-page__style-059"]}
            >
              <Pencil className={styles["schedule-page__style-060"]} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteSchedule(item.id)}
              aria-label={`Delete scheduled block for ${memberLabel}`}
              title="Delete scheduled block"
              className={cx(styles["schedule-page__style-059"], styles["schedule-page__assignment-icon-button--danger"])}
            >
              <Trash2 className={styles["schedule-page__style-060"]} aria-hidden="true" />
            </button>
            <button
              ref={projectButtonRef}
              type="button"
              onClick={() => togglePicker("project")}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpenPicker(null);
                }
              }}
              aria-label={`Move ${memberLabel} to another project`}
              aria-expanded={openPicker === "project"}
              aria-controls={openPicker === "project" ? projectPickerId : undefined}
              title="Move to another project"
              className={styles["schedule-page__style-059"]}
            >
              <BriefcaseBusiness className={styles["schedule-page__style-060"]} aria-hidden="true" />
            </button>
            <button
              ref={periodButtonRef}
              type="button"
              onClick={() => togglePicker("period")}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpenPicker(null);
                }
              }}
              aria-label={`Move ${memberLabel} to another period`}
              aria-expanded={openPicker === "period"}
              aria-controls={openPicker === "period" ? periodPickerId : undefined}
              title="Move to another period"
              className={styles["schedule-page__style-061"]}
            >
              <CalendarDays className={styles["schedule-page__style-062"]} aria-hidden="true" />
            </button>
          </span>
        </div>

        {projectPicker}
        {periodPicker}
      </article>
      {editModalOpen ? (
        <ScheduleEditModal
          item={item}
          projects={projects}
          teamMembers={teamMembers}
          onClose={cancelAssignmentEdit}
          onUpdateSchedule={onUpdateSchedule}
        />
      ) : null}
    </>
  );
}
