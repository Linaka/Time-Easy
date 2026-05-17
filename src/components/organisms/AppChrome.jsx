import React from "react";
import {
  AlarmClock,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Clock3,
  FileCheck2,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  LucideCalendarClock,
  PauseCircle,
  Play,
  Receipt,
  Settings,
  Sparkles,
  UserCircle2,
  UsersRound,
  X
} from "lucide-react";
import { formatTimer } from "../../timeUtils.js";
import { currency, formatDurationLabel } from "../../domain/formatters.js";
import { utilitySubtitle } from "../../domain/navigation.js";
import { getEmploymentGrade } from "../../domain/projectUtils.js";
import { GhostButton, PrimaryButton } from "../atoms/index.js";

const navGroups = [
  {
    label: "Track",
    items: [
      { label: "Timesheet", icon: ListChecks },
      { label: "Time Tracker", icon: Clock3 },
      { label: "Week ahead", icon: CalendarDays },
      { label: "Schedule", icon: LucideCalendarClock }
    ]
  },
  {
    label: "Manage",
    items: [
      { label: "Projects", icon: BriefcaseBusiness },
      { label: "Team", icon: UsersRound },
      { label: "Expenses", icon: Receipt },
      { label: "Time Off", icon: AlarmClock },
      { label: "Kiosks", icon: Grid2X2 }
    ]
  },
  {
    label: "Review",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Reports", icon: Gauge },
      { label: "Activity", icon: Sparkles },
      { label: "Approvals", icon: FileCheck2 }
    ]
  }
];

export function TopBar({
  weeklyTotal,
  pendingApprovalCount,
  activeUtility,
  onUtilityToggle,
  onUtilityClose,
  onNavigate,
  workspaceSettings,
  onSettingChange,
  currentUser,
  employmentGrades,
  activeProjects,
  quickDescription,
  quickProjectId,
  quickRunning,
  quickSeconds,
  onQuickDescriptionChange,
  onQuickProjectChange,
  onQuickClockToggle
}) {
  const utilityItems = [
    { id: "Settings", label: "Settings", icon: Settings },
    { id: "Notifications", label: `${pendingApprovalCount} notifications`, icon: Bell },
    { id: "Help", label: "Help", icon: CircleHelp },
    { id: "Profile", label: "User profile", icon: UserCircle2 }
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-brand-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <a href="#main-content" className="focus-ring flex items-center gap-2.5 rounded-full">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-black text-xs font-bold text-white">
              CO
            </span>
            <span className="text-base font-bold text-black">Creative Operations</span>
          </a>

          <QuickClock
            activeProjects={activeProjects}
            description={quickDescription}
            projectId={quickProjectId}
            running={quickRunning}
            seconds={quickSeconds}
            onDescriptionChange={onQuickDescriptionChange}
            onProjectChange={onQuickProjectChange}
            onToggle={onQuickClockToggle}
          />
        </div>

        <div className="flex items-center gap-1">
          <div className="mr-1 hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-transparent bg-brand-100 px-3 py-2 text-sm font-medium text-black xl:inline-flex">
            <Clock3 className="h-4 w-4 text-black" aria-hidden="true" />
            <span className="shrink-0">Week</span>
            <span className="shrink-0 text-slate-950">{formatDurationLabel(weeklyTotal)}</span>
          </div>
          {utilityItems.map((item) => {
            const Icon = item.icon;
            const isOpen = activeUtility === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onUtilityToggle(item.id)}
                aria-expanded={isOpen}
                aria-controls="utility-panel"
                className={`focus-ring relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-full ${
                  isOpen
                    ? "bg-black text-white"
                    : "text-black hover:bg-brand-100"
                }`}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.id === "Notifications" && pendingApprovalCount ? (
                  <span className="absolute right-2 top-2 min-w-4 rounded-full bg-black px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">
                    {pendingApprovalCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {activeUtility ? (
        <UtilityPanel
          activeUtility={activeUtility}
          pendingApprovalCount={pendingApprovalCount}
          workspaceSettings={workspaceSettings}
          onSettingChange={onSettingChange}
          onNavigate={onNavigate}
          onClose={onUtilityClose}
          currentUser={currentUser}
          employmentGrades={employmentGrades}
        />
      ) : null}
    </header>
  );
}

function QuickClock({
  activeProjects,
  description,
  projectId,
  running,
  seconds,
  onDescriptionChange,
  onProjectChange,
  onToggle
}) {
  return (
    <form
      className="hidden min-h-10 items-center gap-1.5 rounded-full border border-transparent bg-brand-100 px-2 lg:flex"
      aria-label="Quick start stop clock"
      onSubmit={(event) => {
        event.preventDefault();
        onToggle();
      }}
    >
      <label className="sr-only" htmlFor="quick-clock-task">
        Quick clock task
      </label>
      <input
        id="quick-clock-task"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        className="focus-ring h-8 w-28 rounded-full border border-transparent bg-white px-3 text-sm text-black"
        placeholder="Quick task"
      />
      <label className="sr-only" htmlFor="quick-clock-project">
        Quick clock project
      </label>
      <select
        id="quick-clock-project"
        value={projectId}
        onChange={(event) => onProjectChange(event.target.value)}
        className="focus-ring h-8 w-28 rounded-full border border-transparent bg-white px-3 text-sm font-medium text-black"
      >
        {activeProjects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <span
        className="min-w-[74px] text-center font-mono text-sm font-bold tabular-nums text-slate-950"
        role="timer"
        aria-live="polite"
      >
        {formatTimer(seconds)}
      </span>
      <button
        type="submit"
        className={`focus-ring inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
          running ? "bg-brand-800 text-white" : "bg-black text-white hover:bg-brand-800"
        }`}
      >
        {running ? <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
        {running ? "Stop" : "Start"}
      </button>
    </form>
  );
}

export function QuickClockPanel({
  activeProjects,
  description,
  projectId,
  running,
  seconds,
  onDescriptionChange,
  onProjectChange,
  onToggle
}) {
  return (
    <section
      aria-labelledby="quick-clock-title"
      className="rounded-2xl border border-brand-200 bg-white p-4 shadow-soft lg:hidden"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <h2 id="quick-clock-title" className="text-sm font-bold text-black">
            Quick start stop clock
          </h2>
          <label htmlFor="quick-clock-panel-task" className="sr-only">
            Quick clock task
          </label>
          <input
            id="quick-clock-panel-task"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="input mt-2"
            placeholder="Quick task"
          />
        </div>
        <div className="min-w-[180px]">
          <label htmlFor="quick-clock-panel-project" className="sr-only">
            Quick clock project
          </label>
          <select
            id="quick-clock-panel-project"
            value={projectId}
            onChange={(event) => onProjectChange(event.target.value)}
            className="focus-ring min-h-11 w-full rounded-md border border-transparent bg-brand-100 px-4 text-sm font-medium text-black"
          >
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div
          className="flex min-h-11 min-w-[130px] items-center justify-center rounded-full border border-transparent bg-brand-100 px-4 font-mono text-lg font-bold tabular-nums text-black"
          role="timer"
          aria-live="polite"
        >
          {formatTimer(seconds)}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium ${
            running ? "bg-brand-800 text-white" : "bg-black text-white hover:bg-brand-800"
          }`}
        >
          {running ? <PauseCircle className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {running ? "Stop quick clock" : "Start quick clock"}
        </button>
      </div>
    </section>
  );
}

function UtilityPanel({
  activeUtility,
  pendingApprovalCount,
  workspaceSettings,
  onSettingChange,
  onNavigate,
  onClose,
  currentUser,
  employmentGrades
}) {
  const userGrade = getEmploymentGrade(currentUser?.gradeId, employmentGrades);

  return (
    <section
      id="utility-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="utility-panel-title"
      className="absolute right-4 top-[4.5rem] w-[min(92vw,360px)] rounded-2xl border border-brand-200 bg-white shadow-soft"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 id="utility-panel-title" className="text-sm font-bold text-black">
            {activeUtility}
          </h2>
          <p className="text-xs text-[#5e5e5e]">{utilitySubtitle(activeUtility)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-black hover:bg-brand-100"
          aria-label="Close utility panel"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {activeUtility === "Settings" ? (
        <div className="grid gap-3 p-4">
          <SwitchRow
            label="Require approvals"
            description="New time entries route to Approvals before reporting as approved."
            checked={workspaceSettings.requireApprovals}
            onChange={(checked) => onSettingChange("requireApprovals", checked)}
          />
          <SwitchRow
            label="Default billable"
            description="New timers start with billable enabled for faster client work logging."
            checked={workspaceSettings.defaultBillable}
            onChange={(checked) => onSettingChange("defaultBillable", checked)}
          />
          <SwitchRow
            label="Compact table mode"
            description="Saved preference for denser operational views."
            checked={workspaceSettings.compactTables}
            onChange={(checked) => onSettingChange("compactTables", checked)}
          />
          <GhostButton onClick={() => onNavigate("Projects")} icon={BriefcaseBusiness}>
            Manage projects
          </GhostButton>
        </div>
      ) : null}

      {activeUtility === "Notifications" ? (
        <div className="p-4">
          <div className="rounded-2xl border border-transparent bg-black p-4 text-white">
            <p className="text-2xl font-bold">{pendingApprovalCount}</p>
            <p className="mt-1 text-sm font-medium">items need review</p>
            <p className="mt-1 text-sm text-white/75">Time, expenses, and time off requests are waiting in Approvals.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={() => onNavigate("Approvals")} icon={FileCheck2}>
              Review approvals
            </PrimaryButton>
            <GhostButton onClick={() => onNavigate("Activity")} icon={Sparkles}>
              View activity
            </GhostButton>
          </div>
        </div>
      ) : null}

      {activeUtility === "Help" ? (
        <div className="grid gap-3 p-4 text-sm text-slate-700">
          <HelpItem title="Start tracking" description="Add a task description, choose a project, and press START." />
          <HelpItem title="Manual entries" description="Use the timer-reset button to open manual date and duration fields." />
          <HelpItem title="Approvals" description="Pending time, expenses, and time off requests can be approved or rejected." />
          <div className="flex flex-wrap gap-2 pt-1">
            <GhostButton onClick={() => onNavigate("Reports")} icon={Gauge}>Open reports</GhostButton>
            <GhostButton onClick={() => onNavigate("Team")} icon={UsersRound}>Open team</GhostButton>
          </div>
        </div>
      ) : null}

      {activeUtility === "Profile" ? (
        <div className="p-4">
          <div className="rounded-2xl border border-transparent bg-brand-100 p-4">
            <p className="text-base font-bold text-black">{currentUser?.name || "Ava Morgan"}</p>
            <p className="mt-1 text-sm text-[#5e5e5e]">{currentUser?.email || "ava@timetrackr.local"}</p>
            <p className="mt-2 text-sm font-medium text-black">
              {userGrade.label} · {userGrade.title} · {currency(userGrade.hourlyRate)}/hr
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={() => onNavigate("Team")} icon={UserCircle2}>
              Manage profile
            </PrimaryButton>
            <GhostButton onClick={() => onNavigate("Time Tracker")} icon={Clock3}>
              Track time
            </GhostButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SwitchRow({ label, description, checked, onChange }) {
  return (
    <label className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-brand-200 p-3">
      <span>
        <span className="block text-sm font-medium text-black">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[#5e5e5e]">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 accent-black"
      />
    </label>
  );
}

function HelpItem({ title, description }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-3">
      <p className="font-medium text-black">{title}</p>
      <p className="mt-1 text-[#5e5e5e]">{description}</p>
    </div>
  );
}

export function Sidebar({ activeSection, onNavigate }) {
  return (
    <aside className="border-b border-brand-200 bg-brand-100/70 lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:w-[248px] lg:border-b-0 lg:border-r">
      <nav
        className="flex gap-1 overflow-x-auto px-3 py-3 lg:h-full lg:flex-col lg:gap-5 lg:overflow-y-auto lg:px-4 lg:py-5"
        aria-label="Primary navigation"
      >
        {navGroups.map((group) => (
          <div key={group.label} className="contents lg:block">
            <p className="hidden px-3 pb-2 text-xs font-bold uppercase text-[#5e5e5e] lg:block">
              {group.label}
            </p>
            <div className="contents lg:grid lg:gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeSection;

                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onNavigate(item.label)}
                    className={`focus-ring inline-flex min-h-10 shrink-0 items-center gap-3 rounded-full px-3 text-sm font-medium transition ${
                      isActive
                        ? "border border-transparent bg-black text-white"
                        : "text-black hover:bg-white"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? "text-white" : "text-[#5e5e5e]"}`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function PageHeading({ title, subtitle, weeklyTotal, headingRef }) {
  return (
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold leading-10 tracking-normal text-black outline-none sm:text-[2.5rem] sm:leading-[44px]"
        >
          {title}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[#5e5e5e]">{subtitle}</p>
      </div>
      <div
        className="inline-flex items-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 py-2 text-sm font-medium text-black xl:hidden"
        aria-live="polite"
      >
        <Clock3 className="h-4 w-4 text-black" aria-hidden="true" />
        <span>This week</span>
        <span className="text-slate-950">{formatDurationLabel(weeklyTotal)}</span>
      </div>
    </header>
  );
}
