import React from "react";
import {
  Check,
  Pencil,
  Save,
  Trash2,
  X
} from "lucide-react";
import {
  DangerButton,
  FormField,
  GhostButton,
  PrimaryButton,
  Select,
  StatusBadge
} from "../../components/ui.jsx";
import { sumDurations } from "../../timeUtils.js";
import { ACCESS_ROLES, getAccessRole } from "../../domain/auth.js";
import {
  currency,
  formatDurationLabel
} from "../../domain/formatters.js";
import { setFormValue } from "../../domain/formUtils.js";
import { getEmploymentGrade } from "../../domain/projectUtils.js";
import { getTeamMemberDeleteAvailability } from "../../domain/teamMember.js";
import styles from "../TeamPage.module.css";

export function TeamDirectoryCard({
  editForm,
  employmentGrades,
  entries,
  member,
  onCloseMemberEditor,
  onDeleteTeamMember,
  onEditFormChange,
  onMemberStatusChange,
  onOpenMemberEditor,
  onUpdateTeamMember,
  teamMembers
}) {
  const trackedSeconds = sumDurations(entries.filter((entry) => entry.memberId === member.id));
  const grade = getEmploymentGrade(member.gradeId, employmentGrades);
  const deleteAvailability = getTeamMemberDeleteAvailability(teamMembers, member);

  if (editForm) {
    return (
      <article className={styles["team-page__style-026"]}>
        <form
          className={styles["team-page__style-036"]}
          onSubmit={(event) => {
            event.preventDefault();
            if (onUpdateTeamMember(member.id, editForm)) {
              onCloseMemberEditor();
            }
          }}
        >
          <div className={styles["team-page__style-032"]}>
            <div>
              <p className={styles["team-page__style-027"]}>{editForm.name || member.name}</p>
              <p className={styles["team-page__style-028"]}>{editForm.email || member.email}</p>
            </div>
            <div className={styles["team-page__style-033"]}>
              <span className={styles["team-page__style-031"]}>{formatDurationLabel(trackedSeconds)}</span>
              <StatusBadge status={member.status} />
            </div>
          </div>

          <div className={styles["team-page__style-037"]}>
            <FormField label="Name" htmlFor={`${member.id}-edit-name`}>
              <input
                id={`${member.id}-edit-name`}
                value={editForm.name}
                onChange={(event) => setFormValue(onEditFormChange, "name", event.target.value)}
                className={styles["team-page__style-004"]}
              />
            </FormField>
            <FormField label="Email" htmlFor={`${member.id}-edit-email`}>
              <input
                id={`${member.id}-edit-email`}
                type="text"
                inputMode="email"
                value={editForm.email}
                onChange={(event) => setFormValue(onEditFormChange, "email", event.target.value)}
                className={styles["team-page__style-005"]}
              />
            </FormField>
            <FormField label="Role" htmlFor={`${member.id}-edit-role`}>
              <input
                id={`${member.id}-edit-role`}
                value={editForm.role}
                onChange={(event) => setFormValue(onEditFormChange, "role", event.target.value)}
                className={styles["team-page__style-006"]}
              />
            </FormField>
          </div>

          <div className={styles["team-page__style-038"]}>
            <FormField label="Capacity" htmlFor={`${member.id}-edit-capacity`}>
              <input
                id={`${member.id}-edit-capacity`}
                type="number"
                min="0"
                step="0.5"
                value={editForm.capacityHours}
                onChange={(event) => setFormValue(onEditFormChange, "capacityHours", event.target.value)}
                className={styles["team-page__style-008"]}
              />
            </FormField>
            <FormField label="Access role" htmlFor={`${member.id}-edit-access-role`}>
              <Select
                id={`${member.id}-edit-access-role`}
                value={editForm.accessRole}
                onChange={(value) => setFormValue(onEditFormChange, "accessRole", value)}
              >
                {ACCESS_ROLES.map((accessRole) => (
                  <option key={accessRole} value={accessRole}>
                    {accessRole}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Employment grade" htmlFor={`${member.id}-edit-grade`}>
              <Select
                id={`${member.id}-edit-grade`}
                value={editForm.gradeId}
                onChange={(value) => setFormValue(onEditFormChange, "gradeId", value)}
              >
                {employmentGrades.map((employmentGrade) => (
                  <option key={employmentGrade.id} value={employmentGrade.id}>
                    {employmentGrade.label} - {employmentGrade.title} ({currency(employmentGrade.hourlyRate)}/hr)
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className={styles["team-page__style-030"]}>
            <GhostButton
              onClick={onCloseMemberEditor}
              icon={X}
              className={styles["team-page__action-button"]}
            >
              Cancel
            </GhostButton>
            <PrimaryButton
              type="submit"
              icon={Save}
              className={styles["team-page__action-button"]}
            >
              Save
            </PrimaryButton>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className={styles["team-page__style-026"]}>
      <div className={styles["team-page__style-032"]}>
        <div>
          <p className={styles["team-page__style-027"]}>{member.name}</p>
          <p className={styles["team-page__style-028"]}>{member.email}</p>
        </div>
        <div className={styles["team-page__style-033"]}>
          <span className={styles["team-page__style-031"]}>{formatDurationLabel(trackedSeconds)}</span>
          <StatusBadge status={member.status} />
        </div>
      </div>

      <div className={styles["team-page__style-034"]} aria-label={`${member.name} details`}>
        <span className={styles["team-page__style-035"]}>{member.role}</span>
        <span className={styles["team-page__style-035"]}>{getAccessRole(member)} access</span>
        <span className={styles["team-page__style-035"]}>{member.capacityHours}h capacity</span>
        <span className={styles["team-page__style-035"]}>{grade.label} {grade.title}</span>
        <span className={styles["team-page__style-035"]}>{currency(grade.hourlyRate)}/hr</span>
      </div>

      <div className={styles["team-page__style-030"]}>
        <GhostButton
          onClick={() => onOpenMemberEditor(member)}
          icon={Pencil}
          className={styles["team-page__action-button"]}
        >
          Edit
        </GhostButton>
        <GhostButton
          onClick={() => onMemberStatusChange(member.id, member.status === "Active" ? "Inactive" : "Active")}
          icon={member.status === "Active" ? X : Check}
          className={styles["team-page__action-button"]}
        >
          {member.status === "Active" ? "Deactivate" : "Activate"}
        </GhostButton>
        <DangerButton
          onClick={() => onDeleteTeamMember(member.id)}
          disabled={!deleteAvailability.canDelete}
          title={deleteAvailability.title}
          aria-label={`Delete ${member.name}`}
          icon={Trash2}
          className={styles["team-page__action-button"]}
        >
          Delete
        </DangerButton>
      </div>
    </article>
  );
}
