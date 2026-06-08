import React, { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Download,
  Gauge,
  LucideCalendarClock,
  PoundSterling,
  X
} from "lucide-react";
import {
  BillableBadge,
  DataTable,
  DateInput,
  FormField,
  GhostButton,
  IconTooltipButton,
  MarginBadge,
  MetricCard,
  Panel,
  ProjectBadge,
  Select,
  StatusBadge
} from "../components/ui.jsx";
import { cx } from "../components/classNames.js";
import { DEFAULT_REPORT_FILTERS } from "../domain/appConfig.js";
import { formatReadableDate } from "../domain/dateUtils.js";
import {
  currency,
  formatDurationLabel,
  formatMargin,
  percent
} from "../domain/formatters.js";
import {
  getProject,
  memberName,
  projectStyle
} from "../domain/projectUtils.js";
import { buildReportData } from "../domain/reportCsv.js";
import styles from "./ReportsPage.module.css";

export function ReportsPage({
  entries,
  projects,
  teamMembers,
  employmentGrades,
  scheduleItems,
  reportFilters,
  onExportReportCsv = () => {},
  onReportFiltersChange
}) {
  const [fallbackFilters, setFallbackFilters] = useState(DEFAULT_REPORT_FILTERS);
  const filters = reportFilters || fallbackFilters;
  const setFilters = onReportFiltersChange || setFallbackFilters;
  const reportData = useMemo(
    () =>
      buildReportData({
        entries,
        projects,
        teamMembers,
        employmentGrades,
        scheduleItems,
        filters
      }),
    [employmentGrades, entries, filters, projects, scheduleItems, teamMembers]
  );
  const {
    activeFilterChips,
    billableTotal,
    clientOptions,
    filteredEntries,
    hasActiveFilters,
    projectGroups,
    projectMetrics,
    tagOptions,
    total,
    totalActualCost,
    totalBudgetValue,
    totalMarginPercent,
    totalScheduledSeconds,
    visibleProjects
  } = reportData;

  function exportCsv() {
    onExportReportCsv(reportData);
  }

  return (
    <div className={styles["reports-page__style-001"]}>
      <div data-guidance-target="report-filters">
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
      </div>

      <section className={styles["reports-page__style-002"]}>
        <MetricCard label="Project budget" value={currency(totalBudgetValue)} helper={`${visibleProjects.length} projects in view`} icon={BriefcaseBusiness} />
        <MetricCard label="Scheduled time" value={formatDurationLabel(totalScheduledSeconds)} helper="Filtered planned work blocks" icon={LucideCalendarClock} />
        <MetricCard label="Actual cost" value={currency(totalActualCost)} helper={`${filteredEntries.length} filtered entries`} icon={PoundSterling} />
        <MetricCard label="Margin" value={formatMargin(totalMarginPercent)} helper={hasActiveFilters ? "Based on active filters" : "Budget minus labor cost"} icon={Gauge} />
      </section>

      <Panel
        title="Project performance by filter"
        subtitle="Budget, scheduled time, actual time spent, actual cost, and margin update from the active filters."
        action={
          <IconTooltipButton
            onClick={exportCsv}
            icon={Download}
            label="Export project performance CSV"
            title="Export CSV."
            description="Download the current project performance table as a CSV file."
          />
        }
      >
        <DataTable
          columns={["Project", "Budget", "Scheduled time", "Actual time spent", "Actual cost", "Margin %", "Budget used"]}
          rows={projectMetrics.map((metric) => [
            <ProjectBadge project={metric.project} />,
            <div>
              <p className={styles["reports-page__style-003"]}>{currency(metric.budgetValue)}</p>
              <p className={styles["reports-page__style-004"]}>
                {formatDurationLabel(metric.budgetSeconds)} at {currency(metric.project.hourlyRate)}/hr
              </p>
            </div>,
            <span className={styles["reports-page__style-005"]}>{formatDurationLabel(metric.scheduledSeconds)}</span>,
            <span className={styles["reports-page__style-006"]}>{formatDurationLabel(metric.actualSeconds)}</span>,
            <div>
              <p className={styles["reports-page__style-007"]}>{currency(metric.actualCost)}</p>
              <p className={styles["reports-page__style-008"]}>Based on employment grades</p>
            </div>,
            <MarginBadge value={metric.marginPercent} />,
            <div>
              <div className={styles["reports-page__style-009"]}>
                <span>{percent(metric.actualSeconds, metric.budgetSeconds)}%</span>
                <span>{formatDurationLabel(metric.actualSeconds)} / {formatDurationLabel(metric.budgetSeconds)}</span>
              </div>
              <div className={styles["reports-page__style-010"]}>
                <div
                  className={cx(styles["reports-page__progress-fill"], projectStyle(metric.project).dot)}
                  style={{ width: `${Math.min(100, Math.max(4, percent(metric.actualSeconds, metric.budgetSeconds)))}%` }}
                />
              </div>
            </div>
          ])}
        />
      </Panel>

      <div className={styles["reports-page__style-011"]}>
        <Panel title="Project breakdown" subtitle="Share of filtered time.">
          <div className={styles["reports-page__style-012"]}>
            <div className={styles["reports-page__style-013"]}>
              <div>
                <p className={styles["reports-page__style-014"]}>Billable</p>
                <p className={styles["reports-page__style-015"]}>{formatDurationLabel(billableTotal)}</p>
              </div>
              <div>
                <p className={styles["reports-page__style-016"]}>Non-billable</p>
                <p className={styles["reports-page__style-017"]}>{formatDurationLabel(total - billableTotal)}</p>
              </div>
            </div>
            {Object.entries(projectGroups).map(([currentProjectId, seconds]) => {
              const project = getProject(projects, currentProjectId);
              const style = projectStyle(project);
              return (
                <div key={currentProjectId}>
                  <div className={styles["reports-page__style-018"]}>
                    <ProjectBadge project={project} />
                    <span className={styles["reports-page__style-019"]}>{formatDurationLabel(seconds)}</span>
                  </div>
                  <div className={styles["reports-page__style-020"]}>
                    <div className={cx(styles["reports-page__progress-fill"], style.dot)} style={{ width: `${Math.max(6, percent(seconds, total))}%` }} />
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
              <span className={styles["reports-page__style-021"]}>{entry.description}</span>,
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
        <div className={styles["reports-page__style-022"]}>
          {hasActiveFilters ? (
            <GhostButton onClick={() => setFilters({ ...DEFAULT_REPORT_FILTERS })} icon={X}>
              Clear filters
            </GhostButton>
          ) : null}
          <IconTooltipButton
            onClick={exportCsv}
            icon={Download}
            label="Export report CSV"
            title="Export CSV."
            description="Download the filtered report entries and summary data as a CSV file."
          />
        </div>
      }
    >
      <div className={styles["reports-page__style-023"]}>
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
          <DateInput
            id="report-date-from"
            value={filters.dateFrom}
            onChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
            className={styles["reports-page__style-024"]}
          />
        </FormField>
        <FormField label="To date" htmlFor="report-date-to">
          <DateInput
            id="report-date-to"
            value={filters.dateTo}
            onChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
            className={styles["reports-page__style-025"]}
          />
        </FormField>
      </div>
      <div className={styles["reports-page__style-026"]} aria-live="polite">
        <p className={styles["reports-page__style-027"]}>Active report filters</p>
        <div className={styles["reports-page__style-028"]}>
          {activeFilterChips.length ? activeFilterChips.map((filterLabel) => (
            <span key={filterLabel} className={styles["reports-page__style-029"]}>
              {filterLabel}
            </span>
          )) : (
            <span className={styles["reports-page__style-030"]}>No filters applied. Showing all report data.</span>
          )}
        </div>
      </div>
    </Panel>
  );
}
