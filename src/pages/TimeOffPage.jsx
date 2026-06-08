import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  DataTable,
  DateInput,
  FormField,
  Panel,
  PrimaryButton,
  Select,
  StatusBadge
} from "../components/ui.jsx";
import { formatReadableDate } from "../domain/dateUtils.js";
import { setFormValue } from "../domain/formUtils.js";
import { memberName } from "../domain/projectUtils.js";
import styles from "./TimeOffPage.module.css";

export function TimeOffPage({ timeOffRequests, teamMembers, todayKey, onAddTimeOff }) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "",
    type: "Vacation",
    startDate: todayKey,
    endDate: todayKey,
    days: "1",
    note: "Personal time"
  });

  return (
    <div className={styles["time-off-page__style-001"]}>
      <Panel title="Request time off" subtitle="Requests are routed to approvals.">
        <form
          className={styles["time-off-page__style-002"]}
          onSubmit={(event) => {
            event.preventDefault();
            if (onAddTimeOff(form)) {
              setForm((current) => ({ ...current, note: "", days: "1" }));
            }
          }}
        >
          <FormField label="Person" htmlFor="timeoff-person"><Select id="timeoff-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Type" htmlFor="timeoff-type"><Select id="timeoff-type" value={form.type} onChange={(value) => setFormValue(setForm, "type", value)}><option>Vacation</option><option>Sick leave</option><option>Personal</option></Select></FormField>
          <div className={styles["time-off-page__style-003"]}>
            <FormField label="Start" htmlFor="timeoff-start"><DateInput id="timeoff-start" value={form.startDate} onChange={(value) => setFormValue(setForm, "startDate", value)} className={styles["time-off-page__style-004"]} /></FormField>
            <FormField label="End" htmlFor="timeoff-end"><DateInput id="timeoff-end" value={form.endDate} onChange={(value) => setFormValue(setForm, "endDate", value)} className={styles["time-off-page__style-005"]} /></FormField>
          </div>
          <FormField label="Days" htmlFor="timeoff-days"><input id="timeoff-days" type="number" min="0.5" step="0.5" value={form.days} onChange={(event) => setFormValue(setForm, "days", event.target.value)} className={styles["time-off-page__style-006"]} /></FormField>
          <FormField label="Note" htmlFor="timeoff-note"><input id="timeoff-note" value={form.note} onChange={(event) => setFormValue(setForm, "note", event.target.value)} className={styles["time-off-page__style-007"]} /></FormField>
          <PrimaryButton type="submit" icon={Plus}>Submit request</PrimaryButton>
        </form>
      </Panel>

      <Panel title="Time off ledger" subtitle="Balances and request statuses.">
        <div className={styles["time-off-page__style-008"]}>
          {teamMembers.map((member) => {
            const approvedDays = timeOffRequests
              .filter((request) => request.memberId === member.id && request.status === "Approved")
              .reduce((sum, request) => sum + Number(request.days || 0), 0);
            return (
              <div key={member.id} className={styles["time-off-page__style-009"]}>
                <p className={styles["time-off-page__style-010"]}>{member.name}</p>
                <p className={styles["time-off-page__style-011"]}>{Math.max(0, 20 - approvedDays)} days remaining</p>
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
