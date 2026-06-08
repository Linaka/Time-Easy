import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Ellipsis,
  FileCheck2,
  Play,
  Plus,
  PoundSterling,
  Tags,
  TimerReset,
  X
} from "lucide-react";
import {
  BillableBadge,
  DateInput,
  FormField,
  Panel,
  ProjectBadge,
  StatusBadge,
  TagList
} from "../components/ui.jsx";
import { cx } from "../components/classNames.js";
import {
  formatTimer,
  groupEntriesByDay,
  sumDurations
} from "../timeUtils.js";
import {
  getDayLabel,
  sortDayLabels
} from "../domain/dateUtils.js";
import { formatDurationLabel } from "../domain/formatters.js";
import { slugify } from "../domain/formUtils.js";
import { getProject } from "../domain/projectUtils.js";
import styles from "./TimeTrackerPage.module.css";

export function TimeTrackerPage({
  entries,
  projects,
  activeProjects,
  description,
  descriptionRef,
  tagText,
  projectId,
  billable,
  timerSeconds,
  isRunning,
  manualMode,
  manualDate,
  manualDuration,
  error,
  onDescriptionChange,
  onTagTextChange,
  onProjectChange,
  onBillableChange,
  onManualModeChange,
  onManualDateChange,
  onManualDurationChange,
  onStartStop,
  onManualSave,
  onRestartEntry,
  onUpdateEntry,
  onEntryApprovalChange
}) {
  const entriesWithLabels = useMemo(
    () => entries.map((entry) => ({ ...entry, day: getDayLabel(entry.dateKey) })),
    [entries]
  );
  const entriesByDay = useMemo(() => groupEntriesByDay(entriesWithLabels), [entriesWithLabels]);
  const weekTotal = useMemo(() => sumDurations(entries), [entries]);

  return (
    <>
      <TimeEntryBar
        description={description}
        descriptionRef={descriptionRef}
        tagText={tagText}
        activeProjects={activeProjects}
        projectId={projectId}
        billable={billable}
        timerSeconds={timerSeconds}
        isRunning={isRunning}
        manualMode={manualMode}
        manualDate={manualDate}
        manualDuration={manualDuration}
        error={error}
        onDescriptionChange={onDescriptionChange}
        onTagTextChange={onTagTextChange}
        onProjectChange={onProjectChange}
        onBillableChange={onBillableChange}
        onManualModeChange={onManualModeChange}
        onManualDateChange={onManualDateChange}
        onManualDurationChange={onManualDurationChange}
        onStartStop={onStartStop}
        onManualSave={onManualSave}
      />

      <Panel
        title="This week"
        subtitle="Tracked work grouped by day."
        action={
          <div className={styles["time-tracker-page__style-001"]}>
            <span className={styles["time-tracker-page__style-002"]}>Week total </span>
            <span className={styles["time-tracker-page__style-003"]}>
              {formatDurationLabel(weekTotal)}
            </span>
          </div>
        }
      >
        <TimeEntriesTable
          entriesByDay={entriesByDay}
          projects={projects}
          onRestart={onRestartEntry}
          onUpdateEntry={onUpdateEntry}
          onEntryApprovalChange={onEntryApprovalChange}
        />
      </Panel>
    </>
  );
}

function TimeEntryBar({
  description,
  descriptionRef,
  tagText,
  activeProjects,
  projectId,
  billable,
  timerSeconds,
  isRunning,
  manualMode,
  manualDate,
  manualDuration,
  error,
  onDescriptionChange,
  onTagTextChange,
  onProjectChange,
  onBillableChange,
  onManualModeChange,
  onManualDateChange,
  onManualDurationChange,
  onStartStop,
  onManualSave
}) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsId = "time-entry-more-options";

  return (
    <section
      aria-labelledby="new-entry-title"
      className={styles["time-tracker-page__style-004"]}
      data-guidance-target="time-entry-bar"
    >
      <h2 id="new-entry-title" className={styles["time-tracker-page__style-005"]}>
        New time entry
      </h2>

      <form
        className={styles["time-tracker-page__style-006"]}
        onSubmit={(event) => {
          event.preventDefault();
          onStartStop();
        }}
        noValidate
      >
        <div className={styles["time-tracker-page__style-007"]}>
          <label htmlFor="task-description" className={styles["time-tracker-page__style-008"]}>
            Task description
          </label>
          <input
            ref={descriptionRef}
            id="task-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className={cx(
              styles["time-tracker-page__task-input"],
              error
                ? styles["time-tracker-page__task-input--invalid"]
                : styles["time-tracker-page__task-input--valid"]
            )}
            placeholder="What are you working on?"
            aria-describedby={`task-helper${error ? " task-error" : ""}`}
            aria-invalid={error ? "true" : "false"}
          />
          <p id="task-helper" className={styles["time-tracker-page__style-009"]}>
            Required. Plain text only.
          </p>
          {error ? (
            <p id="task-error" className={styles["time-tracker-page__style-010"]}>
              {error}
            </p>
          ) : null}
        </div>

        <div className={styles["time-tracker-page__style-011"]}>
          <label htmlFor="project-selector" className={styles["time-tracker-page__style-012"]}>
            Project
          </label>
          <select
            id="project-selector"
            value={projectId}
            onChange={(event) => onProjectChange(event.target.value)}
            className={styles["time-tracker-page__style-013"]}
          >
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client}
              </option>
            ))}
          </select>
        </div>

        <label className={styles["time-tracker-page__style-014"]}>
          <Tags className={styles["time-tracker-page__style-015"]} aria-hidden="true" />
          <span className={styles["time-tracker-page__style-016"]}>Tags</span>
          <input
            value={tagText}
            onChange={(event) => onTagTextChange(event.target.value)}
            placeholder="Tags"
            className={styles["time-tracker-page__style-017"]}
          />
        </label>

        <span className={styles["time-tracker-page__style-018"]}>
          <button
            type="button"
            onClick={() => onBillableChange(!billable)}
            aria-pressed={billable}
            aria-describedby="billable-tooltip"
            aria-label={
              billable
                ? "Billable. Click to mark this entry as non-billable."
                : "Non-billable. Click to mark this entry as billable."
            }
            className={cx(
              styles["time-tracker-page__billable-button"],
              billable
                ? styles["time-tracker-page__billable-button--active"]
                : styles["time-tracker-page__billable-button--inactive"]
            )}
          >
            <PoundSterling className={styles["time-tracker-page__style-019"]} aria-hidden="true" />
          </button>
          <span
            id="billable-tooltip"
            role="tooltip"
            className={styles["time-tracker-page__style-020"]}
          >
            <span className={styles["time-tracker-page__style-021"]}>{billable ? "Billable" : "Non-billable"}</span>
            <span className={styles["time-tracker-page__style-022"]}>
              {billable
                ? "Included in billable reports. Click to mark this entry as internal time."
                : "Excluded from billable reports. Click to mark this entry as client-billable."}
            </span>
          </span>
        </span>

        <div
          className={styles["time-tracker-page__style-023"]}
          role="timer"
          aria-atomic="true"
          aria-label={`Timer ${formatTimer(timerSeconds)}`}
        >
          {formatTimer(timerSeconds)}
        </div>

        <button
          type="submit"
          className={cx(
            styles["time-tracker-page__timer-button"],
            isRunning
              ? styles["time-tracker-page__timer-button--running"]
              : styles["time-tracker-page__timer-button--stopped"]
          )}
          aria-label={isRunning ? "Stop timer and save entry" : "Start timer"}
        >
          {isRunning ? "STOP" : "START"}
        </button>

        <span className={styles["time-tracker-page__style-024"]}>
          <button
            type="button"
            onClick={() => onManualModeChange(!manualMode)}
            aria-expanded={manualMode}
            aria-describedby="manual-entry-tooltip"
            className={styles["time-tracker-page__style-025"]}
            aria-label="Manual time entry options"
          >
            <TimerReset className={styles["time-tracker-page__style-026"]} aria-hidden="true" />
          </button>
          <span
            id="manual-entry-tooltip"
            role="tooltip"
            className={styles["time-tracker-page__style-027"]}
          >
            <span className={styles["time-tracker-page__style-028"]}>Manual time</span>
            <span className={styles["time-tracker-page__style-029"]}>Open date and duration fields for a manual entry.</span>
          </span>
        </span>
        <span className={styles["time-tracker-page__style-030"]}>
          <button
            type="button"
            onClick={() => setOptionsOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOptionsOpen(false);
              }
            }}
            className={styles["time-tracker-page__style-031"]}
            aria-label="More time entry options"
            aria-expanded={optionsOpen}
            aria-controls={optionsOpen ? optionsId : undefined}
          >
            <Ellipsis className={styles["time-tracker-page__style-032"]} aria-hidden="true" />
          </button>
          {optionsOpen ? (
            <div
              id={optionsId}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOptionsOpen(false);
                }
              }}
              className={styles["time-tracker-page__style-033"]}
            >
              <button
                type="button"
                onClick={() => {
                  onManualModeChange(!manualMode);
                  setOptionsOpen(false);
                }}
                className={styles["time-tracker-page__style-034"]}
              >
                <TimerReset className={styles["time-tracker-page__style-035"]} aria-hidden="true" />
                {manualMode ? "Hide manual fields" : "Add manual time"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onBillableChange(!billable);
                  setOptionsOpen(false);
                }}
                className={styles["time-tracker-page__style-036"]}
              >
                <PoundSterling className={styles["time-tracker-page__style-037"]} aria-hidden="true" />
                {billable ? "Mark internal" : "Mark billable"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDescriptionChange("");
                  onTagTextChange("");
                  setOptionsOpen(false);
                }}
                className={styles["time-tracker-page__style-038"]}
              >
                <X className={styles["time-tracker-page__style-039"]} aria-hidden="true" />
                Clear task fields
              </button>
            </div>
          ) : null}
        </span>
      </form>

      {manualMode ? (
        <form
          className={styles["time-tracker-page__style-040"]}
          onSubmit={(event) => {
            event.preventDefault();
            onManualSave();
          }}
        >
          <FormField label="Manual date" htmlFor="manual-date">
            <DateInput
              id="manual-date"
              value={manualDate}
              onChange={onManualDateChange}
              className={styles["time-tracker-page__style-041"]}
            />
          </FormField>
          <FormField label="Duration" htmlFor="manual-duration" helper="Use minutes or hours:minutes.">
            <input
              id="manual-duration"
              value={manualDuration}
              onChange={(event) => onManualDurationChange(event.target.value)}
              className={styles["time-tracker-page__style-042"]}
              placeholder="1:30"
            />
          </FormField>
          <div className={styles["time-tracker-page__style-043"]}>
            <button
              type="submit"
              className={styles["time-tracker-page__style-044"]}
            >
              <Plus className={styles["time-tracker-page__style-045"]} aria-hidden="true" />
              Save manual entry
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function TimeEntriesTable({ entriesByDay, projects, onRestart, onUpdateEntry, onEntryApprovalChange }) {
  const dayOrder = Object.keys(entriesByDay).sort(sortDayLabels);

  return (
    <div className={styles["time-tracker-page__style-046"]}>
      {dayOrder.map((day) => {
        const dayEntries = entriesByDay[day] || [];
        const dayTotal = sumDurations(dayEntries);

        return (
          <section key={day} aria-labelledby={`${slugify(day)}-heading`}>
            <div className={styles["time-tracker-page__style-047"]}>
              <h3
                id={`${slugify(day)}-heading`}
                className={styles["time-tracker-page__style-048"]}
              >
                {day}
              </h3>
              <span className={styles["time-tracker-page__style-049"]}>
                {formatDurationLabel(dayTotal)}
              </span>
            </div>

            <div className={styles["time-tracker-page__style-050"]}>
              {dayEntries.map((entry) => (
                <EntryMobileCard
                  key={entry.id}
                  entry={entry}
                  projects={projects}
                  onRestart={onRestart}
                  onUpdateEntry={onUpdateEntry}
                  onEntryApprovalChange={onEntryApprovalChange}
                />
              ))}
            </div>

            <div className={styles["time-tracker-page__style-051"]}>
              <table className={styles["time-tracker-page__style-052"]} aria-label={`${day} time entries`}>
                <caption className={styles["time-tracker-page__style-053"]}>
                  {day} time entries total {formatDurationLabel(dayTotal)}
                </caption>
                <colgroup>
                  <col className={styles["time-tracker-page__style-054"]} />
                  <col className={styles["time-tracker-page__style-055"]} />
                  <col className={styles["time-tracker-page__style-056"]} />
                  <col className={styles["time-tracker-page__style-057"]} />
                  <col className={styles["time-tracker-page__style-058"]} />
                  <col className={styles["time-tracker-page__style-059"]} />
                </colgroup>
                <thead className={styles["time-tracker-page__style-060"]}>
                  <tr>
                    <th scope="col">Task</th>
                    <th scope="col">Project and labels</th>
                    <th scope="col">Time range</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Approval</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className={styles["time-tracker-page__style-061"]}>
                  {dayEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      projects={projects}
                      onRestart={onRestart}
                      onUpdateEntry={onUpdateEntry}
                      onEntryApprovalChange={onEntryApprovalChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EntryMobileCard({ entry, projects, onRestart, onUpdateEntry, onEntryApprovalChange }) {
  const project = getProject(projects, entry.projectId);

  return (
    <article className={styles["time-tracker-page__style-062"]} aria-label={`${entry.description} time entry`}>
      <div className={styles["time-tracker-page__style-063"]}>
        <div className={styles["time-tracker-page__style-064"]}>
          <p className={styles["time-tracker-page__style-065"]}>{entry.description}</p>
          <p className={styles["time-tracker-page__style-066"]}>{entry.source || "Task"}</p>
        </div>
        <span className={styles["time-tracker-page__style-067"]}>
          {formatDurationLabel(entry.durationSeconds)}
        </span>
      </div>
      <div className={styles["time-tracker-page__style-068"]}>
        <ProjectBadge project={project} />
        <div className={styles["time-tracker-page__style-069"]}>
          <CalendarDays className={styles["time-tracker-page__style-070"]} aria-hidden="true" />
          <span>{entry.timeRange}</span>
        </div>
        <div className={styles["time-tracker-page__style-071"]}>
          <BillableBadge billable={entry.billable} />
          <StatusBadge status={entry.approvalStatus || "Approved"} />
          <TagList tags={entry.tags} />
        </div>
        <EntryActions
          entry={entry}
          onRestart={onRestart}
          onUpdateEntry={onUpdateEntry}
          onEntryApprovalChange={onEntryApprovalChange}
        />
      </div>
    </article>
  );
}

function EntryRow({ entry, projects, onRestart, onUpdateEntry, onEntryApprovalChange }) {
  const project = getProject(projects, entry.projectId);

  return (
    <tr className={styles["time-tracker-page__style-072"]}>
      <td className={styles["time-tracker-page__style-073"]}>
        <div className={styles["time-tracker-page__style-074"]}>
          <p className={styles["time-tracker-page__style-075"]}>{entry.description}</p>
          <p className={styles["time-tracker-page__style-076"]}>{entry.source || "Task"}</p>
        </div>
      </td>
      <td className={styles["time-tracker-page__style-077"]}>
        <div className={styles["time-tracker-page__style-078"]}>
          <ProjectBadge project={project} showMarker={false} />
          <div className={styles["time-tracker-page__style-079"]}>
            <BillableBadge billable={entry.billable} compact plain />
            <TagList tags={entry.tags} compact plain />
          </div>
        </div>
      </td>
      <td className={styles["time-tracker-page__style-080"]}>
        <div className={styles["time-tracker-page__style-081"]}>
          <CalendarDays className={styles["time-tracker-page__style-082"]} aria-hidden="true" />
          <span className={styles["time-tracker-page__style-083"]}>{entry.timeRange}</span>
        </div>
      </td>
      <td className={styles["time-tracker-page__style-084"]}>
        <span className={styles["time-tracker-page__style-085"]}>{formatDurationLabel(entry.durationSeconds)}</span>
        <span className={styles["time-tracker-page__style-086"]}> hours and minutes</span>
      </td>
      <td className={styles["time-tracker-page__style-087"]}>
        <StatusBadge status={entry.approvalStatus || "Approved"} compact />
      </td>
      <td className={styles["time-tracker-page__style-088"]}>
        <EntryActions
          entry={entry}
          onRestart={onRestart}
          onUpdateEntry={onUpdateEntry}
          onEntryApprovalChange={onEntryApprovalChange}
          compact
        />
      </td>
    </tr>
  );
}

function EntryActions({ entry, onRestart, onUpdateEntry, onEntryApprovalChange, compact = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = `entry-menu-${entry.id}`;
  const nextBillableLabel = entry.billable ? "Mark non-billable" : "Mark billable";
  const nextApprovalStatus = entry.approvalStatus === "Approved" ? "Pending" : "Approved";
  const approvalLabel = entry.approvalStatus === "Approved" ? "Send to approvals" : "Approve entry";
  const actionButtonClass = compact
    ? "focus-ring inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-transparent bg-brand-100 text-black hover:bg-brand-200"
    : "focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-transparent bg-brand-100 text-black hover:bg-brand-200";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={styles["time-tracker-page__style-089"]}>
      <button
        type="button"
        onClick={() => onRestart(entry)}
        className={actionButtonClass}
        aria-label={`Restart timer for ${entry.description}`}
      >
        <Play className={styles["time-tracker-page__style-090"]} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeMenu();
          }
        }}
        className={actionButtonClass}
        aria-label={`More options for ${entry.description}`}
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
      >
        <Ellipsis className={styles["time-tracker-page__style-091"]} aria-hidden="true" />
      </button>
      {menuOpen ? (
        <div
          id={menuId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeMenu();
            }
          }}
          className={cx(
            styles["time-tracker-page__entry-menu"],
            compact
              ? styles["time-tracker-page__entry-menu--compact"]
              : styles["time-tracker-page__entry-menu--regular"]
          )}
        >
          <button
            type="button"
            onClick={() => {
              onRestart(entry);
              closeMenu();
            }}
            className={styles["time-tracker-page__style-092"]}
          >
            <Play className={styles["time-tracker-page__style-093"]} aria-hidden="true" />
            Restart timer
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateEntry(entry.id, { billable: !entry.billable });
              closeMenu();
            }}
            className={styles["time-tracker-page__style-094"]}
          >
            <PoundSterling className={styles["time-tracker-page__style-095"]} aria-hidden="true" />
            {nextBillableLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onEntryApprovalChange(entry.id, nextApprovalStatus);
              closeMenu();
            }}
            className={styles["time-tracker-page__style-096"]}
          >
            <FileCheck2 className={styles["time-tracker-page__style-097"]} aria-hidden="true" />
            {approvalLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
