import React from "react";
import {
  Clock3,
  Gauge,
  PoundSterling
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
  addDays,
  dateFromKey,
  getLocalDateKey
} from "../domain/dateUtils.js";
import {
  getProject,
  projectStyle
} from "../domain/projectUtils.js";
import styles from "./DashboardPage.module.css";

const TEAM_UTILISATION_WINDOW_DAYS = 30;

function getBillableIncomeSummary(entries, projects) {
  const projectIncome = new Map();

  for (const entry of entries) {
    if (!entry.billable) {
      continue;
    }

    const project = getProject(projects, entry.projectId);
    const income = (Number(entry.durationSeconds || 0) / 3600) * Number(project.hourlyRate || 0);
    projectIncome.set(entry.projectId, {
      project,
      income: (projectIncome.get(entry.projectId)?.income || 0) + income
    });
  }

  const incomeRows = Array.from(projectIncome.values());
  const totalIncome = incomeRows.reduce((sum, row) => sum + row.income, 0);
  const highestIncomeProject = incomeRows.reduce(
    (highest, row) => (!highest || row.income > highest.income ? row : highest),
    null
  );

  return {
    highestIncomeProject,
    totalIncome
  };
}

function getTeamUtilisationSummary(entries, teamMembers, todayKey) {
  const endKey = todayKey || getLocalDateKey(new Date());
  const startKey = getLocalDateKey(addDays(dateFromKey(endKey), -(TEAM_UTILISATION_WINDOW_DAYS - 1)));
  const windowEntries = entries.filter((entry) => entry.dateKey >= startKey && entry.dateKey <= endKey);
  const activeMembers = teamMembers.filter((member) =>
    member.status !== "Archived" || windowEntries.some((entry) => entry.memberId === member.id)
  );
  const memberIds = new Set(activeMembers.map((member) => member.id));
  const trackedSeconds = windowEntries.reduce(
    (sum, entry) => sum + (memberIds.has(entry.memberId) ? Number(entry.durationSeconds || 0) : 0),
    0
  );
  const weeklyCapacityHours = activeMembers.reduce(
    (sum, member) => sum + Number(member.capacityHours || 0),
    0
  );
  const capacitySeconds = weeklyCapacityHours * (TEAM_UTILISATION_WINDOW_DAYS / 7) * 3600;

  return {
    capacitySeconds,
    trackedSeconds,
    utilisation: percent(trackedSeconds, capacitySeconds)
  };
}

function getMemberUtilisationRows(entries, teamMembers) {
  const secondsByMember = entries.reduce((groups, entry) => {
    const memberId = entry.memberId || "unassigned";
    groups[memberId] = (groups[memberId] || 0) + Number(entry.durationSeconds || 0);
    return groups;
  }, {});

  return teamMembers
    .filter((member) => member.status !== "Archived" || secondsByMember[member.id])
    .map((member) => {
      const trackedSeconds = secondsByMember[member.id] || 0;
      const capacitySeconds = Math.max(0, Number(member.capacityHours || 0) * 3600);

      return {
        ...member,
        capacitySeconds,
        trackedSeconds,
        utilisation: percent(trackedSeconds, capacitySeconds)
      };
    })
    .sort((left, right) =>
      right.utilisation - left.utilisation ||
      right.trackedSeconds - left.trackedSeconds ||
      left.name.localeCompare(right.name)
    );
}

export function DashboardPage({
  entries = [],
  weeklyEntries,
  weeklyTotal,
  projects,
  teamMembers = [],
  todayKey,
  activityItems,
  onNavigate
}) {
  const billableTotal = sumBillableDurations(weeklyEntries);
  const billableEntries = weeklyEntries.filter((entry) => entry.billable);
  const billableIncome = getBillableIncomeSummary(weeklyEntries, projects);
  const teamUtilisation = getTeamUtilisationSummary(entries, teamMembers, todayKey);
  const projectGroups = groupDurationsByProject(billableEntries);
  const projectRows = Object.entries(projectGroups);
  const memberUtilisationRows = getMemberUtilisationRows(weeklyEntries, teamMembers);
  const billableIncomeHelper = billableIncome.highestIncomeProject
    ? `Highest billable: ${billableIncome.highestIncomeProject.project.name} · ${currency(billableIncome.highestIncomeProject.income)}`
    : "No billable project income this week";
  const teamUtilisationHelper = `${formatDurationLabel(teamUtilisation.trackedSeconds)} / ${formatDurationLabel(teamUtilisation.capacitySeconds)} capacity`;

  return (
    <>
      <section
        className={styles["dashboard-page__style-001"]}
        aria-label="Workspace metrics"
        data-guidance-target="overview-metrics"
      >
        <MetricCard label="Tracked this week" value={formatDurationLabel(weeklyTotal)} helper="All approved and pending time" icon={Clock3} />
        <MetricCard label="Billable time" value={formatDurationLabel(billableTotal)} helper={`${percent(billableTotal, weeklyTotal)}% of tracked time`} icon={PoundSterling} />
        <MetricCard label="Team utilisation" value={`${teamUtilisation.utilisation}%`} helper={`Past 30 days · ${teamUtilisationHelper}`} icon={Gauge} />
        <MetricCard label="Billable income" value={currency(billableIncome.totalIncome)} helper={billableIncomeHelper} icon={PoundSterling} />
      </section>

      <div className={styles["dashboard-page__style-002"]}>
        <Panel
          title="Project utilisation"
          subtitle="Billable time this week by project."
          action={<GhostButton onClick={() => onNavigate("Reports")} icon={Gauge}>Open reports</GhostButton>}
        >
          <div className={styles["dashboard-page__style-003"]}>
            {projectRows.length ? projectRows.map(([currentProjectId, seconds]) => {
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
                      style={{ width: `${Math.min(100, Math.max(6, percent(seconds, billableTotal)))}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <p className={styles["dashboard-page__style-016"]}>No billable time recorded this week.</p>
            )}
          </div>
        </Panel>

        <div className={styles["dashboard-page__style-007"]}>
          <Panel title="Individual utilisation" subtitle="This week, highest to lowest.">
            <ol className={styles["dashboard-page__style-008"]}>
              {memberUtilisationRows.map((member, index) => {
                const width = Math.min(
                  100,
                  Math.max(member.utilisation > 0 ? 6 : 0, member.utilisation)
                );
                const capacityLabel = member.capacitySeconds
                  ? `${formatDurationLabel(member.trackedSeconds)} / ${formatDurationLabel(member.capacitySeconds)} capacity`
                  : `${formatDurationLabel(member.trackedSeconds)} tracked`;

                return (
                  <li key={member.id} className={styles["dashboard-page__style-009"]}>
                    <div className={styles["dashboard-page__style-010"]}>
                      <span className={styles["dashboard-page__style-011"]}>{index + 1}</span>
                      <div className={styles["dashboard-page__style-012"]}>
                        <span className={styles["dashboard-page__style-013"]}>{member.name}</span>
                        <span className={styles["dashboard-page__style-014"]}>{capacityLabel}</span>
                      </div>
                      <span className={styles["dashboard-page__style-015"]}>{member.utilisation}%</span>
                    </div>
                    <div className={styles["dashboard-page__style-006"]}>
                      <div
                        className={styles["dashboard-page__utilisation-fill"]}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title="Recent activity" subtitle="Latest workspace changes.">
            <ActivityList items={activityItems.slice(0, 6)} />
          </Panel>
        </div>
      </div>
    </>
  );
}
