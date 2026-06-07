import React, { useState } from "react";
import {
  Check,
  FileCheck2,
  Plus,
  Receipt,
  X
} from "lucide-react";
import {
  DataTable,
  DateInput,
  FilterSelect,
  FormField,
  MetricCard,
  Panel,
  PrimaryButton,
  ProjectBadge,
  RowActions,
  Select,
  StatusBadge
} from "../components/ui.jsx";
import { formatReadableDate } from "../domain/dateUtils.js";
import { currency } from "../domain/formatters.js";
import { setFormValue } from "../domain/formUtils.js";
import {
  getProject,
  memberName
} from "../domain/projectUtils.js";
import styles from "./ExpensesPage.module.css";

export function ExpensesPage({ expenses, projects, teamMembers, todayKey, onAddExpense, onExpenseStatusChange }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState({
    merchant: "Workspace tools",
    amount: "48",
    category: "Software",
    dateKey: todayKey,
    projectId: projects[0]?.id || "",
    note: "Monthly subscription"
  });
  const visibleExpenses = expenses.filter((expense) => statusFilter === "All" || expense.status === statusFilter);

  return (
    <div className={styles["expenses-page__style-001"]}>
      <section className={styles["expenses-page__style-002"]}>
        <MetricCard label="Submitted" value={currency(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} helper={`${expenses.length} total expenses`} icon={Receipt} />
        <MetricCard label="Pending" value={currency(expenses.filter((expense) => expense.status === "Pending").reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} helper="Waiting on approval" icon={FileCheck2} />
        <MetricCard label="Approved" value={currency(expenses.filter((expense) => expense.status === "Approved").reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} helper="Ready for reimbursement" icon={Check} />
      </section>

      <Panel title="Submit expense" subtitle="Add reimbursable or project-related costs.">
        <form
          className={styles["expenses-page__style-003"]}
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddExpense(form)) {
              setForm((current) => ({ ...current, merchant: "", amount: "", note: "" }));
            }
          }}
        >
          <FormField label="Merchant" htmlFor="expense-merchant"><input id="expense-merchant" value={form.merchant} onChange={(event) => setFormValue(setForm, "merchant", event.target.value)} className={styles["expenses-page__style-004"]} /></FormField>
          <FormField label="Amount" htmlFor="expense-amount"><input id="expense-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setFormValue(setForm, "amount", event.target.value)} className={styles["expenses-page__style-005"]} /></FormField>
          <FormField label="Category" htmlFor="expense-category"><Select id="expense-category" value={form.category} onChange={(value) => setFormValue(setForm, "category", value)}><option>Software</option><option>Travel</option><option>Meals</option><option>Office</option></Select></FormField>
          <FormField label="Project" htmlFor="expense-project"><Select id="expense-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <FormField label="Date" htmlFor="expense-date"><DateInput id="expense-date" value={form.dateKey} onChange={(value) => setFormValue(setForm, "dateKey", value)} className={styles["expenses-page__style-006"]} /></FormField>
          <FormField label="Note" htmlFor="expense-note"><input id="expense-note" value={form.note} onChange={(event) => setFormValue(setForm, "note", event.target.value)} className={styles["expenses-page__style-007"]} /></FormField>
          <div className={styles["expenses-page__style-008"]}><PrimaryButton type="submit" icon={Plus}>Submit</PrimaryButton></div>
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
            <span className={styles["expenses-page__style-009"]}>{expense.merchant}</span>,
            <ProjectBadge project={getProject(projects, expense.projectId)} />,
            memberName(expense.submittedBy, teamMembers),
            formatReadableDate(expense.dateKey),
            currency(expense.amount),
            <StatusBadge status={expense.status} />,
            <RowActions
              primaryLabel="Mark paid"
              primaryAriaLabel={`Mark ${expense.merchant} expense paid`}
              primaryIcon={Check}
              primaryDisabled={expense.status !== "Approved"}
              primaryIntent="success"
              onPrimary={() => onExpenseStatusChange(expense.id, "Paid")}
              secondaryLabel="Reject"
              secondaryAriaLabel={`Reject ${expense.merchant} expense`}
              secondaryIcon={X}
              secondaryIntent="danger"
              onSecondary={() => onExpenseStatusChange(expense.id, "Rejected")}
            />
          ])}
        />
      </Panel>
    </div>
  );
}
