import { buildReportCsv } from "../domain/reportCsv.js";
import { downloadTextFile } from "../services/desktopBridge.js";

export function useReportExportAction({ setStatusMessage }) {
  return function exportReportCsv(reportData) {
    downloadTextFile({
      filename: "timetrackr-report.csv",
      mimeType: "text/csv;charset=utf-8",
      text: buildReportCsv(reportData)
    });
    setStatusMessage("CSV report exported.");
  };
}
