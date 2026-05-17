import React, { useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Download,
  DollarSign,
  Ellipsis,
  FileCheck2,
  Gauge,
  GitBranch,
  GripVertical,
  LucideCalendarClock,
  PauseCircle,
  Play,
  Plus,
  Receipt,
  Search,
  Tags,
  TimerReset,
  Trash2,
  X
} from "lucide-react";
import {
  ActivityList,
  BillableBadge,
  DataTable,
  FilterSelect,
  FormField,
  GhostButton,
  MarginBadge,
  MetricCard,
  Panel,
  PrimaryButton,
  ProjectBadge,
  RowActions,
  Select,
  StatusBadge,
  TagList
} from "./components/ui.jsx";
import { AppLayout } from "./components/templates/index.js";
import {
  escapeCsvCell,
  formatDuration,
  formatTimer,
  groupDurationsByProject,
  groupEntriesByDay,
  parseDurationInput,
  sumBillableDurations,
  sumDurations
} from "./timeUtils.js";
import { DEFAULT_REPORT_FILTERS, PROJECT_COLORS } from "./domain/appConfig.js";
import {
  formatReadableDate,
  formatRelativeTime,
  getDayLabel,
  getLocalDateKey,
  sortDayLabels
} from "./domain/dateUtils.js";
import {
  calculateMarginPercent,
  currency,
  formatDurationLabel,
  formatMargin,
  percent,
  sessionDuration
} from "./domain/formatters.js";
import {
  parseTags,
  setFormValue,
  slugify,
  validatePlainFields
} from "./domain/formUtils.js";
import { sectionSubtitle } from "./domain/navigation.js";
import {
  getEmploymentGrade,
  getProject,
  getProjectFinancialMetrics,
  memberName,
  projectName,
  projectStyle
} from "./domain/projectUtils.js";
import { scheduleDurationSeconds } from "./domain/scheduleUtils.js";
import { buildTimesheetImportPreview } from "./domain/timesheetImport.js";
import {
  buildGanttTimeline,
  getScheduleEndDateKey,
  getTimelineSlotKeyForDate,
  isDateKeyInRange,
  scheduleItemIntersectsSlot,
  scheduleSpansMultipleDays
} from "./ganttUtils.js";
import { useCreativeOperationsApp } from "./hooks/useCreativeOperationsApp.js";

function App() {
  const {
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
  } = useCreativeOperationsApp();

  return (
    <AppLayout
      activeSection={activeSection}
      activeUtility={activeUtility}
      activeProjects={activeProjects}
      currentUser={teamMembers.find((member) => member.id === "ava") || teamMembers[0]}
      employmentGrades={employmentGrades}
      onNavigate={handleNavigate}
      onQuickClockToggle={handleQuickClockToggle}
      onQuickDescriptionChange={setQuickDescription}
      onQuickProjectChange={setQuickProjectId}
      onSettingChange={updateWorkspaceSetting}
      onUtilityClose={() => setActiveUtility(null)}
      onUtilityToggle={toggleUtility}
      pageSubtitle={sectionSubtitle(activeSection)}
      pendingApprovalCount={pendingApprovalCount}
      quickDescription={quickDescription}
      quickProjectId={quickProjectId}
      quickRunning={quickRunning}
      quickSeconds={quickSeconds}
      statusMessage={statusMessage}
      weeklyTotal={weeklyTotal}
      workspaceSettings={workspaceSettings}
    >
      {activeSection === "Time Tracker" ? (
        <TimeTrackerPage
          {...commonProps}
          description={description}
          descriptionRef={descriptionRef}
          tagText={tagText}
          projectId={projectId}
          billable={billable}
          timerSeconds={timerSeconds}
          isRunning={isRunning}
          manualMode={manualMode}
          manualDate={manualDate}
          manualDuration={manualDuration}
          error={error}
          onDescriptionChange={setDescription}
          onTagTextChange={setTagText}
          onProjectChange={setProjectId}
          onBillableChange={setBillable}
          onManualModeChange={setManualMode}
          onManualDateChange={setManualDate}
          onManualDurationChange={setManualDuration}
          onStartStop={handleStartStop}
          onManualSave={handleManualSave}
        />
      ) : null}
      {activeSection === "Timesheet" ? <TimesheetPage {...commonProps} /> : null}
      {activeSection === "Week ahead" ? <CalendarPage {...commonProps} /> : null}
      {activeSection === "Schedule" ? <SchedulePage {...commonProps} /> : null}
      {activeSection === "Expenses" ? <ExpensesPage {...commonProps} /> : null}
      {activeSection === "Time Off" ? <TimeOffPage {...commonProps} /> : null}
      {activeSection === "Dashboard" ? <DashboardPage {...commonProps} /> : null}
      {activeSection === "Reports" ? <ReportsPage {...commonProps} /> : null}
      {activeSection === "Activity" ? <ActivityPage {...commonProps} /> : null}
      {activeSection === "Kiosks" ? <KiosksPage {...commonProps} /> : null}
      {activeSection === "Approvals" ? <ApprovalsPage {...commonProps} /> : null}
      {activeSection === "Projects" ? <ProjectsPage {...commonProps} /> : null}
      {activeSection === "Team" ? <TeamPage {...commonProps} /> : null}
    </AppLayout>
  );
}

function TimeTrackerPage({
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
          <div className="rounded-full border border-transparent bg-brand-100 px-3 py-2 text-sm">
            <span className="font-medium text-[#5e5e5e]">Week total </span>
            <span className="font-semibold text-slate-950" aria-live="polite">
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
      className="rounded-2xl border border-brand-200 bg-white p-4"
    >
      <h2 id="new-entry-title" className="sr-only">
        New time entry
      </h2>

      <form
        className="flex flex-wrap items-start gap-2 xl:grid xl:grid-cols-[minmax(280px,1fr)_minmax(160px,180px)_minmax(96px,110px)_48px_110px_90px_48px_48px]"
        onSubmit={(event) => {
          event.preventDefault();
          onStartStop();
        }}
        noValidate
      >
        <div className="min-w-[min(100%,280px)] flex-[1_1_320px] xl:min-w-0 xl:flex-none">
          <label htmlFor="task-description" className="sr-only">
            Task description
          </label>
          <input
            ref={descriptionRef}
            id="task-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className={`focus-ring min-h-12 w-full rounded-md border bg-brand-100 px-4 text-lg text-black placeholder:text-slate-500 ${
              error ? "border-red-500" : "border-slate-200"
            }`}
            placeholder="What are you working on?"
            aria-describedby={`task-helper${error ? " task-error" : ""}`}
            aria-invalid={error ? "true" : "false"}
          />
          <p id="task-helper" className="sr-only">
            Required. Plain text only.
          </p>
          {error ? (
            <p id="task-error" className="mt-1 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-w-[min(100%,220px)] flex-[0_1_240px] xl:min-w-0 xl:flex-none">
          <label htmlFor="project-selector" className="sr-only">
            Project
          </label>
          <select
            id="project-selector"
            value={projectId}
            onChange={(event) => onProjectChange(event.target.value)}
            className="focus-ring min-h-12 w-full rounded-md border border-transparent bg-brand-100 px-4 text-sm font-medium text-black"
          >
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client}
              </option>
            ))}
          </select>
        </div>

        <label className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black flex min-h-12 min-w-[min(100%,150px)] flex-[0_1_160px] items-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 text-sm font-medium text-black xl:min-w-0 xl:flex-none">
          <Tags className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <span className="sr-only">Tags</span>
          <input
            value={tagText}
            onChange={(event) => onTagTextChange(event.target.value)}
            placeholder="Tags"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </label>

        <span className="group relative inline-flex min-w-12">
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
            className={`focus-ring inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border px-0 ${
              billable
                ? "border-transparent bg-black text-white"
                : "border-transparent bg-brand-100 text-black hover:bg-brand-200"
            }`}
          >
            <DollarSign className="h-5 w-5" aria-hidden="true" />
          </button>
          <span
            id="billable-tooltip"
            role="tooltip"
            className="invisible absolute bottom-full right-0 z-30 mb-2 w-64 rounded-md bg-slate-950 px-3 py-2 text-left text-xs text-white opacity-0 shadow-soft group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <span className="block font-bold">{billable ? "Billable" : "Non-billable"}</span>
            <span className="mt-1 block text-slate-200">
              {billable
                ? "Included in billable reports. Click to mark this entry as internal time."
                : "Excluded from billable reports. Click to mark this entry as client-billable."}
            </span>
          </span>
        </span>

        <div
          className="flex min-h-12 min-w-0 items-center justify-center rounded-full border border-transparent bg-brand-100 px-3 font-mono text-lg font-semibold tabular-nums text-black"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Timer ${formatTimer(timerSeconds)}`}
        >
          {formatTimer(timerSeconds)}
        </div>

        <button
          type="submit"
          className={`focus-ring inline-flex min-h-12 items-center justify-center rounded-full px-4 text-sm font-medium ${
            isRunning
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-black text-white hover:bg-brand-800"
          }`}
          aria-label={isRunning ? "Stop timer and save entry" : "Start timer"}
        >
          {isRunning ? "STOP" : "START"}
        </button>

        <span className="group relative inline-flex min-w-12">
          <button
            type="button"
            onClick={() => onManualModeChange(!manualMode)}
            aria-expanded={manualMode}
            aria-describedby="manual-entry-tooltip"
            className="focus-ring inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-transparent bg-brand-100 text-black hover:bg-brand-200"
            aria-label="Manual time entry options"
          >
            <TimerReset className="h-5 w-5" aria-hidden="true" />
          </button>
          <span
            id="manual-entry-tooltip"
            role="tooltip"
            className="invisible absolute bottom-full right-0 z-30 mb-2 w-60 rounded-md bg-slate-950 px-3 py-2 text-left text-xs text-white opacity-0 shadow-soft group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <span className="block font-bold">Manual time</span>
            <span className="mt-1 block text-slate-200">Open date and duration fields for a manual entry.</span>
          </span>
        </span>
        <span className="relative inline-flex min-w-12">
          <button
            type="button"
            onClick={() => setOptionsOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOptionsOpen(false);
              }
            }}
            className="focus-ring inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-transparent bg-brand-100 text-black hover:bg-brand-200"
            aria-label="More time entry options"
            aria-haspopup="menu"
            aria-expanded={optionsOpen}
            aria-controls={optionsId}
          >
            <Ellipsis className="h-5 w-5" aria-hidden="true" />
          </button>
          {optionsOpen ? (
            <div
              id={optionsId}
              role="menu"
              aria-label="More time entry options"
              className="absolute right-0 top-14 z-30 w-56 rounded-2xl border border-brand-200 bg-white p-1 text-left shadow-soft"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onManualModeChange(!manualMode);
                  setOptionsOpen(false);
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-medium text-black hover:bg-brand-100"
              >
                <TimerReset className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {manualMode ? "Hide manual fields" : "Add manual time"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onBillableChange(!billable);
                  setOptionsOpen(false);
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-medium text-black hover:bg-brand-100"
              >
                <DollarSign className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {billable ? "Mark internal" : "Mark billable"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDescriptionChange("");
                  onTagTextChange("");
                  setOptionsOpen(false);
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-medium text-black hover:bg-brand-100"
              >
                <X className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Clear task fields
              </button>
            </div>
          ) : null}
        </span>
      </form>

      {manualMode ? (
        <form
          className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-[180px_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            onManualSave();
          }}
        >
          <FormField label="Manual date" htmlFor="manual-date">
            <input
              id="manual-date"
              type="date"
              value={manualDate}
              onChange={(event) => onManualDateChange(event.target.value)}
              className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
            />
          </FormField>
          <FormField label="Duration" htmlFor="manual-duration" helper="Use minutes or hours:minutes.">
            <input
              id="manual-duration"
              value={manualDuration}
              onChange={(event) => onManualDurationChange(event.target.value)}
              className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
              placeholder="1:30"
            />
          </FormField>
          <div className="flex items-end">
            <button
              type="submit"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
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
    <div className="divide-y divide-slate-200">
      {dayOrder.map((day) => {
        const dayEntries = entriesByDay[day] || [];
        const dayTotal = sumDurations(dayEntries);

        return (
          <section key={day} aria-labelledby={`${slugify(day)}-heading`}>
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 sm:px-5">
              <h3
                id={`${slugify(day)}-heading`}
                className="text-sm font-semibold uppercase tracking-normal text-slate-700"
              >
                {day}
              </h3>
              <span className="text-sm font-semibold text-slate-900">
                {formatDurationLabel(dayTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] table-fixed" aria-label={`${day} time entries`}>
                <caption className="sr-only">
                  {day} time entries total {formatDurationLabel(dayTotal)}
                </caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Task</th>
                    <th scope="col">Project and labels</th>
                    <th scope="col">Time range</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Approval</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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

function EntryRow({ entry, projects, onRestart, onUpdateEntry, onEntryApprovalChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const project = getProject(projects, entry.projectId);
  const menuId = `entry-menu-${entry.id}`;
  const nextBillableLabel = entry.billable ? "Mark non-billable" : "Mark billable";
  const nextApprovalStatus = entry.approvalStatus === "Approved" ? "Pending" : "Approved";
  const approvalLabel = entry.approvalStatus === "Approved" ? "Send to approvals" : "Approve entry";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <tr className="bg-white hover:bg-slate-50">
      <td className="w-[30%] px-4 py-4 align-middle sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-slate-950">{entry.description}</p>
          <p className="mt-1 text-xs text-slate-600">{entry.source || "Task"}</p>
        </div>
      </td>
      <td className="w-[27%] px-3 py-4 align-middle">
        <div className="grid gap-2">
          <ProjectBadge project={project} />
          <div className="flex flex-wrap items-center gap-1.5">
            <BillableBadge billable={entry.billable} />
            <TagList tags={entry.tags} />
          </div>
        </div>
      </td>
      <td className="w-[18%] px-3 py-4 align-middle">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span>{entry.timeRange}</span>
        </div>
      </td>
      <td className="w-[10%] px-3 py-4 text-right align-middle text-sm font-semibold text-slate-950">
        <span className="font-mono tabular-nums">{formatDurationLabel(entry.durationSeconds)}</span>
        <span className="sr-only"> hours and minutes</span>
      </td>
      <td className="w-[8%] px-3 py-4 align-middle">
        <StatusBadge status={entry.approvalStatus || "Approved"} />
      </td>
      <td className="w-[7%] px-3 py-4 align-middle">
        <div className="relative flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onRestart(entry)}
            className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-transparent bg-brand-100 text-black hover:bg-brand-200"
            aria-label={`Restart timer for ${entry.description}`}
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeMenu();
              }
            }}
            className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-transparent bg-brand-100 text-black hover:bg-brand-200"
            aria-label={`More options for ${entry.description}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
          >
            <Ellipsis className="h-4 w-4" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div
              id={menuId}
              role="menu"
              aria-label={`Options for ${entry.description}`}
              className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-brand-200 bg-white p-1 text-left shadow-soft"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onRestart(entry);
                  closeMenu();
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-medium text-black hover:bg-brand-100"
              >
                <Play className="h-4 w-4 text-black" aria-hidden="true" />
                Restart timer
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onUpdateEntry(entry.id, { billable: !entry.billable });
                  closeMenu();
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-medium text-black hover:bg-brand-100"
              >
                <DollarSign className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {nextBillableLabel}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onEntryApprovalChange(entry.id, nextApprovalStatus);
                  closeMenu();
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-full px-4 text-sm font-medium text-black hover:bg-brand-100"
              >
                <FileCheck2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {approvalLabel}
              </button>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function DashboardPage({
  weeklyEntries,
  weeklyTotal,
  projects,
  expenses,
  pendingApprovalCount,
  activityItems,
  onNavigate
}) {
  const billableTotal = sumBillableDurations(weeklyEntries);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const projectGroups = groupDurationsByProject(weeklyEntries);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
        <MetricCard label="Tracked this week" value={formatDurationLabel(weeklyTotal)} helper="All approved and pending time" icon={Clock3} />
        <MetricCard label="Billable time" value={formatDurationLabel(billableTotal)} helper={`${percent(billableTotal, weeklyTotal)}% of tracked time`} icon={DollarSign} />
        <MetricCard label="Pending approvals" value={String(pendingApprovalCount)} helper="Time, expenses, and time off" icon={FileCheck2} />
        <MetricCard label="Expenses logged" value={currency(expenseTotal)} helper={`${expenses.length} expense records`} icon={Receipt} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Panel
          title="Project utilization"
          subtitle="This week by project."
          action={<GhostButton onClick={() => onNavigate("Reports")} icon={Gauge}>Open reports</GhostButton>}
        >
          <div className="space-y-4 p-4 sm:p-5">
            {Object.entries(projectGroups).map(([currentProjectId, seconds]) => {
              const project = getProject(projects, currentProjectId);
              const style = projectStyle(project);
              return (
                <div key={currentProjectId}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <ProjectBadge project={project} />
                    <span className="font-mono font-semibold text-slate-950">{formatDurationLabel(seconds)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${style.dot}`}
                      style={{ width: `${Math.max(6, percent(seconds, weeklyTotal))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent activity" subtitle="Latest workspace changes.">
          <ActivityList items={activityItems.slice(0, 6)} />
        </Panel>
      </div>
    </>
  );
}

function TimesheetPage({
  entries,
  projects,
  activeProjects,
  teamMembers,
  weekDays,
  onAddEntry,
  onAddEntries
}) {
  const [form, setForm] = useState({
    description: "Client review",
    projectId: activeProjects[0]?.id || "acme",
    memberId: teamMembers[0]?.id || "ava",
    dateKey: weekDays.find((day) => day.isToday)?.dateKey || weekDays[0].dateKey,
    duration: "1:00",
    billable: true
  });
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const validImportRows = importPreview.filter((row) => row.errors.length === 0);

  function submitTimesheetEntry(event) {
    event.preventDefault();
    const durationSeconds = parseDurationInput(form.duration);
    if (!durationSeconds || validatePlainFields([form.description])) {
      return;
    }
    onAddEntry(
      {
        description: form.description.trim(),
        projectId: form.projectId,
        memberId: form.memberId,
        dateKey: form.dateKey,
        durationSeconds,
        billable: form.billable,
        tags: ["Timesheet"],
        timeRange: "Timesheet",
        source: "Timesheet"
      },
      "Submitted timesheet"
    );
    setForm((current) => ({ ...current, description: "", duration: "1:00" }));
  }

  function previewTimesheetImport(sourceText = importText) {
    const previewRows = buildTimesheetImportPreview({
      csvText: sourceText,
      projects: activeProjects,
      teamMembers
    });
    setImportPreview(previewRows);
    setImportStatus(
      previewRows.length
        ? `${previewRows.filter((row) => row.errors.length === 0).length} of ${previewRows.length} rows ready to import.`
        : "No importable rows found. Include a header row and at least one timesheet row."
    );
  }

  function importTimesheetRows() {
    if (!validImportRows.length) {
      setImportStatus("There are no valid rows to import.");
      return;
    }

    onAddEntries(
      validImportRows.map((row) => row.entryDraft),
      "Imported timesheet"
    );
    setImportText("");
    setImportPreview([]);
    setImportStatus(`${validImportRows.length} rows imported as pending timesheet entries.`);
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setImportText(text);
      previewTimesheetImport(text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="grid gap-5">
      <Panel title="Weekly timesheet" subtitle="Project totals across the current week.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <th scope="col" className="w-[22%] px-4 py-3">Project</th>
                {weekDays.map((day) => (
                  <th key={day.dateKey} scope="col" className="px-3 py-3 text-center">
                    <span>{day.shortName}</span>
                    <span className="block font-normal normal-case text-slate-500">{day.displayDate}</span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeProjects.map((project) => {
                const rowEntries = entries.filter((entry) => entry.projectId === project.id);
                const rowTotal = sumDurations(rowEntries);
                return (
                  <tr key={project.id} className="bg-white">
                    <th scope="row" className="px-4 py-4 text-left">
                      <ProjectBadge project={project} />
                    </th>
                    {weekDays.map((day) => {
                      const cellTotal = sumDurations(
                        rowEntries.filter((entry) => entry.dateKey === day.dateKey)
                      );
                      return (
                        <td key={day.dateKey} className="px-3 py-4 text-center font-mono text-sm font-semibold text-slate-900">
                          {cellTotal ? formatDurationLabel(cellTotal) : "0m"}
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-right font-mono text-sm font-bold text-slate-950">
                      {formatDurationLabel(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Add timesheet row" subtitle="Manual entries are added as pending time.">
        <form className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-6" onSubmit={submitTimesheetEntry}>
          <FormField label="Task" htmlFor="timesheet-task">
            <input id="timesheet-task" value={form.description} onChange={(event) => setFormValue(setForm, "description", event.target.value)} className="input" />
          </FormField>
          <FormField label="Project" htmlFor="timesheet-project">
            <Select id="timesheet-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>
              {activeProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Person" htmlFor="timesheet-person">
            <Select id="timesheet-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>
              {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Date" htmlFor="timesheet-date">
            <input id="timesheet-date" type="date" value={form.dateKey} onChange={(event) => setFormValue(setForm, "dateKey", event.target.value)} className="input" />
          </FormField>
          <FormField label="Duration" htmlFor="timesheet-duration">
            <input id="timesheet-duration" value={form.duration} onChange={(event) => setFormValue(setForm, "duration", event.target.value)} className="input" />
          </FormField>
          <div className="flex items-end gap-3">
            <label className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black inline-flex min-h-11 items-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 text-sm font-medium text-black">
              <input type="checkbox" checked={form.billable} onChange={(event) => setFormValue(setForm, "billable", event.target.checked)} />
              Billable
            </label>
            <PrimaryButton type="submit" icon={Plus}>Add</PrimaryButton>
          </div>
        </form>
      </Panel>

      <Panel
        title="Import timesheet CSV"
        subtitle="Upload or paste rows with Date, Task, Project, Member, Duration, Billable, and Tags columns."
        action={
          <GhostButton
            icon={Download}
            onClick={() =>
              setImportText(
                "Date,Task,Project,Member,Duration,Billable,Tags\n2026-05-15,Imported design review,ACME,Ava Morgan,1:30,yes,Timesheet import"
              )
            }
          >
            Load sample
          </GhostButton>
        }
      >
        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <FormField label="CSV file" htmlFor="timesheet-import-file" helper="CSV only. Data stays in this browser.">
              <input
                id="timesheet-import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportFile}
                className="focus-ring block w-full rounded-md border border-transparent bg-brand-100 px-4 py-2 text-sm text-black file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </FormField>
            <FormField
              label="Paste CSV"
              htmlFor="timesheet-import-text"
              helper="Project and member can be names, IDs, or emails. Duration accepts minutes or h:mm."
            >
              <textarea
                id="timesheet-import-text"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="focus-ring min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                placeholder="Date,Task,Project,Member,Duration,Billable,Tags"
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PrimaryButton type="button" icon={Search} onClick={() => previewTimesheetImport()}>
              Preview import
            </PrimaryButton>
            <GhostButton icon={Plus} onClick={importTimesheetRows}>
              Import valid rows
            </GhostButton>
            <GhostButton
              icon={X}
              onClick={() => {
                setImportText("");
                setImportPreview([]);
                setImportStatus("");
              }}
            >
              Clear
            </GhostButton>
            {importStatus ? (
              <p className="text-sm font-semibold text-slate-700" role="status" aria-live="polite">
                {importStatus}
              </p>
            ) : null}
          </div>

          {importPreview.length ? (
            <DataTable
              columns={["Row", "Status", "Date", "Task", "Project", "Member", "Duration", "Billable", "Tags"]}
              rows={importPreview.map((row) => [
                row.rowNumber,
                row.errors.length ? (
                  <span className="font-semibold text-red-700">{row.errors.join("; ")}</span>
                ) : (
                  <span className="font-semibold text-emerald-700">Ready</span>
                ),
                row.display.dateKey || "-",
                row.display.description || "-",
                row.display.projectName || "-",
                row.display.memberName || "-",
                row.display.duration || "-",
                row.display.billable ? "Yes" : "No",
                row.display.tags?.join(", ") || "-"
              ])}
            />
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function CalendarPage({
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
    memberId: teamMembers[0]?.id || "ava",
    projectId: projects[0]?.id || "acme",
    dateKey: weekDays.find((day) => day.isToday)?.dateKey || weekDays[0].dateKey,
    start: "14:00",
    end: "15:00",
    location: "Focus block"
  });

  return (
    <div className="grid gap-5">
      <Panel title="Week ahead" subtitle="Time entries and scheduled blocks for the next seven-day planning window.">
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((day) => {
            const dayEntries = entries.filter((entry) => entry.dateKey === day.dateKey);
            const daySchedule = scheduleItems.filter((item) => item.dateKey === day.dateKey);
            return (
              <section
                key={day.dateKey}
                className={`min-h-56 rounded-2xl border p-3 ${day.isToday ? "border-black bg-brand-100" : "border-brand-200 bg-white"}`}
                aria-labelledby={`calendar-${day.dateKey}`}
              >
                <h2 id={`calendar-${day.dateKey}`} className="text-sm font-bold text-slate-950">
                  {day.shortName}
                  <span className="ml-2 font-normal text-slate-600">{day.displayDate}</span>
                </h2>
                <div className="mt-3 space-y-2">
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
                    <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">No planned work.</p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </Panel>

      <Panel title="Add week-ahead block" subtitle="Schedule lightweight blocks for people and projects.">
        <form
          className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddSchedule(form)) {
              setForm((current) => ({ ...current, location: "Focus block" }));
            }
          }}
        >
          <FormField label="Person" htmlFor="calendar-person"><Select id="calendar-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Project" htmlFor="calendar-project"><Select id="calendar-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <FormField label="Date" htmlFor="calendar-date"><input id="calendar-date" type="date" value={form.dateKey} onChange={(event) => setFormValue(setForm, "dateKey", event.target.value)} className="input" /></FormField>
          <FormField label="Start" htmlFor="calendar-start"><input id="calendar-start" type="time" value={form.start} onChange={(event) => setFormValue(setForm, "start", event.target.value)} className="input" /></FormField>
          <FormField label="End" htmlFor="calendar-end"><input id="calendar-end" type="time" value={form.end} onChange={(event) => setFormValue(setForm, "end", event.target.value)} className="input" /></FormField>
          <FormField label="Label" htmlFor="calendar-location"><input id="calendar-location" value={form.location} onChange={(event) => setFormValue(setForm, "location", event.target.value)} className="input" /></FormField>
          <div className="flex items-end">
            <PrimaryButton type="submit" icon={Plus}>Add block</PrimaryButton>
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
        className="grid gap-2 rounded-xl border border-brand-200 bg-white p-3"
        onSubmit={saveEntry}
      >
        <label className="sr-only" htmlFor={`${entry.id}-calendar-description`}>
          Task description
        </label>
        <input
          id={`${entry.id}-calendar-description`}
          value={draft.description}
          onChange={(event) => setFormValue(setDraft, "description", event.target.value)}
          className="input min-h-9 px-3 text-xs"
          aria-invalid={!draft.description.trim()}
        />
        <label className="sr-only" htmlFor={`${entry.id}-calendar-project`}>
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="sr-only" htmlFor={`${entry.id}-calendar-time`}>
              Time range
            </label>
            <input
              id={`${entry.id}-calendar-time`}
              value={draft.timeRange}
              onChange={(event) => setFormValue(setDraft, "timeRange", event.target.value)}
              className="input min-h-9 px-3 text-xs"
              placeholder="1:00 PM - 3:00 PM"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`${entry.id}-calendar-duration`}>
              Duration
            </label>
            <input
              id={`${entry.id}-calendar-duration`}
              value={draft.duration}
              onChange={(event) => setFormValue(setDraft, "duration", event.target.value)}
              className="input min-h-9 px-3 text-xs"
              placeholder="2:00"
              aria-invalid={durationSeconds <= 0}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSave}
            className="focus-ring inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-black px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-brand-300 disabled:text-black"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="focus-ring inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-100 px-3 text-xs font-medium text-black hover:bg-brand-200"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={`rounded-xl border ${style.border} ${style.soft} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-black">{entry.description}</p>
          <p className="mt-1 truncate text-xs text-[#5e5e5e]">
            {project.name} · {formatDurationLabel(entry.durationSeconds)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="focus-ring inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-white px-3 text-xs font-medium text-black hover:bg-brand-100"
          aria-label={`Edit ${entry.description}`}
        >
          Edit
        </button>
      </div>
      <p className="mt-2 text-xs font-medium text-black">{entry.timeRange}</p>
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
        className="grid gap-2 rounded-xl border border-brand-200 bg-white p-3"
        onSubmit={saveSchedule}
      >
        <label className="sr-only" htmlFor={`${item.id}-calendar-person`}>
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
        <label className="sr-only" htmlFor={`${item.id}-calendar-project`}>
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="sr-only" htmlFor={`${item.id}-calendar-start`}>
              Start time
            </label>
            <input
              id={`${item.id}-calendar-start`}
              type="time"
              value={draft.start}
              onChange={(event) => setFormValue(setDraft, "start", event.target.value)}
              className="input min-h-9 px-3 text-xs"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`${item.id}-calendar-end`}>
              End time
            </label>
            <input
              id={`${item.id}-calendar-end`}
              type="time"
              value={draft.end}
              onChange={(event) => setFormValue(setDraft, "end", event.target.value)}
              className="input min-h-9 px-3 text-xs"
            />
          </div>
        </div>
        <label className="sr-only" htmlFor={`${item.id}-calendar-location`}>
          Schedule label
        </label>
        <input
          id={`${item.id}-calendar-location`}
          value={draft.location}
          onChange={(event) => setFormValue(setDraft, "location", event.target.value)}
          className="input min-h-9 px-3 text-xs"
          aria-invalid={!draft.location.trim()}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSave}
            className="focus-ring inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-black px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-brand-300 disabled:text-black"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="focus-ring inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-100 px-3 text-xs font-medium text-black hover:bg-brand-200"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={`rounded-xl border ${style.border} ${style.soft} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-black">{memberName(item.memberId, teamMembers)}</p>
          <p className="mt-1 truncate text-xs text-[#5e5e5e]">
            {project.name} · {item.start} - {item.end}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="focus-ring inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-white px-3 text-xs font-medium text-black hover:bg-brand-100"
          aria-label={`Edit scheduled block for ${memberName(item.memberId, teamMembers)}`}
        >
          Edit
        </button>
      </div>
      <p className="mt-2 text-xs font-medium text-black">{item.location}</p>
    </article>
  );
}

function SchedulePage({
  scheduleItems,
  projects,
  teamMembers,
  weekDays,
  projectDependencies,
  onAddSchedule,
  onScheduleStatusChange,
  onMoveScheduleProject,
  onAddDependency,
  onDeleteDependency
}) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "ava",
    projectId: projects[0]?.id || "acme",
    dateKey: weekDays.find((day) => day.isToday)?.dateKey || weekDays[0].dateKey,
    start: "09:00",
    end: "17:00",
    location: "Remote"
  });

  return (
    <div className="grid gap-5">
      <GanttChart
        scheduleItems={scheduleItems}
        projects={projects}
        teamMembers={teamMembers}
        weekDays={weekDays}
        projectDependencies={projectDependencies}
        onAddSchedule={onAddSchedule}
        onMoveScheduleProject={onMoveScheduleProject}
        onAddDependency={onAddDependency}
        onDeleteDependency={onDeleteDependency}
      />

      <Panel title="Team schedule" subtitle="Create, publish, and complete scheduled work blocks.">
        <form
          className="grid gap-4 border-b border-slate-200 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddSchedule(form)) {
              setForm((current) => ({ ...current, location: "Remote" }));
            }
          }}
        >
          <FormField label="Person" htmlFor="schedule-person"><Select id="schedule-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Project" htmlFor="schedule-project"><Select id="schedule-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <FormField label="Date" htmlFor="schedule-date"><input id="schedule-date" type="date" value={form.dateKey} onChange={(event) => setFormValue(setForm, "dateKey", event.target.value)} className="input" /></FormField>
          <FormField label="Start" htmlFor="schedule-start"><input id="schedule-start" type="time" value={form.start} onChange={(event) => setFormValue(setForm, "start", event.target.value)} className="input" /></FormField>
          <FormField label="End" htmlFor="schedule-end"><input id="schedule-end" type="time" value={form.end} onChange={(event) => setFormValue(setForm, "end", event.target.value)} className="input" /></FormField>
          <FormField label="Location" htmlFor="schedule-location"><input id="schedule-location" value={form.location} onChange={(event) => setFormValue(setForm, "location", event.target.value)} className="input" /></FormField>
          <div className="flex items-end"><PrimaryButton type="submit" icon={Plus}>Add shift</PrimaryButton></div>
        </form>
        <DataTable
          columns={["Person", "Project", "Date", "Time", "Location", "Status", "Actions"]}
          rows={scheduleItems.map((item) => [
            memberName(item.memberId, teamMembers),
            <ProjectBadge project={getProject(projects, item.projectId)} />,
            formatReadableDate(item.dateKey),
            `${item.start} - ${item.end}`,
            item.location,
            <StatusBadge status={item.status} />,
            <RowActions
              primaryLabel="Publish"
              primaryIcon={Check}
              primaryDisabled={item.status === "Published"}
              onPrimary={() => onScheduleStatusChange(item.id, "Published")}
              secondaryLabel="Complete"
              secondaryIcon={PauseCircle}
              onSecondary={() => onScheduleStatusChange(item.id, "Completed")}
            />
          ])}
        />
      </Panel>
    </div>
  );
}

function GanttChart({
  scheduleItems,
  projects,
  teamMembers,
  weekDays,
  projectDependencies,
  onAddSchedule,
  onMoveScheduleProject,
  onAddDependency,
  onDeleteDependency
}) {
  const [dependencyForm, setDependencyForm] = useState({
    fromProjectId: projects[0]?.id || "",
    toProjectId: projects[1]?.id || projects[0]?.id || "",
    label: "Design approval before build"
  });
  const [timelineMode, setTimelineMode] = useState("Month");
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
    gridTemplateColumns: `220px repeat(${timeline.slots.length}, minmax(${timeline.slotMinWidth}px, 1fr))`,
    minWidth: `${Math.max(980, 220 + timeline.slots.length * timeline.slotMinWidth)}px`
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

  return (
    <Panel
      title="Resource plan"
      subtitle="Drag people between project lanes, then switch the timeline to plan the week, month, or year ahead."
      action={
        <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 text-sm font-medium text-black">
          <GitBranch className="h-4 w-4 text-black" aria-hidden="true" />
          <span>{formatDurationLabel(assignedSeconds)} scheduled</span>
        </div>
      }
    >
      <div className="grid gap-4 border-b border-slate-200 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
        <FormField label="Timeline" htmlFor="gantt-timeline">
          <Select id="gantt-timeline" value={timelineMode} onChange={setTimelineMode}>
            <option value="Week">Week</option>
            <option value="Month">Month ahead</option>
            <option value="Year">Year ahead</option>
          </Select>
        </FormField>
        <FormField label="Start date" htmlFor="gantt-start-date">
          <input
            id="gantt-start-date"
            type="date"
            value={timelineStart}
            onChange={(event) => setTimelineStart(event.target.value)}
            className="input"
          />
        </FormField>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-600">Planning range</p>
          <p className="mt-1 font-semibold text-slate-950">{timeline.rangeLabel}</p>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-slate-200">
        <div style={timelineGridStyle}>
          <div className="grid border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600" style={timelineGridStyle}>
            <div className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-4 py-3">Project lane</div>
            {timeline.slots.map((slot) => (
              <div
                key={slot.key}
                className={`border-r border-slate-200 px-3 py-3 last:border-r-0 ${slot.isToday ? "bg-brand-50 text-brand-800" : ""}`}
              >
                <span>{slot.label}</span>
                <span className="ml-1 font-semibold normal-case text-slate-500">{slot.subLabel}</span>
              </div>
            ))}
          </div>

          {projects.map((project) => {
            const projectScheduleItems = timelineScheduleItems.filter((item) => item.projectId === project.id);
            return (
              <section
                key={project.id}
                aria-label={`${project.name} schedule lane`}
                className="grid border-b border-slate-100 last:border-b-0"
                style={timelineGridStyle}
              >
                <div className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-4 shadow-[8px_0_14px_rgba(15,23,42,0.04)]">
                  <ProjectBadge project={project} />
                  <p className="mt-2 text-xs text-slate-600">{project.client}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    {formatDurationLabel(projectScheduleItems.reduce((sum, item) => sum + scheduleDurationSeconds(item), 0))}
                    <span className="font-normal text-slate-500"> scheduled</span>
                  </p>
                </div>

                {timeline.slots.map((slot) => {
                  const slotItems = projectScheduleItems.filter((item) => scheduleItemIntersectsSlot(item, slot));
                  return (
                    <div
                      key={`${project.id}-${slot.key}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => handleDrop(event, project.id, slot)}
                      className={`min-h-28 border-r border-slate-100 p-2 last:border-r-0 ${slot.isWeekend ? "bg-slate-100/70" : "bg-slate-50/60"} ${slot.isToday ? "bg-brand-50/60" : ""}`}
                      aria-label={`Drop assignments onto ${project.name} during ${slot.accessibleLabel}`}
                    >
                      <div className={`grid min-h-24 gap-2 rounded-md border border-dashed p-2 ${slotItems.length ? "border-slate-300 bg-white shadow-sm" : "border-slate-200 bg-white/70"}`}>
                        {slotItems.length ? (
                          slotItems.map((item) => (
                            <GanttAssignmentCard
                              key={item.id}
                              item={item}
                              slot={slot}
                              projects={projects}
                              teamMembers={teamMembers}
                              timelineSlots={timeline.slots}
                              onDragStart={handleDragStart}
                              onMoveScheduleProject={onMoveScheduleProject}
                            />
                          ))
                        ) : (
                          <span className="self-center text-center text-xs font-semibold text-slate-400">
                            Drop here
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="dependency-list-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 id="dependency-list-heading" className="text-sm font-bold text-slate-950">
              Dependencies
            </h3>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {projectDependencies.length} links
            </span>
          </div>
          <ul className="grid gap-3">
            {projectDependencies.length ? projectDependencies.map((dependency) => (
              <li key={dependency.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProjectBadge project={getProject(projects, dependency.fromProjectId)} />
                      <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <ProjectBadge project={getProject(projects, dependency.toProjectId)} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{dependency.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteDependency(dependency.id)}
                    className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    aria-label={`Delete dependency from ${projectName(dependency.fromProjectId, projects)} to ${projectName(dependency.toProjectId, projects)}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            )) : (
              <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">
                No dependencies yet.
              </li>
            )}
          </ul>
        </section>

        <div className="grid gap-4">
          <form className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4" onSubmit={handlePlanSubmit}>
            <div>
              <h3 className="text-sm font-bold text-slate-950">Plan assignment</h3>
              <p className="text-xs text-slate-600">{timeline.rangeLabel}</p>
            </div>
            <FormField label="Person" htmlFor="gantt-plan-person"><Select id="gantt-plan-person" value={planForm.memberId} onChange={(value) => setFormValue(setPlanForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
            <FormField label="Project" htmlFor="gantt-plan-project"><Select id="gantt-plan-project" value={planForm.projectId} onChange={(value) => setFormValue(setPlanForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
            <FormField label="Period" htmlFor="gantt-plan-period"><Select id="gantt-plan-period" value={planForm.slotKey} onChange={(value) => setFormValue(setPlanForm, "slotKey", value)}>{timeline.slots.map((slot) => <option key={slot.key} value={slot.key}>{slot.selectLabel}</option>)}</Select></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start" htmlFor="gantt-plan-start"><input id="gantt-plan-start" type="time" value={planForm.start} onChange={(event) => setFormValue(setPlanForm, "start", event.target.value)} className="input" /></FormField>
              <FormField label="End" htmlFor="gantt-plan-end"><input id="gantt-plan-end" type="time" value={planForm.end} onChange={(event) => setFormValue(setPlanForm, "end", event.target.value)} className="input" /></FormField>
            </div>
            <FormField label="Label" htmlFor="gantt-plan-location" helper="Plain text only."><input id="gantt-plan-location" value={planForm.location} onChange={(event) => setFormValue(setPlanForm, "location", event.target.value)} className="input" /></FormField>
            <PrimaryButton type="submit" icon={Plus}>Add to plan</PrimaryButton>
          </form>

          <form className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4" onSubmit={handleDependencySubmit}>
            <div>
              <h3 className="text-sm font-bold text-slate-950">Add dependency</h3>
              <p className="text-xs text-slate-600">Link projects where one should finish before another starts.</p>
            </div>
            <FormField label="From project" htmlFor="dependency-from"><Select id="dependency-from" value={dependencyForm.fromProjectId} onChange={(value) => setFormValue(setDependencyForm, "fromProjectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
            <FormField label="To project" htmlFor="dependency-to"><Select id="dependency-to" value={dependencyForm.toProjectId} onChange={(value) => setFormValue(setDependencyForm, "toProjectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
            <FormField label="Dependency note" htmlFor="dependency-label" helper="Plain text only."><input id="dependency-label" value={dependencyForm.label} onChange={(event) => setFormValue(setDependencyForm, "label", event.target.value)} className="input" /></FormField>
            <PrimaryButton type="submit" icon={GitBranch}>Add dependency</PrimaryButton>
          </form>
        </div>
      </div>
    </Panel>
  );
}

function GanttAssignmentCard({
  item,
  slot,
  projects,
  teamMembers,
  timelineSlots,
  onDragStart,
  onMoveScheduleProject
}) {
  const [openPicker, setOpenPicker] = useState(null);
  const memberLabel = memberName(item.memberId, teamMembers);
  const project = getProject(projects, item.projectId);
  const style = projectStyle(project);
  const activeSlotKey = getTimelineSlotKeyForDate(timelineSlots, item.dateKey);
  const activeSlot = timelineSlots.find((slot) => slot.key === activeSlotKey);
  const endDateKey = getScheduleEndDateKey(item);
  const spansMultipleDays = scheduleSpansMultipleDays(item);
  const dateLabel = spansMultipleDays
    ? `${formatReadableDate(item.dateKey)} - ${formatReadableDate(endDateKey)}`
    : slot?.selectLabel || activeSlot?.selectLabel || formatReadableDate(item.dateKey);

  function togglePicker(picker) {
    setOpenPicker((current) => (current === picker ? null : picker));
  }

  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, item)}
      className={`relative w-full min-w-0 max-w-full overflow-hidden rounded-md border ${style.border} ${style.soft} p-2 shadow-sm`}
      aria-label={`${memberLabel} assigned to ${project.name} from ${item.start} to ${item.end} on ${dateLabel}`}
    >
      <div className="grid min-w-0 gap-1.5">
        <div className="min-w-0">
          <p className={`flex min-w-0 items-center gap-1.5 text-sm font-bold ${style.text}`}>
            <GripVertical className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{memberLabel}</span>
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-700">
            {item.start} - {item.end}
          </p>
        </div>
        <div className="min-w-0">
          <StatusBadge status={item.status} />
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-slate-600">{item.location}</p>

      <div className="mt-2 grid min-w-0 gap-2">
        <span className="min-w-0 truncate text-[11px] font-semibold text-slate-600">
          {dateLabel}
        </span>
        <span className="inline-flex min-w-0 justify-end gap-1">
          <button
            type="button"
            onClick={() => togglePicker("project")}
            aria-label={`Move ${memberLabel} to another project`}
            aria-haspopup="menu"
            aria-expanded={openPicker === "project"}
            className="focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => togglePicker("period")}
            aria-label={`Move ${memberLabel} to another period`}
            aria-haspopup="menu"
            aria-expanded={openPicker === "period"}
            className="focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      </div>

      {openPicker === "project" ? (
        <div
          role="menu"
          aria-label={`Move ${memberLabel} to project`}
          className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-soft"
        >
          {projects.map((projectOption) => (
            <button
              key={projectOption.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onMoveScheduleProject(item.id, projectOption.id, item.dateKey);
                setOpenPicker(null);
              }}
              className={`focus-ring flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-xs font-semibold ${
                projectOption.id === item.projectId
                  ? "bg-black text-white"
                  : "text-black hover:bg-brand-100"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${projectStyle(projectOption).dot}`} aria-hidden="true" />
              <span className="truncate">{projectOption.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {openPicker === "period" ? (
        <div
          role="menu"
          aria-label={`Move ${memberLabel} to period`}
          className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-soft"
        >
          {timelineSlots.map((slot) => (
            <button
              key={slot.key}
              type="button"
              role="menuitem"
              onClick={() => {
                onMoveScheduleProject(item.id, item.projectId, slot.dropDateKey);
                setOpenPicker(null);
              }}
              className={`focus-ring min-h-9 w-full rounded-md px-2 text-left text-xs font-semibold ${
                slot.key === activeSlotKey
                  ? "bg-black text-white"
                  : "text-black hover:bg-brand-100"
              }`}
            >
              {slot.selectLabel}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ExpensesPage({ expenses, projects, teamMembers, todayKey, onAddExpense, onExpenseStatusChange }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState({
    merchant: "Workspace tools",
    amount: "48",
    category: "Software",
    dateKey: todayKey,
    projectId: projects[0]?.id || "acme",
    note: "Monthly subscription"
  });
  const visibleExpenses = expenses.filter((expense) => statusFilter === "All" || expense.status === statusFilter);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Submitted" value={currency(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} helper={`${expenses.length} total expenses`} icon={Receipt} />
        <MetricCard label="Pending" value={currency(expenses.filter((expense) => expense.status === "Pending").reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} helper="Waiting on approval" icon={FileCheck2} />
        <MetricCard label="Approved" value={currency(expenses.filter((expense) => expense.status === "Approved").reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} helper="Ready for reimbursement" icon={Check} />
      </section>

      <Panel title="Submit expense" subtitle="Add reimbursable or project-related costs.">
        <form
          className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddExpense(form)) {
              setForm((current) => ({ ...current, merchant: "", amount: "", note: "" }));
            }
          }}
        >
          <FormField label="Merchant" htmlFor="expense-merchant"><input id="expense-merchant" value={form.merchant} onChange={(event) => setFormValue(setForm, "merchant", event.target.value)} className="input" /></FormField>
          <FormField label="Amount" htmlFor="expense-amount"><input id="expense-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setFormValue(setForm, "amount", event.target.value)} className="input" /></FormField>
          <FormField label="Category" htmlFor="expense-category"><Select id="expense-category" value={form.category} onChange={(value) => setFormValue(setForm, "category", value)}><option>Software</option><option>Travel</option><option>Meals</option><option>Office</option></Select></FormField>
          <FormField label="Project" htmlFor="expense-project"><Select id="expense-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <FormField label="Date" htmlFor="expense-date"><input id="expense-date" type="date" value={form.dateKey} onChange={(event) => setFormValue(setForm, "dateKey", event.target.value)} className="input" /></FormField>
          <FormField label="Note" htmlFor="expense-note"><input id="expense-note" value={form.note} onChange={(event) => setFormValue(setForm, "note", event.target.value)} className="input" /></FormField>
          <div className="flex items-end"><PrimaryButton type="submit" icon={Plus}>Submit</PrimaryButton></div>
        </form>
      </Panel>

      <Panel
        title="Expense log"
        subtitle="Review submitted expenses and reimbursement status."
        action={<FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Pending", "Approved", "Rejected", "Paid"]} />}
      >
        <DataTable
          columns={["Merchant", "Project", "Submitted by", "Date", "Amount", "Status", "Actions"]}
          rows={visibleExpenses.map((expense) => [
            <span className="font-semibold text-slate-950">{expense.merchant}</span>,
            <ProjectBadge project={getProject(projects, expense.projectId)} />,
            memberName(expense.submittedBy, teamMembers),
            formatReadableDate(expense.dateKey),
            currency(expense.amount),
            <StatusBadge status={expense.status} />,
            <RowActions
              primaryLabel="Mark paid"
              primaryIcon={Check}
              primaryDisabled={expense.status !== "Approved"}
              onPrimary={() => onExpenseStatusChange(expense.id, "Paid")}
              secondaryLabel="Reject"
              secondaryIcon={X}
              onSecondary={() => onExpenseStatusChange(expense.id, "Rejected")}
            />
          ])}
        />
      </Panel>
    </div>
  );
}

function TimeOffPage({ timeOffRequests, teamMembers, todayKey, onAddTimeOff }) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "ava",
    type: "Vacation",
    startDate: todayKey,
    endDate: todayKey,
    days: "1",
    note: "Personal time"
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Request time off" subtitle="Requests are routed to approvals.">
        <form
          className="grid gap-4 p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddTimeOff(form)) {
              setForm((current) => ({ ...current, note: "", days: "1" }));
            }
          }}
        >
          <FormField label="Person" htmlFor="timeoff-person"><Select id="timeoff-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Type" htmlFor="timeoff-type"><Select id="timeoff-type" value={form.type} onChange={(value) => setFormValue(setForm, "type", value)}><option>Vacation</option><option>Sick leave</option><option>Personal</option></Select></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start" htmlFor="timeoff-start"><input id="timeoff-start" type="date" value={form.startDate} onChange={(event) => setFormValue(setForm, "startDate", event.target.value)} className="input" /></FormField>
            <FormField label="End" htmlFor="timeoff-end"><input id="timeoff-end" type="date" value={form.endDate} onChange={(event) => setFormValue(setForm, "endDate", event.target.value)} className="input" /></FormField>
          </div>
          <FormField label="Days" htmlFor="timeoff-days"><input id="timeoff-days" type="number" min="0.5" step="0.5" value={form.days} onChange={(event) => setFormValue(setForm, "days", event.target.value)} className="input" /></FormField>
          <FormField label="Note" htmlFor="timeoff-note"><input id="timeoff-note" value={form.note} onChange={(event) => setFormValue(setForm, "note", event.target.value)} className="input" /></FormField>
          <PrimaryButton type="submit" icon={Plus}>Submit request</PrimaryButton>
        </form>
      </Panel>

      <Panel title="Time off ledger" subtitle="Balances and request statuses.">
        <div className="grid gap-4 border-b border-slate-200 p-4 sm:grid-cols-3 sm:p-5">
          {teamMembers.map((member) => {
            const approvedDays = timeOffRequests
              .filter((request) => request.memberId === member.id && request.status === "Approved")
              .reduce((sum, request) => sum + Number(request.days || 0), 0);
            return (
              <div key={member.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-950">{member.name}</p>
                <p className="mt-1 text-sm text-slate-600">{Math.max(0, 20 - approvedDays)} days remaining</p>
              </div>
            );
          })}
        </div>
        <DataTable
          columns={["Person", "Type", "Dates", "Days", "Status"]}
          rows={timeOffRequests.map((request) => [
            memberName(request.memberId, teamMembers),
            request.type,
            `${formatReadableDate(request.startDate)} - ${formatReadableDate(request.endDate)}`,
            request.days,
            <StatusBadge status={request.status} />
          ])}
        />
      </Panel>
    </div>
  );
}

function ReportsPage({ entries, projects, teamMembers, employmentGrades, scheduleItems, setStatusMessage }) {
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS);
  const allowedProjects = projects.filter((project) => {
    const matchesProject = filters.projectId === "All" || project.id === filters.projectId;
    const matchesClient = filters.client === "All" || project.client === filters.client;
    const matchesTag = filters.projectTag === "All" || project.tags?.includes(filters.projectTag);
    return matchesProject && matchesClient && matchesTag;
  });
  const allowedProjectIds = new Set(allowedProjects.map((project) => project.id));
  const filteredEntries = entries.filter((entry) => {
    return (
      allowedProjectIds.has(entry.projectId) &&
      (filters.memberId === "All" || entry.memberId === filters.memberId) &&
      (filters.approvalStatus === "All" || entry.approvalStatus === filters.approvalStatus) &&
      (filters.billable === "All" || String(entry.billable) === filters.billable) &&
      (!filters.dateFrom || entry.dateKey >= filters.dateFrom) &&
      (!filters.dateTo || entry.dateKey <= filters.dateTo)
    );
  });
  const filteredScheduleItems = scheduleItems.filter((item) => {
    return (
      allowedProjectIds.has(item.projectId) &&
      (filters.memberId === "All" || item.memberId === filters.memberId) &&
      (!filters.dateFrom || item.dateKey >= filters.dateFrom) &&
      (!filters.dateTo || item.dateKey <= filters.dateTo)
    );
  });
  const total = sumDurations(filteredEntries);
  const billableTotal = sumBillableDurations(filteredEntries);
  const projectGroups = groupDurationsByProject(filteredEntries);
  const visibleProjects = allowedProjects;
  const clientOptions = ["All", ...Array.from(new Set(projects.map((project) => project.client)))];
  const tagOptions = ["All", ...Array.from(new Set(projects.flatMap((project) => project.tags || [])))];
  const activeFilterChips = [
    filters.projectId !== "All" ? `Project: ${projectName(filters.projectId, projects)}` : "",
    filters.client !== "All" ? `Client: ${filters.client}` : "",
    filters.projectTag !== "All" ? `Tag: ${filters.projectTag}` : "",
    filters.memberId !== "All" ? `Person: ${memberName(filters.memberId, teamMembers)}` : "",
    filters.approvalStatus !== "All" ? `Status: ${filters.approvalStatus}` : "",
    filters.billable !== "All" ? `Billing: ${filters.billable === "true" ? "Billable" : "Non-billable"}` : "",
    filters.dateFrom ? `From: ${formatReadableDate(filters.dateFrom)}` : "",
    filters.dateTo ? `To: ${formatReadableDate(filters.dateTo)}` : ""
  ].filter(Boolean);
  const hasActiveFilters = activeFilterChips.length > 0;
  const projectMetrics = visibleProjects.map((project) =>
    getProjectFinancialMetrics({
      project,
      entries: filteredEntries,
      scheduleItems: filteredScheduleItems,
      teamMembers,
      employmentGrades,
      memberFilter: filters.memberId
    })
  );
  const totalBudgetValue = projectMetrics.reduce((sum, metric) => sum + metric.budgetValue, 0);
  const totalScheduledSeconds = projectMetrics.reduce((sum, metric) => sum + metric.scheduledSeconds, 0);
  const totalActualCost = projectMetrics.reduce((sum, metric) => sum + metric.actualCost, 0);
  const totalMarginPercent = calculateMarginPercent(totalBudgetValue, totalActualCost);

  function exportCsv() {
    const rows = [
      ["Filters", activeFilterChips.length ? activeFilterChips.join("; ") : "No filters applied"],
      [],
      ["Project performance"],
      ["Project", "Budget", "Scheduled Time", "Actual Time Spent", "Actual Cost", "Margin %"],
      ...projectMetrics.map((metric) => [
        metric.project.name,
        currency(metric.budgetValue),
        formatDuration(metric.scheduledSeconds),
        formatDuration(metric.actualSeconds),
        currency(metric.actualCost),
        formatMargin(metric.marginPercent)
      ]),
      [],
      ["Time entries"],
      ["Date", "Task", "Project", "Member", "Billable", "Duration", "Status"],
      ...filteredEntries.map((entry) => [
        entry.dateKey,
        entry.description,
        projectName(entry.projectId, projects),
        memberName(entry.memberId, teamMembers),
        entry.billable ? "Yes" : "No",
        formatDuration(entry.durationSeconds),
        entry.approvalStatus
      ])
    ];
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timetrackr-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage("CSV report exported.");
  }

  return (
    <div className="grid gap-5">
      <ReportFiltersPanel
        activeFilterChips={activeFilterChips}
        clientOptions={clientOptions}
        exportCsv={exportCsv}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        projects={projects}
        setFilters={setFilters}
        tagOptions={tagOptions}
        teamMembers={teamMembers}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Project budget" value={currency(totalBudgetValue)} helper={`${visibleProjects.length} projects in view`} icon={BriefcaseBusiness} />
        <MetricCard label="Scheduled time" value={formatDurationLabel(totalScheduledSeconds)} helper="Filtered planned work blocks" icon={LucideCalendarClock} />
        <MetricCard label="Actual cost" value={currency(totalActualCost)} helper={`${filteredEntries.length} filtered entries`} icon={DollarSign} />
        <MetricCard label="Margin" value={formatMargin(totalMarginPercent)} helper={hasActiveFilters ? "Based on active filters" : "Budget minus labor cost"} icon={Gauge} />
      </section>

      <Panel
        title="Project performance by filter"
        subtitle="Budget, scheduled time, actual time spent, actual cost, and margin update from the active filters."
        action={<PrimaryButton onClick={exportCsv} icon={Download}>Export CSV</PrimaryButton>}
      >
        <DataTable
          columns={["Project", "Budget", "Scheduled time", "Actual time spent", "Actual cost", "Margin %", "Budget used"]}
          rows={projectMetrics.map((metric) => [
            <ProjectBadge project={metric.project} />,
            <div>
              <p className="font-mono font-bold text-slate-950">{currency(metric.budgetValue)}</p>
              <p className="mt-1 text-xs text-slate-600">
                {formatDurationLabel(metric.budgetSeconds)} at {currency(metric.project.hourlyRate)}/hr
              </p>
            </div>,
            <span className="font-mono font-semibold text-slate-950">{formatDurationLabel(metric.scheduledSeconds)}</span>,
            <span className="font-mono font-semibold text-slate-950">{formatDurationLabel(metric.actualSeconds)}</span>,
            <div>
              <p className="font-mono font-bold text-slate-950">{currency(metric.actualCost)}</p>
              <p className="mt-1 text-xs text-slate-600">Based on employment grades</p>
            </div>,
            <MarginBadge value={metric.marginPercent} />,
            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                <span>{percent(metric.actualSeconds, metric.budgetSeconds)}%</span>
                <span>{formatDurationLabel(metric.actualSeconds)} / {formatDurationLabel(metric.budgetSeconds)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${projectStyle(metric.project).dot}`}
                  style={{ width: `${Math.min(100, Math.max(4, percent(metric.actualSeconds, metric.budgetSeconds)))}%` }}
                />
              </div>
            </div>
          ])}
        />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title="Project breakdown" subtitle="Share of filtered time.">
          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-slate-600">Billable</p>
                <p className="mt-1 font-mono font-bold text-slate-950">{formatDurationLabel(billableTotal)}</p>
              </div>
              <div>
                <p className="text-slate-600">Non-billable</p>
                <p className="mt-1 font-mono font-bold text-slate-950">{formatDurationLabel(total - billableTotal)}</p>
              </div>
            </div>
            {Object.entries(projectGroups).map(([currentProjectId, seconds]) => {
              const project = getProject(projects, currentProjectId);
              const style = projectStyle(project);
              return (
                <div key={currentProjectId}>
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <ProjectBadge project={project} />
                    <span className="font-mono font-semibold">{formatDurationLabel(seconds)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${style.dot}`} style={{ width: `${Math.max(6, percent(seconds, total))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Report entries" subtitle="Filtered time data.">
          <DataTable
            columns={["Task", "Project", "Person", "Date", "Billable", "Duration", "Status"]}
            rows={filteredEntries.map((entry) => [
              <span className="font-semibold text-slate-950">{entry.description}</span>,
              <ProjectBadge project={getProject(projects, entry.projectId)} />,
              memberName(entry.memberId, teamMembers),
              formatReadableDate(entry.dateKey),
              <BillableBadge billable={entry.billable} />,
              formatDurationLabel(entry.durationSeconds),
              <StatusBadge status={entry.approvalStatus} />
            ])}
          />
        </Panel>
      </div>
    </div>
  );
}

function ReportFiltersPanel({
  activeFilterChips,
  clientOptions,
  exportCsv,
  filters,
  hasActiveFilters,
  projects,
  setFilters,
  tagOptions,
  teamMembers
}) {
  return (
    <Panel
      title="Report filters"
      subtitle="Choose a view first, then read the metrics below."
      action={
        <div className="flex flex-wrap gap-2">
          {hasActiveFilters ? (
            <GhostButton onClick={() => setFilters({ ...DEFAULT_REPORT_FILTERS })} icon={X}>
              Clear filters
            </GhostButton>
          ) : null}
          <GhostButton onClick={exportCsv} icon={Download}>Export CSV</GhostButton>
        </div>
      }
    >
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <FormField label="Project" htmlFor="report-project">
          <Select id="report-project" value={filters.projectId} onChange={(value) => setFilters((current) => ({ ...current, projectId: value }))}>
            <option value="All">All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Client" htmlFor="report-client">
          <Select id="report-client" value={filters.client} onChange={(value) => setFilters((current) => ({ ...current, client: value }))}>
            {clientOptions.map((client) => <option key={client} value={client}>{client === "All" ? "All clients" : client}</option>)}
          </Select>
        </FormField>
        <FormField label="Project tag" htmlFor="report-project-tag">
          <Select id="report-project-tag" value={filters.projectTag} onChange={(value) => setFilters((current) => ({ ...current, projectTag: value }))}>
            {tagOptions.map((tag) => <option key={tag} value={tag}>{tag === "All" ? "All tags" : tag}</option>)}
          </Select>
        </FormField>
        <FormField label="Person" htmlFor="report-person">
          <Select id="report-person" value={filters.memberId} onChange={(value) => setFilters((current) => ({ ...current, memberId: value }))}>
            <option value="All">Everyone</option>
            {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="report-status">
          <Select id="report-status" value={filters.approvalStatus} onChange={(value) => setFilters((current) => ({ ...current, approvalStatus: value }))}>
            <option value="All">All statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </Select>
        </FormField>
        <FormField label="Billing" htmlFor="report-billing">
          <Select id="report-billing" value={filters.billable} onChange={(value) => setFilters((current) => ({ ...current, billable: value }))}>
            <option value="All">All entries</option>
            <option value="true">Billable</option>
            <option value="false">Non-billable</option>
          </Select>
        </FormField>
        <FormField label="From date" htmlFor="report-date-from">
          <input
            id="report-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
            className="input"
          />
        </FormField>
        <FormField label="To date" htmlFor="report-date-to">
          <input
            id="report-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
            className="input"
          />
        </FormField>
      </div>
      <div className="border-t border-brand-100 bg-brand-50 px-4 py-3 sm:px-5" aria-live="polite">
        <p className="text-xs font-bold uppercase text-[#5e5e5e]">Active report filters</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {activeFilterChips.length ? activeFilterChips.map((filterLabel) => (
            <span key={filterLabel} className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-black">
              {filterLabel}
            </span>
          )) : (
            <span className="text-sm text-[#5e5e5e]">No filters applied. Showing all report data.</span>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ActivityPage({ activityItems, onAddActivityNote, onClearActivity }) {
  const [filter, setFilter] = useState("All");
  const [note, setNote] = useState("");
  const visibleItems = activityItems.filter((item) => filter === "All" || item.type === filter);
  const types = ["All", ...Array.from(new Set(activityItems.map((item) => item.type)))];

  return (
    <Panel
      title="Activity log"
      subtitle="Audit-style feed for changes across the workspace."
      action={
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Type" value={filter} onChange={setFilter} options={types} />
          <GhostButton onClick={onClearActivity} icon={X}>Clear</GhostButton>
        </div>
      }
    >
      <form
        className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (onAddActivityNote(note)) {
            setNote("");
          }
        }}
      >
        <label className="sr-only" htmlFor="activity-note">Activity note</label>
        <input
          id="activity-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="input flex-1"
          placeholder="Add an internal activity note"
        />
        <PrimaryButton type="submit" icon={Plus}>Add note</PrimaryButton>
      </form>
      <ActivityList items={visibleItems} />
    </Panel>
  );
}

function KiosksPage({ kioskSessions, projects, teamMembers, onClockIn, onClockOut }) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "ava",
    projectId: projects[0]?.id || "acme"
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Kiosk clock-in" subtitle="Shared-device workflow for teams without personal logins.">
        <form
          className="grid gap-4 p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onClockIn(form);
          }}
        >
          <FormField label="Person" htmlFor="kiosk-person"><Select id="kiosk-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Project" htmlFor="kiosk-project"><Select id="kiosk-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <PrimaryButton type="submit" icon={Play}>Clock in</PrimaryButton>
        </form>
      </Panel>
      <Panel title="Kiosk sessions" subtitle="Active and completed shared-device sessions.">
        <DataTable
          columns={["Person", "Project", "PIN", "Started", "Duration", "Status", "Actions"]}
          rows={kioskSessions.map((session) => [
            memberName(session.memberId, teamMembers),
            <ProjectBadge project={getProject(projects, session.projectId)} />,
            <span className="font-mono font-bold">{session.pin}</span>,
            formatRelativeTime(session.startedAt),
            formatDurationLabel(sessionDuration(session)),
            <StatusBadge status={session.status} />,
            <RowActions
              primaryLabel="Clock out"
              primaryIcon={PauseCircle}
              primaryDisabled={session.status !== "Active"}
              onPrimary={() => onClockOut(session.id)}
            />
          ])}
        />
      </Panel>
    </div>
  );
}

function ApprovalsPage({
  entries,
  expenses,
  timeOffRequests,
  projects,
  teamMembers,
  onEntryApprovalChange,
  onExpenseStatusChange,
  onTimeOffStatusChange
}) {
  const pendingEntries = entries.filter((entry) => entry.approvalStatus === "Pending");
  const pendingExpenses = expenses.filter((expense) => expense.status === "Pending");
  const pendingTimeOff = timeOffRequests.filter((request) => request.status === "Pending");

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Time entries" value={String(pendingEntries.length)} helper="Pending approval" icon={Clock3} />
        <MetricCard label="Expenses" value={String(pendingExpenses.length)} helper="Pending reimbursement review" icon={Receipt} />
        <MetricCard label="Time off" value={String(pendingTimeOff.length)} helper="Pending manager approval" icon={AlarmClock} />
      </section>
      <Panel title="Approve time" subtitle="New timer and timesheet entries enter this queue.">
        <DataTable
          columns={["Task", "Project", "Person", "Date", "Duration", "Actions"]}
          rows={pendingEntries.map((entry) => [
            <span className="font-semibold text-slate-950">{entry.description}</span>,
            <ProjectBadge project={getProject(projects, entry.projectId)} />,
            memberName(entry.memberId, teamMembers),
            formatReadableDate(entry.dateKey),
            formatDurationLabel(entry.durationSeconds),
            <RowActions primaryLabel="Approve" primaryIcon={Check} onPrimary={() => onEntryApprovalChange(entry.id, "Approved")} secondaryLabel="Reject" secondaryIcon={X} onSecondary={() => onEntryApprovalChange(entry.id, "Rejected")} />
          ])}
        />
      </Panel>
      <Panel title="Approve expenses" subtitle="Review submitted costs.">
        <DataTable
          columns={["Merchant", "Project", "Amount", "Submitted by", "Actions"]}
          rows={pendingExpenses.map((expense) => [
            expense.merchant,
            <ProjectBadge project={getProject(projects, expense.projectId)} />,
            currency(expense.amount),
            memberName(expense.submittedBy, teamMembers),
            <RowActions primaryLabel="Approve" primaryIcon={Check} onPrimary={() => onExpenseStatusChange(expense.id, "Approved")} secondaryLabel="Reject" secondaryIcon={X} onSecondary={() => onExpenseStatusChange(expense.id, "Rejected")} />
          ])}
        />
      </Panel>
      <Panel title="Approve time off" subtitle="Review availability requests.">
        <DataTable
          columns={["Person", "Type", "Dates", "Days", "Actions"]}
          rows={pendingTimeOff.map((request) => [
            memberName(request.memberId, teamMembers),
            request.type,
            `${formatReadableDate(request.startDate)} - ${formatReadableDate(request.endDate)}`,
            request.days,
            <RowActions primaryLabel="Approve" primaryIcon={Check} onPrimary={() => onTimeOffStatusChange(request.id, "Approved")} secondaryLabel="Reject" secondaryIcon={X} onSecondary={() => onTimeOffStatusChange(request.id, "Rejected")} />
          ])}
        />
      </Panel>
    </div>
  );
}

function ProjectsPage({ projects, entries, onAddProject, onProjectStatusChange, onProjectTagsChange }) {
  const [form, setForm] = useState({
    name: "",
    client: "",
    colorKey: "blue",
    budgetHours: "80",
    hourlyRate: "95",
    tagText: ""
  });
  const [clientFilter, setClientFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [tagDrafts, setTagDrafts] = useState(() =>
    Object.fromEntries(projects.map((project) => [project.id, project.tags?.join(", ") || ""]))
  );
  const clientOptions = ["All", ...Array.from(new Set(projects.map((project) => project.client)))];
  const tagOptions = ["All", ...Array.from(new Set(projects.flatMap((project) => project.tags || [])))];
  const visibleProjects = projects.filter((project) => {
    const matchesClient = clientFilter === "All" || project.client === clientFilter;
    const matchesTag = tagFilter === "All" || project.tags?.includes(tagFilter);
    return matchesClient && matchesTag;
  });

  useEffect(() => {
    setTagDrafts(Object.fromEntries(projects.map((project) => [project.id, project.tags?.join(", ") || ""])));
  }, [projects]);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Create project" subtitle="Projects become available in timers, timesheets, and reports.">
        <form
          className="grid gap-4 p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddProject(form)) {
              setForm({ name: "", client: "", colorKey: "blue", budgetHours: "80", hourlyRate: "95", tagText: "" });
            }
          }}
        >
          <FormField label="Project name" htmlFor="project-name"><input id="project-name" value={form.name} onChange={(event) => setFormValue(setForm, "name", event.target.value)} className="input" /></FormField>
          <FormField label="Client" htmlFor="project-client"><input id="project-client" value={form.client} onChange={(event) => setFormValue(setForm, "client", event.target.value)} className="input" /></FormField>
          <FormField label="Colour" htmlFor="project-color"><Select id="project-color" value={form.colorKey} onChange={(value) => setFormValue(setForm, "colorKey", value)}>{Object.entries(PROJECT_COLORS).map(([key, color]) => <option key={key} value={key}>{color.label}</option>)}</Select></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Budget hours" htmlFor="project-budget"><input id="project-budget" type="number" min="0" value={form.budgetHours} onChange={(event) => setFormValue(setForm, "budgetHours", event.target.value)} className="input" /></FormField>
            <FormField label="Hourly rate (GBP)" htmlFor="project-rate"><input id="project-rate" type="number" min="0" value={form.hourlyRate} onChange={(event) => setFormValue(setForm, "hourlyRate", event.target.value)} className="input" /></FormField>
          </div>
          <FormField label="Custom project tags" htmlFor="project-tags" helper="Separate tags with commas, such as Retainer, UX, High priority.">
            <input id="project-tags" value={form.tagText} onChange={(event) => setFormValue(setForm, "tagText", event.target.value)} className="input" />
          </FormField>
          <PrimaryButton type="submit" icon={Plus}>Create project</PrimaryButton>
        </form>
      </Panel>

      <Panel
        title="Project portfolio"
        subtitle="Track budgets, status, clients, and custom project tags."
        action={
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="Client" value={clientFilter} onChange={setClientFilter} options={clientOptions} />
            <FilterSelect label="Project tag" value={tagFilter} onChange={setTagFilter} options={tagOptions} />
          </div>
        }
      >
        <div className="grid gap-3 p-4 sm:p-5">
          {visibleProjects.map((project) => {
            const trackedSeconds = sumDurations(entries.filter((entry) => entry.projectId === project.id));
            const budgetSeconds = Number(project.budgetHours || 0) * 3600;
            return (
              <article key={project.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <ProjectBadge project={project} />
                    <p className="mt-2 text-sm text-slate-600">{project.client} · {currency(project.hourlyRate)}/hr</p>
                    <div className="mt-2">
                      <TagList tags={project.tags || []} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={project.status} />
                    <GhostButton
                      onClick={() => onProjectStatusChange(project.id, project.status === "Archived" ? "Active" : "Archived")}
                      icon={project.status === "Archived" ? Check : X}
                    >
                      {project.status === "Archived" ? "Reactivate" : "Archive"}
                    </GhostButton>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">Budget used</span>
                    <span className="font-mono font-semibold text-slate-950">{formatDurationLabel(trackedSeconds)} / {formatDurationLabel(budgetSeconds)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${projectStyle(project).dot}`} style={{ width: `${Math.min(100, Math.max(4, percent(trackedSeconds, budgetSeconds)))}%` }} />
                  </div>
                </div>
                <form
                  className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onProjectTagsChange(project.id, tagDrafts[project.id] || "");
                  }}
                >
                  <FormField label={`Tags for ${project.name}`} htmlFor={`${project.id}-tags`}>
                    <input
                      id={`${project.id}-tags`}
                      value={tagDrafts[project.id] || ""}
                      onChange={(event) =>
                        setTagDrafts((current) => ({
                          ...current,
                          [project.id]: event.target.value
                        }))
                      }
                      className="input min-w-[260px]"
                      placeholder="Retainer, UX"
                    />
                  </FormField>
                  <button
                    type="submit"
                    className="focus-ring min-h-11 rounded-full border border-transparent bg-black px-4 text-sm font-medium text-white hover:bg-brand-800"
                  >
                    Save tags
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function TeamPage({
  teamMembers,
  entries,
  employmentGrades,
  onAddTeamMember,
  onMemberStatusChange,
  onDeleteTeamMember,
  onEmploymentGradeChange
}) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Designer",
    capacityHours: "40",
    gradeId: employmentGrades[1]?.id || "grade-2"
  });
  const [gradeDrafts, setGradeDrafts] = useState(() =>
    Object.fromEntries(
      employmentGrades.map((grade) => [
        grade.id,
        {
          title: grade.title,
          hourlyRate: String(grade.hourlyRate),
          description: grade.description
        }
      ])
    )
  );
  const visibleMembers = teamMembers.filter((member) =>
    `${member.name} ${member.email} ${member.role} ${getEmploymentGrade(member.gradeId, employmentGrades).title}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  useEffect(() => {
    setGradeDrafts(
      Object.fromEntries(
        employmentGrades.map((grade) => [
          grade.id,
          {
            title: grade.title,
            hourlyRate: String(grade.hourlyRate),
            description: grade.description
          }
        ])
      )
    );
  }, [employmentGrades]);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="grid gap-5">
        <Panel title="Invite team member" subtitle="Members inherit hourly rates from their employment grade.">
          <form
            className="grid gap-4 p-4 sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (onAddTeamMember(form)) {
                setForm({
                  name: "",
                  email: "",
                  role: "Designer",
                  capacityHours: "40",
                  gradeId: employmentGrades[1]?.id || "grade-2"
                });
              }
            }}
          >
            <FormField label="Name" htmlFor="team-name"><input id="team-name" value={form.name} onChange={(event) => setFormValue(setForm, "name", event.target.value)} className="input" /></FormField>
            <FormField label="Email" htmlFor="team-email"><input id="team-email" type="text" inputMode="email" value={form.email} onChange={(event) => setFormValue(setForm, "email", event.target.value)} className="input" /></FormField>
            <FormField label="Role" htmlFor="team-role"><input id="team-role" value={form.role} onChange={(event) => setFormValue(setForm, "role", event.target.value)} className="input" /></FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Capacity" htmlFor="team-capacity"><input id="team-capacity" type="number" min="0" value={form.capacityHours} onChange={(event) => setFormValue(setForm, "capacityHours", event.target.value)} className="input" /></FormField>
              <FormField label="Employment grade" htmlFor="team-grade">
                <Select id="team-grade" value={form.gradeId} onChange={(value) => setFormValue(setForm, "gradeId", value)}>
                  {employmentGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.label} - {grade.title} ({currency(grade.hourlyRate)}/hr)
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <PrimaryButton type="submit" icon={Plus}>Add member</PrimaryButton>
          </form>
        </Panel>

        <Panel title="Employment grades" subtitle="Four fixed grades with increasing hourly rates.">
          <div className="grid gap-3 p-4 sm:p-5">
            {employmentGrades.map((grade, index) => (
              <form
                key={grade.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  onEmploymentGradeChange(grade.id, {
                    title: gradeDrafts[grade.id]?.title || grade.title,
                    hourlyRate: gradeDrafts[grade.id]?.hourlyRate || grade.hourlyRate,
                    description: gradeDrafts[grade.id]?.description || grade.description
                  });
                }}
              >
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">{grade.label}</p>
                    <span className="rounded-full border border-transparent bg-brand-100 px-2.5 py-1 text-xs font-medium text-black">
                      GBP {currency(grade.hourlyRate)}/hr
                    </span>
                  </div>
                  <FormField label={`${grade.label} title`} htmlFor={`${grade.id}-title`}>
                    <input
                      id={`${grade.id}-title`}
                      value={gradeDrafts[grade.id]?.title || ""}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [grade.id]: { ...current[grade.id], title: event.target.value }
                        }))
                      }
                      className="input min-h-9"
                    />
                  </FormField>
                  <FormField label={`${grade.label} hourly rate (GBP)`} htmlFor={`${grade.id}-rate`}>
                    <input
                      id={`${grade.id}-rate`}
                      type="text"
                      inputMode="decimal"
                      value={gradeDrafts[grade.id]?.hourlyRate || ""}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [grade.id]: { ...current[grade.id], hourlyRate: event.target.value }
                        }))
                      }
                      className="input min-h-9"
                    />
                  </FormField>
                  <FormField label={`${grade.label} description`} htmlFor={`${grade.id}-description`}>
                    <input
                      id={`${grade.id}-description`}
                      value={gradeDrafts[grade.id]?.description || ""}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [grade.id]: { ...current[grade.id], description: event.target.value }
                        }))
                      }
                      className="input min-h-9"
                    />
                  </FormField>
                </div>
                {index > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    Higher than {employmentGrades[index - 1].label} by{" "}
                    {currency(grade.hourlyRate - employmentGrades[index - 1].hourlyRate)}/hr
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="focus-ring mt-3 min-h-9 rounded-full bg-black px-4 text-xs font-medium text-white hover:bg-brand-800"
                >
                  Save {grade.label}
                </button>
              </form>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Team directory"
        subtitle="Search, capacity, grade-based rates, and status."
        action={
          <label className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black inline-flex min-h-10 items-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 text-sm text-black">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search team</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="w-36 border-0 bg-transparent outline-none" />
          </label>
        }
      >
        <div className="grid gap-3 p-4 sm:p-5">
          {visibleMembers.map((member) => {
            const trackedSeconds = sumDurations(entries.filter((entry) => entry.memberId === member.id));
            const grade = getEmploymentGrade(member.gradeId, employmentGrades);
            return (
              <article key={member.id} className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{member.name}</p>
                  <p className="text-sm text-slate-600">{member.email}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {member.role} · {member.capacityHours}h capacity · {grade.label} {grade.title} · {currency(grade.hourlyRate)}/hr
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-950">{formatDurationLabel(trackedSeconds)}</span>
                  <StatusBadge status={member.status} />
                  <GhostButton onClick={() => onMemberStatusChange(member.id, member.status === "Active" ? "Inactive" : "Active")} icon={member.status === "Active" ? X : Check}>
                    {member.status === "Active" ? "Deactivate" : "Activate"}
                  </GhostButton>
                  <button
                    type="button"
                    onClick={() => onDeleteTeamMember(member.id)}
                    className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700 hover:bg-red-100"
                    aria-label={`Delete ${member.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export default App;
