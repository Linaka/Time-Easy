import React, { useState } from "react";
import {
  Download,
  Plus,
  Search,
  Upload,
  X
} from "lucide-react";
import {
  DataTable,
  DateInput,
  FormField,
  GhostButton,
  Panel,
  PrimaryButton,
  ProjectBadge,
  Select
} from "../components/ui.jsx";
import {
  parseDurationInput,
  sumDurations
} from "../timeUtils.js";
import { formatDurationLabel } from "../domain/formatters.js";
import {
  setFormValue,
  validatePlainFields
} from "../domain/formUtils.js";
import {
  memberName,
  projectName
} from "../domain/projectUtils.js";
import { buildTimesheetImportPreview } from "../domain/timesheetImport.js";
import styles from "./TimesheetPage.module.css";

export function TimesheetPage({
  entries,
  projects,
  activeProjects,
  teamMembers,
  weekDays,
  onAddEntry,
  onAddEntries
}) {
  const [form, setForm] = useState({
    description: "Client review",
    projectId: activeProjects[0]?.id || "",
    memberId: teamMembers[0]?.id || "",
    dateKey: weekDays.find((day) => day.isToday)?.dateKey || weekDays[0].dateKey,
    duration: "1:00",
    billable: true
  });
  const [importText, setImportText] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const validImportRows = importPreview.filter((row) => row.errors.length === 0);

  function submitTimesheetEntry(event) {
    event.preventDefault();
    const durationSeconds = parseDurationInput(form.duration);
    if (!durationSeconds || validatePlainFields([form.description])) {
      return;
    }
    onAddEntry(
      {
        description: form.description.trim(),
        projectId: form.projectId,
        memberId: form.memberId,
        dateKey: form.dateKey,
        durationSeconds,
        billable: form.billable,
        tags: ["Timesheet"],
        timeRange: "Timesheet",
        source: "Timesheet"
      },
      "Submitted timesheet"
    );
    setForm((current) => ({ ...current, description: "", duration: "1:00" }));
  }

  function previewTimesheetImport(sourceText = importText) {
    const previewRows = buildTimesheetImportPreview({
      csvText: sourceText,
      projects: activeProjects,
      teamMembers
    });
    setImportPreview(previewRows);
    setImportStatus(
      previewRows.length
        ? `${previewRows.filter((row) => row.errors.length === 0).length} of ${previewRows.length} rows ready to import.`
        : "No importable rows found. Include a header row and at least one timesheet row."
    );
  }

  function importTimesheetRows() {
    if (!validImportRows.length) {
      setImportStatus("There are no valid rows to import.");
      return;
    }

    onAddEntries(
      validImportRows.map((row) => row.entryDraft),
      "Imported timesheet"
    );
    setImportText("");
    setImportFileName("");
    setImportPreview([]);
    setImportStatus(`${validImportRows.length} rows imported as pending timesheet entries.`);
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setImportFileName("");
      return;
    }

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setImportText(text);
      previewTimesheetImport(text);
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles["timesheet-page__style-001"]}>
      <Panel title="Weekly timesheet" subtitle="Project totals across the current week.">
        <div className={styles["timesheet-page__style-002"]}>
          <table className={styles["timesheet-page__style-003"]}>
            <thead>
              <tr className={styles["timesheet-page__style-004"]}>
                <th scope="col" className={styles["timesheet-page__style-005"]}>Project</th>
                {weekDays.map((day) => (
                  <th key={day.dateKey} scope="col" className={styles["timesheet-page__style-006"]}>
                    <span>{day.shortName}</span>
                    <span className={styles["timesheet-page__style-007"]}>{day.displayDate}</span>
                  </th>
                ))}
                <th scope="col" className={styles["timesheet-page__style-008"]}>Total</th>
              </tr>
            </thead>
            <tbody className={styles["timesheet-page__style-009"]}>
              {activeProjects.map((project) => {
                const rowEntries = entries.filter((entry) => entry.projectId === project.id);
                const rowTotal = sumDurations(rowEntries);
                return (
                  <tr key={project.id} className={styles["timesheet-page__style-010"]}>
                    <th scope="row" className={styles["timesheet-page__style-011"]}>
                      <ProjectBadge project={project} />
                    </th>
                    {weekDays.map((day) => {
                      const cellTotal = sumDurations(
                        rowEntries.filter((entry) => entry.dateKey === day.dateKey)
                      );
                      return (
                        <td key={day.dateKey} className={styles["timesheet-page__style-012"]}>
                          {cellTotal ? formatDurationLabel(cellTotal) : "0m"}
                        </td>
                      );
                    })}
                    <td className={styles["timesheet-page__style-013"]}>
                      {formatDurationLabel(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={styles["timesheet-page__mobile-grid"]}>
            {activeProjects.map((project) => {
              const rowEntries = entries.filter((entry) => entry.projectId === project.id);
              const rowTotal = sumDurations(rowEntries);
              return (
                <article key={project.id} className={styles["timesheet-page__mobile-card"]}>
                  <div className={styles["timesheet-page__mobile-card-header"]}>
                    <ProjectBadge project={project} />
                    <div className={styles["timesheet-page__mobile-total"]}>
                      {formatDurationLabel(rowTotal)}
                    </div>
                  </div>
                  <div className={styles["timesheet-page__mobile-days"]}>
                    {weekDays.map((day) => {
                      const cellTotal = sumDurations(
                        rowEntries.filter((entry) => entry.dateKey === day.dateKey)
                      );
                      return (
                        <div key={day.dateKey} className={styles["timesheet-page__mobile-day"]}>
                          <div className={styles["timesheet-page__mobile-day-label"]}>
                            <span>{day.shortName}</span>
                            <span>{day.displayDate}</span>
                          </div>
                          <div className={styles["timesheet-page__mobile-day-value"]}>
                            {cellTotal ? formatDurationLabel(cellTotal) : "0m"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel title="Add timesheet row" subtitle="Manual entries are added as pending time.">
        <form className={styles["timesheet-page__style-014"]} onSubmit={submitTimesheetEntry}>
          <FormField label="Task" htmlFor="timesheet-task">
            <input id="timesheet-task" value={form.description} onChange={(event) => setFormValue(setForm, "description", event.target.value)} className={styles["timesheet-page__style-015"]} />
          </FormField>
          <FormField label="Project" htmlFor="timesheet-project">
            <Select id="timesheet-project" value={form.projectId} onChange={(value) => setFormValue(setForm, "projectId", value)}>
              {activeProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Person" htmlFor="timesheet-person">
            <Select id="timesheet-person" value={form.memberId} onChange={(value) => setFormValue(setForm, "memberId", value)}>
              {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Date" htmlFor="timesheet-date">
            <DateInput id="timesheet-date" value={form.dateKey} onChange={(value) => setFormValue(setForm, "dateKey", value)} className={styles["timesheet-page__style-016"]} />
          </FormField>
          <FormField label="Duration" htmlFor="timesheet-duration">
            <input id="timesheet-duration" value={form.duration} onChange={(event) => setFormValue(setForm, "duration", event.target.value)} className={styles["timesheet-page__style-017"]} />
          </FormField>
          <div className={styles["timesheet-page__style-018"]}>
            <label className={styles["timesheet-page__style-019"]}>
              <input
                type="checkbox"
                checked={form.billable}
                onChange={(event) => setFormValue(setForm, "billable", event.target.checked)}
                className={styles["timesheet-page__checkbox"]}
              />
              Billable
            </label>
            <PrimaryButton type="submit" icon={Plus}>Add</PrimaryButton>
          </div>
        </form>
      </Panel>

      <Panel
        title="Import timesheet CSV"
        subtitle="Upload or paste rows with Date, Task, Project, Member, Duration, Billable, and Tags columns."
        action={
          <GhostButton
            icon={Download}
            onClick={() => {
              setImportText(
                "Date,Task,Project,Member,Duration,Billable,Tags\n2026-05-15,Imported design review,ACME,Ava Morgan,1:30,yes,Timesheet import"
              );
              setImportFileName("");
            }}
          >
            Load sample
          </GhostButton>
        }
      >
        <div className={styles["timesheet-page__style-020"]}>
          <div className={styles["timesheet-page__style-021"]}>
            <FormField label="CSV file" htmlFor="timesheet-import-file" helper="CSV only. Data stays in this browser.">
              <div className={styles["timesheet-page__file-control"]}>
                <input
                  id="timesheet-import-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportFile}
                  className={styles["timesheet-page__file-input"]}
                />
                <label htmlFor="timesheet-import-file" className={styles["timesheet-page__file-trigger"]}>
                  <Upload className={styles["timesheet-page__file-trigger-icon"]} aria-hidden="true" />
                  Choose CSV
                </label>
                <span className={styles["timesheet-page__file-name"]}>
                  {importFileName || "No file selected"}
                </span>
              </div>
            </FormField>
            <FormField
              label="Paste CSV"
              htmlFor="timesheet-import-text"
              helper="Project and member can be names, IDs, or emails. Duration accepts minutes or h:mm."
            >
              <textarea
                id="timesheet-import-text"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className={styles["timesheet-page__style-023"]}
                placeholder="Date,Task,Project,Member,Duration,Billable,Tags"
              />
            </FormField>
          </div>

          <div className={styles["timesheet-page__style-024"]}>
            <PrimaryButton type="button" icon={Search} onClick={() => previewTimesheetImport()}>
              Preview import
            </PrimaryButton>
            <GhostButton icon={Plus} onClick={importTimesheetRows}>
              Import valid rows
            </GhostButton>
            <GhostButton
              icon={X}
              onClick={() => {
                setImportText("");
                setImportFileName("");
                setImportPreview([]);
                setImportStatus("");
              }}
            >
              Clear
            </GhostButton>
            {importStatus ? (
              <p className={styles["timesheet-page__style-025"]} role="status" aria-live="polite">
                {importStatus}
              </p>
            ) : null}
          </div>

          {importPreview.length ? (
            <DataTable
              columns={["Row", "Status", "Date", "Task", "Project", "Member", "Duration", "Billable", "Tags"]}
              rows={importPreview.map((row) => [
                row.rowNumber,
                row.errors.length ? (
                  <span className={styles["timesheet-page__style-026"]}>{row.errors.join("; ")}</span>
                ) : (
                  <span className={styles["timesheet-page__style-027"]}>Ready</span>
                ),
                row.display.dateKey || "-",
                row.display.description || "-",
                row.display.projectName || "-",
                row.display.memberName || "-",
                row.display.duration || "-",
                row.display.billable ? "Yes" : "No",
                row.display.tags?.join(", ") || "-"
              ])}
            />
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
