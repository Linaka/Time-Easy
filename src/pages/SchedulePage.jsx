import React, { useState } from "react";
import {
  Check,
  PauseCircle,
  Pencil,
  Plus,
  X
} from "lucide-react";
import {
  DataTable,
  DateInput,
  FormField,
  Panel,
  PrimaryButton,
  ProjectBadge,
  RowActions,
  Select,
  StatusBadge
} from "../components/ui.jsx";
import { cx } from "../components/classNames.js";
import { formatReadableDate } from "../domain/dateUtils.js";
import { setFormValue } from "../domain/formUtils.js";
import {
  getProject,
  memberName
} from "../domain/projectUtils.js";
import { GanttChart } from "./schedule/GanttChart.jsx";
import { createScheduleEditDraft } from "./schedule/scheduleDrafts.js";
import styles from "./SchedulePage.module.css";

export function SchedulePage({
  scheduleItems,
  projects,
  teamMembers,
  weekDays,
  projectDependencies,
  onAddSchedule,
  onUpdateSchedule,
  onScheduleStatusChange,
  onMoveScheduleProject,
  onAddDependency,
  onDeleteDependency
}) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "",
    projectId: projects[0]?.id || "",
    dateKey: weekDays.find((day) => day.isToday)?.dateKey || weekDays[0].dateKey,
    start: "09:00",
    end: "17:00",
    location: "Remote"
  });
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState(null);

  function startScheduleEdit(item) {
    setEditingScheduleId(item.id);
    setScheduleDraft(createScheduleEditDraft(item));
  }

  function cancelScheduleEdit() {
    setEditingScheduleId(null);
    setScheduleDraft(null);
  }

  function saveScheduleEdit() {
    if (!editingScheduleId || !scheduleDraft) {
      return;
    }

    if (onUpdateSchedule(editingScheduleId, scheduleDraft)) {
      cancelScheduleEdit();
    }
  }

  const scheduleRows = scheduleItems.map((item) => {
    const isEditing = item.id === editingScheduleId && scheduleDraft;
    const memberLabel = memberName(item.memberId, teamMembers);
    const readableDate = formatReadableDate(item.dateKey);

    if (isEditing) {
      return [
        <Select
          id={`${item.id}-schedule-person`}
          value={scheduleDraft.memberId}
          onChange={(value) => setFormValue(setScheduleDraft, "memberId", value)}
          className={styles["schedule-page__table-select"]}
          aria-label={`Person for scheduled block on ${readableDate}`}
        >
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>,
        <Select
          id={`${item.id}-schedule-project`}
          value={scheduleDraft.projectId}
          onChange={(value) => setFormValue(setScheduleDraft, "projectId", value)}
          className={styles["schedule-page__table-select"]}
          aria-label={`Project for ${memberLabel}`}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>,
        <DateInput
          id={`${item.id}-schedule-date`}
          value={scheduleDraft.dateKey}
          onChange={(value) => setFormValue(setScheduleDraft, "dateKey", value)}
          className={styles["schedule-page__table-field"]}
          aria-label={`Date for ${memberLabel}`}
        />,
        <div className={styles["schedule-page__time-fields"]}>
          <input
            type="time"
            value={scheduleDraft.start}
            onChange={(event) => setFormValue(setScheduleDraft, "start", event.target.value)}
            className={styles["schedule-page__table-field"]}
            aria-label={`Start time for ${memberLabel}`}
          />
          <input
            type="time"
            value={scheduleDraft.end}
            onChange={(event) => setFormValue(setScheduleDraft, "end", event.target.value)}
            className={styles["schedule-page__table-field"]}
            aria-label={`End time for ${memberLabel}`}
          />
        </div>,
        <input
          value={scheduleDraft.location}
          onChange={(event) => setFormValue(setScheduleDraft, "location", event.target.value)}
          className={styles["schedule-page__table-field"]}
          aria-label={`Label or location for ${memberLabel}`}
        />,
        <StatusBadge status={item.status} />,
        <div className={styles["schedule-page__table-actions"]}>
          <button
            type="button"
            onClick={saveScheduleEdit}
            className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--save"])}
          >
            <Check className={styles["schedule-page__button-icon"]} aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={cancelScheduleEdit}
            className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--ghost"])}
          >
            <X className={styles["schedule-page__button-icon"]} aria-hidden="true" />
            Cancel
          </button>
        </div>
      ];
    }

    return [
      memberLabel,
      <ProjectBadge project={getProject(projects, item.projectId)} />,
      readableDate,
      `${item.start} - ${item.end}`,
      item.location,
      <StatusBadge status={item.status} />,
      <div className={styles["schedule-page__table-actions"]}>
        <button
          type="button"
          onClick={() => startScheduleEdit(item)}
          className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--ghost"])}
          aria-label={`Edit schedule for ${memberLabel} on ${readableDate}`}
        >
          <Pencil className={styles["schedule-page__button-icon"]} aria-hidden="true" />
          Edit
        </button>
        <RowActions
          primaryLabel="Publish"
          primaryAriaLabel={`Publish schedule for ${memberLabel} on ${readableDate}`}
          primaryIcon={Check}
          primaryDisabled={item.status === "Published"}
          primaryIntent="info"
          onPrimary={() => onScheduleStatusChange(item.id, "Published")}
          secondaryLabel="Complete"
          secondaryAriaLabel={`Complete schedule for ${memberLabel} on ${readableDate}`}
          secondaryIcon={PauseCircle}
          secondaryIntent="success"
          onSecondary={() => onScheduleStatusChange(item.id, "Completed")}
        />
      </div>
    ];
  });

  return (
    <div className={styles["schedule-page__style-001"]}>
      <GanttChart
        scheduleItems={scheduleItems}
        projects={projects}
        teamMembers={teamMembers}
        weekDays={weekDays}
        projectDependencies={projectDependencies}
        onAddSchedule={onAddSchedule}
        onUpdateSchedule={onUpdateSchedule}
        onMoveScheduleProject={onMoveScheduleProject}
        onAddDependency={onAddDependency}
        onDeleteDependency={onDeleteDependency}
      />

      <Panel title="Team schedule" subtitle="Create, publish, and complete scheduled work blocks.">
        <form
          className={styles["schedule-page__style-002"]}
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddSchedule(form)) {
              setForm((current) => ({ ...current, location: "Remote" }));
            }
          }}
        >
          <FormField label="Person" htmlFor="schedule-person"><Select id="schedule-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Project" htmlFor="schedule-project"><Select id="schedule-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <FormField label="Date" htmlFor="schedule-date"><DateInput id="schedule-date" value={form.dateKey} onChange={(value) => setFormValue(setForm, "dateKey", value)} className={styles["schedule-page__style-003"]} /></FormField>
          <FormField label="Start" htmlFor="schedule-start"><input id="schedule-start" type="time" value={form.start} onChange={(event) => setFormValue(setForm, "start", event.target.value)} className={styles["schedule-page__style-004"]} /></FormField>
          <FormField label="End" htmlFor="schedule-end"><input id="schedule-end" type="time" value={form.end} onChange={(event) => setFormValue(setForm, "end", event.target.value)} className={styles["schedule-page__style-005"]} /></FormField>
          <FormField label="Location" htmlFor="schedule-location"><input id="schedule-location" value={form.location} onChange={(event) => setFormValue(setForm, "location", event.target.value)} className={styles["schedule-page__style-006"]} /></FormField>
          <div className={styles["schedule-page__style-007"]}><PrimaryButton type="submit" icon={Plus}>Add shift</PrimaryButton></div>
        </form>
        <DataTable
          columns={["Person", "Project", "Date", "Time", "Location", "Status", "Actions"]}
          rows={scheduleRows}
        />
      </Panel>
    </div>
  );
}
