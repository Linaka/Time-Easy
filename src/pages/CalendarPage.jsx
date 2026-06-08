import React, { useEffect, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  X
} from "lucide-react";
import {
  DateInput,
  FormField,
  Panel,
  Select,
  TimeInput
} from "../components/ui.jsx";
import { cx } from "../components/classNames.js";
import {
  formatDuration,
  parseDurationInput
} from "../timeUtils.js";
import { formatDurationLabel } from "../domain/formatters.js";
import { setFormValue } from "../domain/formUtils.js";
import {
  getProject,
  memberName,
  projectStyle
} from "../domain/projectUtils.js";
import styles from "./CalendarPage.module.css";

export function CalendarPage({
  entries,
  projects,
  teamMembers,
  weekDays,
  scheduleItems,
  onAddSchedule,
  onUpdateEntry,
  onUpdateSchedule
}) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "",
    projectId: projects[0]?.id || "",
    dateKey: weekDays.find((day) => day.isToday)?.dateKey || weekDays[0].dateKey,
    start: "14:00",
    end: "15:00",
    location: "Focus block"
  });

  return (
    <div className={styles["calendar-page__style-001"]}>
      <Panel title="Week ahead" subtitle="Time entries and scheduled blocks for the next seven-day planning window.">
        <div className={styles["calendar-page__style-002"]}>
          {weekDays.map((day) => {
            const dayEntries = entries.filter((entry) => entry.dateKey === day.dateKey);
            const daySchedule = scheduleItems.filter((item) => item.dateKey === day.dateKey);
            return (
              <section
                key={day.dateKey}
                className={cx(
                  styles["calendar-page__day-card"],
                  day.isToday
                    ? styles["calendar-page__day-card--today"]
                    : styles["calendar-page__day-card--regular"]
                )}
                aria-labelledby={`calendar-${day.dateKey}`}
              >
                <h2 id={`calendar-${day.dateKey}`} className={styles["calendar-page__style-003"]}>
                  {day.shortName}
                  <span className={styles["calendar-page__style-004"]}>{day.displayDate}</span>
                </h2>
                <div className={styles["calendar-page__style-005"]}>
                  {dayEntries.map((entry) => (
                    <EditableCalendarEntry
                      key={entry.id}
                      entry={entry}
                      projects={projects}
                      onUpdateEntry={onUpdateEntry}
                    />
                  ))}
                  {daySchedule.map((item) => (
                    <EditableCalendarScheduleItem
                      key={item.id}
                      item={item}
                      projects={projects}
                      teamMembers={teamMembers}
                      onUpdateSchedule={onUpdateSchedule}
                    />
                  ))}
                  {!dayEntries.length && !daySchedule.length ? (
                    <p className={styles["calendar-page__style-006"]}>No planned work.</p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </Panel>

      <Panel title="Add week-ahead block" subtitle="Schedule lightweight blocks for people and projects.">
        <form
          className={styles["calendar-page__style-007"]}
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddSchedule(form)) {
              setForm((current) => ({ ...current, location: "Focus block" }));
            }
          }}
        >
          <FormField label="Person" htmlFor="calendar-person"><Select id="calendar-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Project" htmlFor="calendar-project"><Select id="calendar-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <FormField label="Date" htmlFor="calendar-date"><DateInput id="calendar-date" value={form.dateKey} onChange={(value) => setFormValue(setForm, "dateKey", value)} className={styles["calendar-page__style-008"]} /></FormField>
          <FormField label="Start" htmlFor="calendar-start"><TimeInput id="calendar-start" value={form.start} onChange={(value) => setFormValue(setForm, "start", value)} className={styles["calendar-page__style-009"]} /></FormField>
          <FormField label="End" htmlFor="calendar-end"><TimeInput id="calendar-end" value={form.end} onChange={(value) => setFormValue(setForm, "end", value)} className={styles["calendar-page__style-010"]} /></FormField>
          <FormField label="Label" htmlFor="calendar-location"><input id="calendar-location" value={form.location} onChange={(event) => setFormValue(setForm, "location", event.target.value)} className={styles["calendar-page__style-011"]} /></FormField>
          <div className={styles["calendar-page__style-012"]}>
            <div className={styles["calendar-page__add-block-action"]}>
              <button
                type="submit"
                className={styles["calendar-page__add-block-button"]}
                aria-label="Add week-ahead block"
                aria-describedby="calendar-add-block-tooltip"
              >
                <Plus className={styles["calendar-page__add-block-icon"]} aria-hidden="true" />
              </button>
              <span
                id="calendar-add-block-tooltip"
                role="tooltip"
                className={styles["calendar-page__add-block-tooltip"]}
              >
                <span className={styles["calendar-page__add-block-tooltip-title"]}>
                  Add block.{" "}
                </span>
                <span className={styles["calendar-page__add-block-tooltip-description"]}>
                  Create a week-ahead schedule block for the selected person, project, date, and time.
                </span>
              </span>
            </div>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function EditableCalendarEntry({ entry, projects, onUpdateEntry }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    description: entry.description,
    projectId: entry.projectId,
    duration: formatDuration(entry.durationSeconds),
    timeRange: entry.timeRange || "Manual"
  });
  const project = getProject(projects, draft.projectId);
  const style = projectStyle(project);
  const durationSeconds = parseDurationInput(draft.duration);
  const canSave = draft.description.trim() && durationSeconds > 0;

  useEffect(() => {
    setDraft({
      description: entry.description,
      projectId: entry.projectId,
      duration: formatDuration(entry.durationSeconds),
      timeRange: entry.timeRange || "Manual"
    });
  }, [entry.description, entry.durationSeconds, entry.projectId, entry.timeRange]);

  function saveEntry(event) {
    event.preventDefault();
    if (!canSave) {
      return;
    }

    const saved = onUpdateEntry(entry.id, {
      description: draft.description.trim(),
      projectId: draft.projectId,
      durationSeconds,
      timeRange: draft.timeRange.trim() || "Manual"
    });

    if (saved) {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <form
        className={styles["calendar-page__style-013"]}
        onSubmit={saveEntry}
      >
        <label className={styles["calendar-page__style-014"]} htmlFor={`${entry.id}-calendar-description`}>
          Task description
        </label>
        <input
          id={`${entry.id}-calendar-description`}
          value={draft.description}
          onChange={(event) => setFormValue(setDraft, "description", event.target.value)}
          className={styles["calendar-page__style-015"]}
          aria-invalid={!draft.description.trim()}
        />
        <label className={styles["calendar-page__style-016"]} htmlFor={`${entry.id}-calendar-project`}>
          Project
        </label>
        <Select
          id={`${entry.id}-calendar-project`}
          value={draft.projectId}
          onChange={(value) => setFormValue(setDraft, "projectId", value)}
        >
          {projects.map((projectOption) => (
            <option key={projectOption.id} value={projectOption.id}>
              {projectOption.name}
            </option>
          ))}
        </Select>
        <div className={styles["calendar-page__style-017"]}>
          <div>
            <label className={styles["calendar-page__style-018"]} htmlFor={`${entry.id}-calendar-time`}>
              Time range
            </label>
            <input
              id={`${entry.id}-calendar-time`}
              value={draft.timeRange}
              onChange={(event) => setFormValue(setDraft, "timeRange", event.target.value)}
              className={styles["calendar-page__style-019"]}
              placeholder="1:00 PM - 3:00 PM"
            />
          </div>
          <div>
            <label className={styles["calendar-page__style-020"]} htmlFor={`${entry.id}-calendar-duration`}>
              Duration
            </label>
            <input
              id={`${entry.id}-calendar-duration`}
              value={draft.duration}
              onChange={(event) => setFormValue(setDraft, "duration", event.target.value)}
              className={styles["calendar-page__style-021"]}
              placeholder="2:00"
              aria-invalid={durationSeconds <= 0}
            />
          </div>
        </div>
        <div className={styles["calendar-page__style-022"]}>
          <button
            type="submit"
            disabled={!canSave}
            className={styles["calendar-page__style-023"]}
          >
            <Check className={styles["calendar-page__style-024"]} aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={styles["calendar-page__style-025"]}
          >
            <X className={styles["calendar-page__style-026"]} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={cx(styles["calendar-page__event-card"], style.border, style.soft)}>
      <div className={styles["calendar-page__style-028"]}>
        <p className={styles["calendar-page__style-029"]}>{entry.description}</p>
        <p className={styles["calendar-page__style-030"]}>
          {project.name} · {formatDurationLabel(entry.durationSeconds)}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={styles["calendar-page__style-031"]}
          aria-label={`Edit ${entry.description}`}
          title="Edit"
        >
          <Pencil className={styles["calendar-page__edit-icon"]} aria-hidden="true" />
        </button>
      </div>
      <p className={styles["calendar-page__style-032"]}>{entry.timeRange}</p>
    </article>
  );
}

function EditableCalendarScheduleItem({ item, projects, teamMembers, onUpdateSchedule }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    memberId: item.memberId,
    projectId: item.projectId,
    start: item.start,
    end: item.end,
    location: item.location || ""
  });
  const project = getProject(projects, draft.projectId);
  const style = projectStyle(project);
  const canSave = draft.start && draft.end && draft.location.trim();

  useEffect(() => {
    setDraft({
      memberId: item.memberId,
      projectId: item.projectId,
      start: item.start,
      end: item.end,
      location: item.location || ""
    });
  }, [item.end, item.location, item.memberId, item.projectId, item.start]);

  function saveSchedule(event) {
    event.preventDefault();
    if (!canSave) {
      return;
    }

    const saved = onUpdateSchedule(item.id, {
      memberId: draft.memberId,
      projectId: draft.projectId,
      start: draft.start,
      end: draft.end,
      location: draft.location.trim()
    });

    if (saved) {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <form
        className={styles["calendar-page__style-033"]}
        onSubmit={saveSchedule}
      >
        <label className={styles["calendar-page__style-034"]} htmlFor={`${item.id}-calendar-person`}>
          Person
        </label>
        <Select
          id={`${item.id}-calendar-person`}
          value={draft.memberId}
          onChange={(value) => setFormValue(setDraft, "memberId", value)}
        >
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
        <label className={styles["calendar-page__style-035"]} htmlFor={`${item.id}-calendar-project`}>
          Project
        </label>
        <Select
          id={`${item.id}-calendar-project`}
          value={draft.projectId}
          onChange={(value) => setFormValue(setDraft, "projectId", value)}
        >
          {projects.map((projectOption) => (
            <option key={projectOption.id} value={projectOption.id}>
              {projectOption.name}
            </option>
          ))}
        </Select>
        <div className={styles["calendar-page__style-036"]}>
          <div>
            <label className={styles["calendar-page__style-037"]} htmlFor={`${item.id}-calendar-start`}>
              Start time
            </label>
            <TimeInput
              id={`${item.id}-calendar-start`}
              value={draft.start}
              onChange={(value) => setFormValue(setDraft, "start", value)}
              className={styles["calendar-page__style-038"]}
            />
          </div>
          <div>
            <label className={styles["calendar-page__style-039"]} htmlFor={`${item.id}-calendar-end`}>
              End time
            </label>
            <TimeInput
              id={`${item.id}-calendar-end`}
              value={draft.end}
              onChange={(value) => setFormValue(setDraft, "end", value)}
              className={styles["calendar-page__style-040"]}
            />
          </div>
        </div>
        <label className={styles["calendar-page__style-041"]} htmlFor={`${item.id}-calendar-location`}>
          Schedule label
        </label>
        <input
          id={`${item.id}-calendar-location`}
          value={draft.location}
          onChange={(event) => setFormValue(setDraft, "location", event.target.value)}
          className={styles["calendar-page__style-042"]}
          aria-invalid={!draft.location.trim()}
        />
        <div className={styles["calendar-page__style-043"]}>
          <button
            type="submit"
            disabled={!canSave}
            className={styles["calendar-page__style-044"]}
          >
            <Check className={styles["calendar-page__style-045"]} aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={styles["calendar-page__style-046"]}
          >
            <X className={styles["calendar-page__style-047"]} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={cx(styles["calendar-page__event-card"], style.border, style.soft)}>
      <div className={styles["calendar-page__style-049"]}>
        <p className={styles["calendar-page__style-050"]}>{memberName(item.memberId, teamMembers)}</p>
        <p className={styles["calendar-page__style-051"]}>
          {project.name} · {item.start} - {item.end}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={styles["calendar-page__style-052"]}
          aria-label={`Edit scheduled block for ${memberName(item.memberId, teamMembers)}`}
          title="Edit"
        >
          <Pencil className={styles["calendar-page__edit-icon"]} aria-hidden="true" />
        </button>
      </div>
      <p className={styles["calendar-page__style-053"]}>{item.location}</p>
    </article>
  );
}
