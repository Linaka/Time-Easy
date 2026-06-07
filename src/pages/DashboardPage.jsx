import React from "react";
import {
  Clock3,
  FileCheck2,
  Gauge,
  PoundSterling,
  Receipt
} from "lucide-react";
import {
  ActivityList,
  GhostButton,
  MetricCard,
  Panel,
  ProjectBadge
} from "../components/ui.jsx";
import { cx } from "../components/classNames.js";
import {
  groupDurationsByProject,
  sumBillableDurations
} from "../timeUtils.js";
import {
  currency,
  formatDurationLabel,
  percent
} from "../domain/formatters.js";
import {
  getProject,
  projectStyle
} from "../domain/projectUtils.js";
import styles from "./DashboardPage.module.css";

export function DashboardPage({
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
      <section
        className={styles["dashboard-page__style-001"]}
        aria-label="Workspace metrics"
        data-guidance-target="overview-metrics"
      >
        <MetricCard label="Tracked this week" value={formatDurationLabel(weeklyTotal)} helper="All approved and pending time" icon={Clock3} />
        <MetricCard label="Billable time" value={formatDurationLabel(billableTotal)} helper={`${percent(billableTotal, weeklyTotal)}% of tracked time`} icon={PoundSterling} />
        <MetricCard label="Pending approvals" value={String(pendingApprovalCount)} helper="Time, expenses, and time off" icon={FileCheck2} />
        <MetricCard label="Expenses logged" value={currency(expenseTotal)} helper={`${expenses.length} expense records`} icon={Receipt} />
      </section>

      <div className={styles["dashboard-page__style-002"]}>
        <Panel
          title="Project utilization"
          subtitle="This week by project."
          action={<GhostButton onClick={() => onNavigate("Reports")} icon={Gauge}>Open reports</GhostButton>}
        >
          <div className={styles["dashboard-page__style-003"]}>
            {Object.entries(projectGroups).map(([currentProjectId, seconds]) => {
              const project = getProject(projects, currentProjectId);
              const style = projectStyle(project);
              return (
                <div key={currentProjectId}>
                  <div className={styles["dashboard-page__style-004"]}>
                    <ProjectBadge project={project} />
                    <span className={styles["dashboard-page__style-005"]}>{formatDurationLabel(seconds)}</span>
                  </div>
                  <div className={styles["dashboard-page__style-006"]}>
                    <div
                      className={cx(styles["dashboard-page__progress-fill"], style.dot)}
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
