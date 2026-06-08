import React, { useEffect, useState } from "react";
import {
  Check,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import {
  FormField,
  DangerButton,
  GhostButton,
  Panel,
  PrimaryButton,
  Select,
  StatusBadge
} from "../components/ui.jsx";
import { sumDurations } from "../timeUtils.js";
import { ACCESS_ROLES } from "../domain/auth.js";
import {
  currency,
  formatDurationLabel
} from "../domain/formatters.js";
import { setFormValue } from "../domain/formUtils.js";
import { getEmploymentGrade } from "../domain/projectUtils.js";
import styles from "./TeamPage.module.css";

export function TeamPage({
  teamMembers,
  entries,
  employmentGrades,
  onAddTeamMember,
  onMemberStatusChange,
  onDeleteTeamMember,
  onEmploymentGradeChange
}) {
  const [query, setQuery] = useState("");
  const initialAccessRole = teamMembers.length === 0 ? "Owner" : "Member";
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Designer",
    accessRole: initialAccessRole,
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
    `${member.name} ${member.email} ${member.role} ${member.accessRole || "Member"} ${getEmploymentGrade(member.gradeId, employmentGrades).title}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const canDeleteMembers = teamMembers.length > 1;

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
    <div className={styles["team-page__style-001"]}>
      <div className={styles["team-page__style-002"]}>
        <Panel title="Invite team member" subtitle="Members inherit hourly rates from their employment grade.">
          <form
            className={styles["team-page__style-003"]}
            onSubmit={(event) => {
              event.preventDefault();
              if (onAddTeamMember(form)) {
                setForm({
                  name: "",
                  email: "",
                  role: "Designer",
                  accessRole: "Member",
                  capacityHours: "40",
                  gradeId: employmentGrades[1]?.id || "grade-2"
                });
              }
            }}
          >
            <FormField label="Name" htmlFor="team-name"><input id="team-name" value={form.name} onChange={(event) => setFormValue(setForm, "name", event.target.value)} className={styles["team-page__style-004"]} /></FormField>
            <FormField label="Email" htmlFor="team-email"><input id="team-email" type="text" inputMode="email" value={form.email} onChange={(event) => setFormValue(setForm, "email", event.target.value)} className={styles["team-page__style-005"]} /></FormField>
            <FormField label="Role" htmlFor="team-role"><input id="team-role" value={form.role} onChange={(event) => setFormValue(setForm, "role", event.target.value)} className={styles["team-page__style-006"]} /></FormField>
            <div className={styles["team-page__style-007"]}>
              <FormField label="Capacity" htmlFor="team-capacity"><input id="team-capacity" type="number" min="0" value={form.capacityHours} onChange={(event) => setFormValue(setForm, "capacityHours", event.target.value)} className={styles["team-page__style-008"]} /></FormField>
              <FormField label="Access role" htmlFor="team-access-role">
                <Select id="team-access-role" value={form.accessRole} onChange={(value) => setFormValue(setForm, "accessRole", value)}>
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
          <div className={styles["team-page__style-010"]}>
            {employmentGrades.map((grade, index) => (
              <form
                key={grade.id}
                className={styles["team-page__style-011"]}
                onSubmit={(event) => {
                  event.preventDefault();
                  onEmploymentGradeChange(grade.id, {
                    title: gradeDrafts[grade.id]?.title || grade.title,
                    hourlyRate: gradeDrafts[grade.id]?.hourlyRate || grade.hourlyRate,
                    description: gradeDrafts[grade.id]?.description || grade.description
                  });
                }}
              >
                <div className={styles["team-page__style-012"]}>
                  <div className={styles["team-page__style-013"]}>
                    <p className={styles["team-page__style-014"]}>{grade.label}</p>
                    <span className={styles["team-page__style-015"]}>
                      {currency(grade.hourlyRate)}/hr
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
                      className={styles["team-page__style-016"]}
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
                      className={styles["team-page__style-017"]}
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
                      className={styles["team-page__style-018"]}
                    />
                  </FormField>
                </div>
                {index > 0 ? (
                  <p className={styles["team-page__style-019"]}>
                    Higher than {employmentGrades[index - 1].label} by{" "}
                    {currency(grade.hourlyRate - employmentGrades[index - 1].hourlyRate)}/hr
                  </p>
                ) : null}
                <button
                  type="submit"
                  className={styles["team-page__style-020"]}
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
          <label className={styles["team-page__style-021"]}>
            <Search className={styles["team-page__style-022"]} aria-hidden="true" />
            <span className={styles["team-page__style-023"]}>Search team</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className={styles["team-page__style-024"]} />
          </label>
        }
      >
        <div className={styles["team-page__style-025"]}>
          {visibleMembers.map((member) => {
            const trackedSeconds = sumDurations(entries.filter((entry) => entry.memberId === member.id));
            const grade = getEmploymentGrade(member.gradeId, employmentGrades);
            return (
              <article key={member.id} className={styles["team-page__style-026"]}>
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
                  <span className={styles["team-page__style-035"]}>{member.accessRole || "Member"} access</span>
                  <span className={styles["team-page__style-035"]}>{member.capacityHours}h capacity</span>
                  <span className={styles["team-page__style-035"]}>{grade.label} {grade.title}</span>
                  <span className={styles["team-page__style-035"]}>{currency(grade.hourlyRate)}/hr</span>
                </div>

                <div className={styles["team-page__style-030"]}>
                  <GhostButton
                    onClick={() => onMemberStatusChange(member.id, member.status === "Active" ? "Inactive" : "Active")}
                    icon={member.status === "Active" ? X : Check}
                    className={styles["team-page__action-button"]}
                  >
                    {member.status === "Active" ? "Deactivate" : "Activate"}
                  </GhostButton>
                  <DangerButton
                    onClick={() => onDeleteTeamMember(member.id)}
                    disabled={!canDeleteMembers}
                    title={canDeleteMembers ? `Delete ${member.name}` : "Add another owner before deleting the last workspace member"}
                    aria-label={`Delete ${member.name}`}
                    icon={Trash2}
                    className={styles["team-page__action-button"]}
                  >
                    Delete
                  </DangerButton>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
