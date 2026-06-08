import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  UserCircle2
} from "lucide-react";
import { getAccessRole } from "../../domain/auth.js";
import { WORKSPACE_THEME_IDS } from "../../domain/appConfig.js";
import { getEmploymentGrade } from "../../domain/projectUtils.js";
import { PrimaryButton, StatusBadge } from "../ui.jsx";
import { cx } from "../classNames.js";
import styles from "./IdentityLaunch.module.css";

const ROLE_DETAILS = {
  Owner: {
    icon: ShieldCheck,
    summary: "All workspace views"
  },
  Manager: {
    icon: BriefcaseBusiness,
    summary: "Planning, reporting, and team views"
  },
  Member: {
    icon: UserCircle2,
    summary: "Contributor views"
  }
};

export function IdentityLaunch({
  employmentGrades,
  onSelectUser,
  selectedUserId,
  statusMessage,
  teamMembers,
  workspaceSettings
}) {
  const preferredUserId = useMemo(() => {
    if (teamMembers.some((member) => member.id === selectedUserId)) {
      return selectedUserId;
    }

    return teamMembers[0]?.id || "";
  }, [selectedUserId, teamMembers]);
  const [draftUserId, setDraftUserId] = useState(preferredUserId);
  const selectedMember = teamMembers.find((member) => member.id === draftUserId);
  const themeClassName = {
    [WORKSPACE_THEME_IDS.SOFT_STUDIO]: styles["identity-launch--theme-soft-studio"],
    [WORKSPACE_THEME_IDS.KAWAII_POP]: styles["identity-launch--theme-kawaii-pop"]
  }[workspaceSettings.themeId];

  useEffect(() => {
    setDraftUserId((currentUserId) =>
      teamMembers.some((member) => member.id === currentUserId)
        ? currentUserId
        : preferredUserId
    );
  }, [preferredUserId, teamMembers]);

  function handleSubmit(event) {
    event.preventDefault();
    if (selectedMember) {
      onSelectUser(selectedMember.id);
    }
  }

  return (
    <main className={cx(styles["identity-launch"], themeClassName)}>
      <section className={styles["identity-launch__content"]} aria-labelledby="identity-launch-title">
        <header className={styles["identity-launch__header"]}>
          <img
            src="/creative-operations-logo.png"
            alt="Creative Operations"
            className={styles["identity-launch__logo"]}
          />
          <div>
            <h1 id="identity-launch-title" className={styles["identity-launch__title"]}>
              Who is using this workspace?
            </h1>
            <p className={styles["identity-launch__subtitle"]}>
              Views open from the selected member's access role.
            </p>
          </div>
        </header>

        <form className={styles["identity-launch__form"]} onSubmit={handleSubmit}>
          {teamMembers.length ? (
            <div className={styles["identity-launch__members"]} role="radiogroup" aria-label="Team members">
              {teamMembers.map((member) => (
                <MemberOption
                  checked={member.id === draftUserId}
                  employmentGrades={employmentGrades}
                  key={member.id}
                  member={member}
                  onChange={setDraftUserId}
                />
              ))}
            </div>
          ) : (
            <p className={styles["identity-launch__empty"]}>
              Add a team member before opening the workspace.
            </p>
          )}

          <div className={styles["identity-launch__actions"]}>
            <PrimaryButton type="submit" icon={ArrowRight} disabled={!selectedMember}>
              {selectedMember ? `Continue as ${selectedMember.name}` : "Continue"}
            </PrimaryButton>
            <p className={styles["identity-launch__status"]} role="status" aria-live="polite">
              {statusMessage}
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}

function MemberOption({ checked, employmentGrades, member, onChange }) {
  const accessRole = getAccessRole(member);
  const roleDetails = ROLE_DETAILS[accessRole] || ROLE_DETAILS.Member;
  const RoleIcon = roleDetails.icon;
  const grade = getEmploymentGrade(member.gradeId, employmentGrades);

  return (
    <label className={styles["identity-launch__member"]}>
      <input
        type="radio"
        name="selected-member"
        value={member.id}
        checked={checked}
        onChange={() => onChange(member.id)}
        className={styles["identity-launch__member-control"]}
      />
      <span className={styles["identity-launch__member-shell"]}>
        <span className={styles["identity-launch__avatar"]} aria-hidden="true">
          {initialsForName(member.name)}
        </span>
        <span className={styles["identity-launch__member-content"]}>
          <span className={styles["identity-launch__member-header"]}>
            <span className={styles["identity-launch__member-name"]}>{member.name}</span>
            <StatusBadge status={member.status} compact />
          </span>
          <span className={styles["identity-launch__member-meta"]}>
            {member.email}
          </span>
          <span className={styles["identity-launch__member-meta"]}>
            {member.role} - {grade.label} {grade.title}
          </span>
        </span>
        <span className={styles["identity-launch__role"]}>
          <RoleIcon className={styles["identity-launch__role-icon"]} aria-hidden="true" />
          <span>
            <span className={styles["identity-launch__role-name"]}>{accessRole}</span>
            <span className={styles["identity-launch__role-summary"]}>{roleDetails.summary}</span>
          </span>
        </span>
      </span>
    </label>
  );
}

function initialsForName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CO";
}
