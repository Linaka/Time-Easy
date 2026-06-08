import { buildTimesheetImportPreview } from "./timesheetImport.js";

export function buildTimesheetCsvImportResult({ csvText, projects, teamMembers }) {
  const previewRows = buildTimesheetImportPreview({ csvText, projects, teamMembers });
  const validRows = previewRows.filter((row) => row.errors.length === 0);
  const invalidRows = previewRows.filter((row) => row.errors.length > 0);

  return {
    entryDrafts: validRows.map((row) => row.entryDraft),
    importedCount: validRows.length,
    invalidRows,
    previewRows,
    skippedCount: invalidRows.length
  };
}
