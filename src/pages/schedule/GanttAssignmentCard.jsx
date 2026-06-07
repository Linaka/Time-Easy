import React, {
  useEffect,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  GripVertical,
  Pencil,
  X
} from "lucide-react";
import {
  DateInput,
  Select,
  StatusBadge
} from "../../components/ui.jsx";
import { cx } from "../../components/classNames.js";
import { formatReadableDate } from "../../domain/dateUtils.js";
import { setFormValue } from "../../domain/formUtils.js";
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
import { createScheduleEditDraft } from "./scheduleDrafts.js";
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
  onMoveScheduleProject
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => createScheduleEditDraft(item));
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

  useEffect(() => {
    setDraft(createScheduleEditDraft(item));
  }, [item.dateKey, item.end, item.location, item.memberId, item.projectId, item.start]);

  function startAssignmentEdit() {
    setOpenPicker(null);
    setEditing(true);
  }

  function cancelAssignmentEdit() {
    setDraft(createScheduleEditDraft(item));
    setEditing(false);
  }

  function saveAssignmentEdit(event) {
    event.preventDefault();
    if (onUpdateSchedule(item.id, draft)) {
      setEditing(false);
    }
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

  if (editing) {
    return (
      <article
        className={cx(styles["schedule-page__assignment-card"], style.border, style.soft)}
        aria-label={`Editing scheduled block for ${memberLabel}`}
      >
        <form className={styles["schedule-page__assignment-edit-form"]} onSubmit={saveAssignmentEdit}>
          <Select
            id={`${item.id}-gantt-edit-person`}
            value={draft.memberId}
            onChange={(value) => setFormValue(setDraft, "memberId", value)}
            className={styles["schedule-page__assignment-edit-control"]}
            aria-label={`Person for scheduled block on ${dateLabel}`}
          >
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <Select
            id={`${item.id}-gantt-edit-project`}
            value={draft.projectId}
            onChange={(value) => setFormValue(setDraft, "projectId", value)}
            className={styles["schedule-page__assignment-edit-control"]}
            aria-label={`Project for ${memberLabel}`}
          >
            {projects.map((projectOption) => (
              <option key={projectOption.id} value={projectOption.id}>
                {projectOption.name}
              </option>
            ))}
          </Select>
          <DateInput
            id={`${item.id}-gantt-edit-date`}
            value={draft.dateKey}
            onChange={(value) => setFormValue(setDraft, "dateKey", value)}
            className={styles["schedule-page__assignment-edit-control"]}
            aria-label={`Date for ${memberLabel}`}
          />
          <div className={styles["schedule-page__time-fields"]}>
            <input
              type="time"
              value={draft.start}
              onChange={(event) => setFormValue(setDraft, "start", event.target.value)}
              className={styles["schedule-page__assignment-edit-control"]}
              aria-label={`Start time for ${memberLabel}`}
            />
            <input
              type="time"
              value={draft.end}
              onChange={(event) => setFormValue(setDraft, "end", event.target.value)}
              className={styles["schedule-page__assignment-edit-control"]}
              aria-label={`End time for ${memberLabel}`}
            />
          </div>
          <input
            value={draft.location}
            onChange={(event) => setFormValue(setDraft, "location", event.target.value)}
            className={styles["schedule-page__assignment-edit-control"]}
            aria-label={`Label or location for ${memberLabel}`}
          />
          <div className={styles["schedule-page__table-actions"]}>
            <button
              type="submit"
              className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--save"])}
            >
              <Check className={styles["schedule-page__button-icon"]} aria-hidden="true" />
              Save
            </button>
            <button
              type="button"
              onClick={cancelAssignmentEdit}
              className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--ghost"])}
            >
              <X className={styles["schedule-page__button-icon"]} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
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
            type="button"
            onClick={startAssignmentEdit}
            aria-label={`Edit scheduled block for ${memberLabel}`}
            className={styles["schedule-page__style-059"]}
          >
            <Pencil className={styles["schedule-page__style-060"]} aria-hidden="true" />
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
            className={styles["schedule-page__style-061"]}
          >
            <CalendarDays className={styles["schedule-page__style-062"]} aria-hidden="true" />
          </button>
        </span>
      </div>

      {projectPicker}
      {periodPicker}
    </article>
  );
}
