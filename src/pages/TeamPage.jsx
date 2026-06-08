import React from "react";
import { EmploymentGradesPanel } from "./team/EmploymentGradesPanel.jsx";
import { TeamDirectory } from "./team/TeamDirectory.jsx";
import { TeamImportPanel } from "./team/TeamImportPanel.jsx";
import { TeamInvitePanel } from "./team/TeamInvitePanel.jsx";
import styles from "./TeamPage.module.css";

export function TeamPage({
  teamMembers,
  entries,
  employmentGrades,
  onAddTeamMember,
  onAddTeamMembers = () => false,
  onUpdateTeamMember,
  onMemberStatusChange,
  onDeleteTeamMember,
  onEmploymentGradeChange
}) {
  return (
    <div className={styles["team-page__style-001"]}>
      <div className={styles["team-page__style-002"]}>
        <TeamInvitePanel
          employmentGrades={employmentGrades}
          onAddTeamMember={onAddTeamMember}
          teamMembers={teamMembers}
        />
        <TeamImportPanel
          employmentGrades={employmentGrades}
          onAddTeamMembers={onAddTeamMembers}
          teamMembers={teamMembers}
        />
        <EmploymentGradesPanel
          employmentGrades={employmentGrades}
          onEmploymentGradeChange={onEmploymentGradeChange}
        />
      </div>

      <TeamDirectory
        employmentGrades={employmentGrades}
        entries={entries}
        onDeleteTeamMember={onDeleteTeamMember}
        onMemberStatusChange={onMemberStatusChange}
        onUpdateTeamMember={onUpdateTeamMember}
        teamMembers={teamMembers}
      />
    </div>
  );
}
