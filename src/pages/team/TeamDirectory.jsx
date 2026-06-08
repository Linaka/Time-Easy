import React, { useEffect, useState } from "react";
import {
  Download,
  Search
} from "lucide-react";
import {
  IconTooltipButton,
  Panel
} from "../../components/ui.jsx";
import { getAccessRole } from "../../domain/auth.js";
import { getEmploymentGrade } from "../../domain/projectUtils.js";
import { teamMemberToForm } from "../../domain/teamMember.js";
import { buildTeamCsv } from "../../domain/teamCsv.js";
import { downloadTextFile } from "../../services/desktopBridge.js";
import { TeamDirectoryCard } from "./TeamDirectoryCard.jsx";
import styles from "../TeamPage.module.css";

export function TeamDirectory({
  employmentGrades,
  entries,
  onDeleteTeamMember,
  onMemberStatusChange,
  onUpdateTeamMember,
  teamMembers
}) {
  const [query, setQuery] = useState("");
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const visibleMembers = teamMembers.filter((member) =>
    `${member.name} ${member.email} ${member.role} ${getAccessRole(member)} ${getEmploymentGrade(member.gradeId, employmentGrades).title}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  useEffect(() => {
    if (editingMemberId && !teamMembers.some((member) => member.id === editingMemberId)) {
      setEditingMemberId(null);
      setEditForm(null);
    }
  }, [editingMemberId, teamMembers]);

  function openMemberEditor(member) {
    setEditingMemberId(member.id);
    setEditForm(teamMemberToForm(member, employmentGrades));
  }

  function closeMemberEditor() {
    setEditingMemberId(null);
    setEditForm(null);
  }

  function exportVisibleTeamMembers() {
    downloadTextFile({
      filename: "timetrackr-team-directory.csv",
      mimeType: "text/csv;charset=utf-8",
      text: buildTeamCsv({
        teamMembers: visibleMembers,
        entries,
        employmentGrades
      })
    });
  }

  return (
    <Panel
      title="Team directory"
      subtitle="Search, capacity, grade-based rates, and status."
      action={
        <div className={styles["team-page__directory-actions"]}>
          <IconTooltipButton
            onClick={exportVisibleTeamMembers}
            icon={Download}
            label="Export team CSV"
            title="Export CSV."
            description="Download the currently filtered team directory as a CSV file."
          />
          <label className={styles["team-page__style-021"]}>
            <Search className={styles["team-page__style-022"]} aria-hidden="true" />
            <span className={styles["team-page__style-023"]}>Search team</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className={styles["team-page__style-024"]}
            />
          </label>
        </div>
      }
    >
      <div className={styles["team-page__style-025"]}>
        {visibleMembers.map((member) => (
          <TeamDirectoryCard
            key={member.id}
            editForm={editingMemberId === member.id ? editForm : null}
            employmentGrades={employmentGrades}
            entries={entries}
            member={member}
            onCloseMemberEditor={closeMemberEditor}
            onDeleteTeamMember={onDeleteTeamMember}
            onEditFormChange={setEditForm}
            onMemberStatusChange={onMemberStatusChange}
            onOpenMemberEditor={openMemberEditor}
            onUpdateTeamMember={onUpdateTeamMember}
            teamMembers={teamMembers}
          />
        ))}
      </div>
    </Panel>
  );
}
