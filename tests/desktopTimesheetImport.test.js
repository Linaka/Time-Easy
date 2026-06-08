import test from "node:test";
import assert from "node:assert/strict";
import { buildTimesheetCsvImportResult } from "../src/domain/desktopTimesheetImport.js";
import {
  TIMESHEET_CSV_MAX_FIELD_CHARS,
  TIMESHEET_CSV_MAX_ROWS
} from "../src/domain/timesheetImport.js";

test("native timesheet CSV import helper reports valid and skipped rows", () => {
  const result = buildTimesheetCsvImportResult({
    csvText: [
      "Date,Task,Project,Member,Duration,Billable,Tags",
      "2026-06-06,Design review,ACME,Ava Morgan,1:30,yes,Client",
      "2026-06-06,Missing project,Unknown,Ava Morgan,1:00,no,Ops"
    ].join("\n"),
    projects: [{ id: "acme", name: "ACME", client: "Creative Studio" }],
    teamMembers: [{ id: "ava", name: "Ava Morgan", email: "ava@example.test" }]
  });

  assert.equal(result.importedCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.entryDrafts[0].projectId, "acme");
  assert.equal(result.entryDrafts[0].durationSeconds, 5400);
  assert.match(result.invalidRows[0].errors.join(" "), /Project not found/);
});

test("native timesheet CSV import helper rejects oversized row counts", () => {
  const csvText = [
    "Date,Task,Project,Member,Duration,Billable,Tags",
    ...Array.from(
      { length: TIMESHEET_CSV_MAX_ROWS + 1 },
      () => "2026-06-06,Design review,ACME,Ava Morgan,1:30,yes,Client"
    )
  ].join("\n");

  assert.throws(
    () =>
      buildTimesheetCsvImportResult({
        csvText,
        projects: [{ id: "acme", name: "ACME", client: "Creative Studio" }],
        teamMembers: [{ id: "ava", name: "Ava Morgan", email: "ava@example.test" }]
      }),
    /rows or fewer/
  );
});

test("native timesheet CSV import helper skips oversized fields", () => {
  const result = buildTimesheetCsvImportResult({
    csvText: [
      "Date,Task,Project,Member,Duration,Billable,Tags",
      `2026-06-06,${"A".repeat(TIMESHEET_CSV_MAX_FIELD_CHARS + 1)},ACME,Ava Morgan,1:30,yes,Client`
    ].join("\n"),
    projects: [{ id: "acme", name: "ACME", client: "Creative Studio" }],
    teamMembers: [{ id: "ava", name: "Ava Morgan", email: "ava@example.test" }]
  });

  assert.equal(result.importedCount, 0);
  assert.equal(result.skippedCount, 1);
  assert.match(result.invalidRows[0].errors.join(" "), /characters or fewer/);
});
