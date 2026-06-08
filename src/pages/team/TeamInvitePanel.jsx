import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  FormField,
  Panel,
  PrimaryButton,
  Select
} from "../../components/ui.jsx";
import { ACCESS_ROLES } from "../../domain/auth.js";
import { currency } from "../../domain/formatters.js";
import { setFormValue } from "../../domain/formUtils.js";
import { createBlankTeamMemberForm } from "../../domain/teamMember.js";
import styles from "../TeamPage.module.css";

export function TeamInvitePanel({
  employmentGrades,
  onAddTeamMember,
  teamMembers
}) {
  const [form, setForm] = useState(() =>
    createBlankTeamMemberForm({ employmentGrades, teamMembers })
  );

  function resetInviteForm() {
    setForm({
      ...createBlankTeamMemberForm({ employmentGrades, teamMembers: [{}] }),
      accessRole: "Member"
    });
  }

  function submitInvite(event) {
    event.preventDefault();
    if (onAddTeamMember(form)) {
      resetInviteForm();
    }
  }

  return (
    <Panel
      title="Invite team member"
      subtitle="Members inherit hourly rates from their employment grade."
    >
      <form className={styles["team-page__style-003"]} onSubmit={submitInvite}>
        <FormField label="Name" htmlFor="team-name">
          <input
            id="team-name"
            value={form.name}
            onChange={(event) => setFormValue(setForm, "name", event.target.value)}
            className={styles["team-page__style-004"]}
          />
        </FormField>
        <FormField label="Email" htmlFor="team-email">
          <input
            id="team-email"
            type="text"
            inputMode="email"
            value={form.email}
            onChange={(event) => setFormValue(setForm, "email", event.target.value)}
            className={styles["team-page__style-005"]}
          />
        </FormField>
        <FormField label="Role" htmlFor="team-role">
          <input
            id="team-role"
            value={form.role}
            onChange={(event) => setFormValue(setForm, "role", event.target.value)}
            className={styles["team-page__style-006"]}
          />
        </FormField>
        <div className={styles["team-page__style-007"]}>
          <FormField label="Capacity" htmlFor="team-capacity">
            <input
              id="team-capacity"
              type="number"
              min="0"
              step="0.5"
              value={form.capacityHours}
              onChange={(event) => setFormValue(setForm, "capacityHours", event.target.value)}
              className={styles["team-page__style-008"]}
            />
          </FormField>
          <FormField label="Access role" htmlFor="team-access-role">
            <Select
              id="team-access-role"
              value={form.accessRole}
              onChange={(value) => setFormValue(setForm, "accessRole", value)}
            >
              {ACCESS_ROLES.map((accessRole) => (
                <option key={accessRole} value={accessRole}>
                  {accessRole}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className={styles["team-page__style-009"]}>
          <FormField label="Employment grade" htmlFor="team-grade">
            <Select
              id="team-grade"
              value={form.gradeId}
              onChange={(value) => setFormValue(setForm, "gradeId", value)}
            >
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
  );
}
