import React, { useState } from "react";
import {
  PauseCircle,
  Play
} from "lucide-react";
import {
  DataTable,
  FormField,
  Panel,
  PrimaryButton,
  ProjectBadge,
  RowActions,
  Select,
  StatusBadge
} from "../components/ui.jsx";
import { formatRelativeTime } from "../domain/dateUtils.js";
import {
  formatDurationLabel,
  sessionDuration
} from "../domain/formatters.js";
import { setFormValue } from "../domain/formUtils.js";
import {
  getProject,
  memberName
} from "../domain/projectUtils.js";
import styles from "./KiosksPage.module.css";

export function KiosksPage({ kioskSessions, projects, teamMembers, onClockIn, onClockOut }) {
  const [form, setForm] = useState({
    memberId: teamMembers[0]?.id || "",
    projectId: projects[0]?.id || ""
  });

  return (
    <div className={styles["kiosks-page__style-001"]}>
      <Panel title="Kiosk clock-in" subtitle="Shared-device workflow for teams without personal logins.">
        <form
          className={styles["kiosks-page__style-002"]}
          onSubmit={(event) => {
            event.preventDefault();
            onClockIn(form);
          }}
        >
          <FormField label="Person" htmlFor="kiosk-person"><Select id="kiosk-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
          <FormField label="Project" htmlFor="kiosk-project"><Select id="kiosk-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
          <PrimaryButton type="submit" icon={Play}>Clock in</PrimaryButton>
        </form>
      </Panel>
      <Panel title="Kiosk sessions" subtitle="Active and completed shared-device sessions.">
        <DataTable
          columns={["Person", "Project", "PIN", "Started", "Duration", "Status", "Actions"]}
          rows={kioskSessions.map((session) => [
            memberName(session.memberId, teamMembers),
            <ProjectBadge project={getProject(projects, session.projectId)} />,
            <span className={styles["kiosks-page__style-003"]}>{session.pin}</span>,
            formatRelativeTime(session.startedAt),
            formatDurationLabel(sessionDuration(session)),
            <StatusBadge status={session.status} />,
            <RowActions
              primaryLabel="Clock out"
              primaryAriaLabel={`Clock out ${memberName(session.memberId, teamMembers)}`}
              primaryIcon={PauseCircle}
              primaryDisabled={session.status !== "Active"}
              primaryIntent="warning"
              onPrimary={() => onClockOut(session.id)}
            />
          ])}
        />
      </Panel>
    </div>
  );
}
