import React, { useState } from "react";
import {
  Plus,
  Search,
  Upload,
  X
} from "lucide-react";
import {
  DataTable,
  FormField,
  GhostButton,
  IconTooltipButton,
  Panel,
  PrimaryButton
} from "../../components/ui.jsx";
import { buildTeamImportPreview } from "../../domain/teamImport.js";
import styles from "../TeamPage.module.css";

const TEAM_IMPORT_SAMPLE =
  "Name,Email,Role,Capacity,Access role,Employment grade\n" +
  "Sana Lee,sana@example.com,Producer,32.5,Manager,Grade 3\n" +
  "Owen Park,owen@example.com,Designer,24,Member,Grade 2";

export function TeamImportPanel({
  employmentGrades,
  onAddTeamMembers = () => false,
  teamMembers
}) {
  const [teamImportText, setTeamImportText] = useState("");
  const [teamImportFileName, setTeamImportFileName] = useState("");
  const [teamImportPreview, setTeamImportPreview] = useState([]);
  const [teamImportStatus, setTeamImportStatus] = useState("");
  const validTeamImportRows = teamImportPreview.filter((row) => row.errors.length === 0);

  function loadTeamImportSample() {
    setTeamImportText(TEAM_IMPORT_SAMPLE);
    setTeamImportFileName("");
    setTeamImportPreview([]);
    setTeamImportStatus("Sample CSV loaded. Preview before importing.");
  }

  function previewTeamImport(sourceText = teamImportText) {
    try {
      const previewRows = buildTeamImportPreview({
        csvText: sourceText,
        employmentGrades,
        teamMembers
      });
      setTeamImportPreview(previewRows);
      setTeamImportStatus(
        previewRows.length
          ? `${previewRows.filter((row) => row.errors.length === 0).length} of ${previewRows.length} rows ready to import.`
          : "No importable rows found. Include a header row and at least one team member row."
      );
    } catch (error) {
      setTeamImportPreview([]);
      setTeamImportStatus(error.message || "Team CSV could not be previewed.");
    }
  }

  function importTeamRows() {
    if (!validTeamImportRows.length) {
      setTeamImportStatus("There are no valid team members to import.");
      return;
    }

    if (onAddTeamMembers(validTeamImportRows.map((row) => row.memberDraft))) {
      setTeamImportText("");
      setTeamImportFileName("");
      setTeamImportPreview([]);
      setTeamImportStatus(`${validTeamImportRows.length} team members imported.`);
    }
  }

  function handleTeamImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setTeamImportFileName("");
      return;
    }

    setTeamImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setTeamImportText(text);
      previewTeamImport(text);
    };
    reader.readAsText(file);
  }

  function clearTeamImport() {
    setTeamImportText("");
    setTeamImportFileName("");
    setTeamImportPreview([]);
    setTeamImportStatus("");
  }

  return (
    <Panel
      title="Import team CSV"
      subtitle="Use Name, Email, Role, Capacity, Access role, and Employment grade columns."
      action={
        <IconTooltipButton
          icon={Upload}
          label="Load sample CSV"
          title="Load sample CSV."
          description="Fill the CSV field with a two-person example to preview the import format."
          onClick={loadTeamImportSample}
        />
      }
    >
      <div className={styles["team-page__import"]}>
        <div className={styles["team-page__import-controls"]}>
          <FormField label="CSV file" htmlFor="team-import-file" helper="CSV only. Data stays in this workspace.">
            <div className={styles["team-page__file-control"]}>
              <label className={styles["team-page__file-trigger"]}>
                <input
                  id="team-import-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleTeamImportFile}
                  className={styles["team-page__file-input"]}
                />
                <Upload className={styles["team-page__file-trigger-icon"]} aria-hidden="true" />
                Choose CSV
              </label>
              <span className={styles["team-page__file-name"]}>
                {teamImportFileName || "No file selected"}
              </span>
            </div>
          </FormField>
          <FormField
            label="Paste CSV"
            htmlFor="team-import-text"
            helper="Grades can be Grade 1-4 labels, titles, or grade IDs."
          >
            <textarea
              id="team-import-text"
              value={teamImportText}
              onChange={(event) => setTeamImportText(event.target.value)}
              className={styles["team-page__import-textarea"]}
              placeholder="Name,Email,Role,Capacity,Access role,Employment grade"
            />
          </FormField>
        </div>
        <div className={styles["team-page__import-actions"]}>
          <PrimaryButton type="button" icon={Search} onClick={() => previewTeamImport()}>
            Preview import
          </PrimaryButton>
          <GhostButton icon={Plus} onClick={importTeamRows} disabled={!validTeamImportRows.length}>
            Import valid rows
          </GhostButton>
          <GhostButton icon={X} onClick={clearTeamImport}>
            Clear
          </GhostButton>
          {teamImportStatus ? (
            <p className={styles["team-page__import-status"]} role="status" aria-live="polite">
              {teamImportStatus}
            </p>
          ) : null}
        </div>
        {teamImportPreview.length ? (
          <DataTable
            columns={["Row", "Status", "Name", "Email", "Role", "Capacity", "Access", "Grade"]}
            rows={teamImportPreview.map((row) => [
              row.rowNumber,
              row.errors.length ? (
                <span className={styles["team-page__import-error"]}>{row.errors.join("; ")}</span>
              ) : (
                <span className={styles["team-page__import-ready"]}>Ready</span>
              ),
              row.display.name || "-",
              row.display.email || "-",
              row.display.role || "-",
              `${row.display.capacityHours}h`,
              row.display.accessRole,
              row.display.gradeLabel
            ])}
          />
        ) : null}
      </div>
    </Panel>
  );
}
