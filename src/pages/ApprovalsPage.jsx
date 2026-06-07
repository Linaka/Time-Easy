import React from "react";
import {
  AlarmClock,
  Check,
  Clock3,
  Receipt,
  X
} from "lucide-react";
import {
  DataTable,
  MetricCard,
  Panel,
  ProjectBadge,
  RowActions
} from "../components/ui.jsx";
import { formatReadableDate } from "../domain/dateUtils.js";
import {
  currency,
  formatDurationLabel
} from "../domain/formatters.js";
import {
  getProject,
  memberName
} from "../domain/projectUtils.js";
import styles from "./ApprovalsPage.module.css";

export function ApprovalsPage({
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
    <div className={styles["approvals-page__style-001"]}>
      <section className={styles["approvals-page__style-002"]}>
        <MetricCard label="Time entries" value={String(pendingEntries.length)} helper="Pending approval" icon={Clock3} />
        <MetricCard label="Expenses" value={String(pendingExpenses.length)} helper="Pending reimbursement review" icon={Receipt} />
        <MetricCard label="Time off" value={String(pendingTimeOff.length)} helper="Pending manager approval" icon={AlarmClock} />
      </section>
      <Panel title="Approve time" subtitle="New timer and timesheet entries enter this queue.">
        <DataTable
          columns={["Task", "Project", "Person", "Date", "Duration", "Actions"]}
          rows={pendingEntries.map((entry) => [
            <span className={styles["approvals-page__style-003"]}>{entry.description}</span>,
            <ProjectBadge project={getProject(projects, entry.projectId)} />,
            memberName(entry.memberId, teamMembers),
            formatReadableDate(entry.dateKey),
            formatDurationLabel(entry.durationSeconds),
            <RowActions
              primaryLabel="Approve"
              primaryAriaLabel={`Approve time entry ${entry.description}`}
              primaryIcon={Check}
              primaryIntent="success"
              onPrimary={() => onEntryApprovalChange(entry.id, "Approved")}
              secondaryLabel="Reject"
              secondaryAriaLabel={`Reject time entry ${entry.description}`}
              secondaryIcon={X}
              secondaryIntent="danger"
              onSecondary={() => onEntryApprovalChange(entry.id, "Rejected")}
            />
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
            <RowActions
              primaryLabel="Approve"
              primaryAriaLabel={`Approve expense ${expense.merchant}`}
              primaryIcon={Check}
              primaryIntent="success"
              onPrimary={() => onExpenseStatusChange(expense.id, "Approved")}
              secondaryLabel="Reject"
              secondaryAriaLabel={`Reject expense ${expense.merchant}`}
              secondaryIcon={X}
              secondaryIntent="danger"
              onSecondary={() => onExpenseStatusChange(expense.id, "Rejected")}
            />
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
            <RowActions
              primaryLabel="Approve"
              primaryAriaLabel={`Approve time off for ${memberName(request.memberId, teamMembers)}`}
              primaryIcon={Check}
              primaryIntent="success"
              onPrimary={() => onTimeOffStatusChange(request.id, "Approved")}
              secondaryLabel="Reject"
              secondaryAriaLabel={`Reject time off for ${memberName(request.memberId, teamMembers)}`}
              secondaryIcon={X}
              secondaryIntent="danger"
              onSecondary={() => onTimeOffStatusChange(request.id, "Rejected")}
            />
          ])}
        />
      </Panel>
    </div>
  );
}
