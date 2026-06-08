import { formatDurationLabel } from "./formatters.js";
import {
  getProject,
  memberName,
  projectName
} from "./projectUtils.js";
import { scheduleDurationSeconds } from "./scheduleUtils.js";
import { scheduleItemIntersectsSlot } from "../ganttUtils.js";

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function worksheetName(value) {
  return String(value)
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31);
}

function cell(value, { styleId = "", type = "String" } = {}) {
  const styleAttribute = styleId ? ` ss:StyleID="${styleId}"` : "";
  const safeType = type === "Number" && Number.isFinite(Number(value)) ? "Number" : "String";
  const safeValue = safeType === "Number" ? Number(value) : escapeXml(value);

  return `<Cell${styleAttribute}><Data ss:Type="${safeType}">${safeValue}</Data></Cell>`;
}

function row(values, options = {}) {
  return `<Row>${values.map((value) => cell(value, options)).join("")}</Row>`;
}

function headerRow(values) {
  return row(values, { styleId: "Header" });
}

function worksheet(name, rows) {
  return `<Worksheet ss:Name="${escapeXml(worksheetName(name))}"><Table>${rows.join("")}</Table></Worksheet>`;
}

function formatAssignment(item, { projects, teamMembers }) {
  const project = getProject(projects, item.projectId);
  const person = memberName(item.memberId, teamMembers);
  const duration = formatDurationLabel(scheduleDurationSeconds(item));
  const time = `${item.start || ""} - ${item.end || ""}`.trim();
  const label = item.location || "Scheduled work";

  return `${person} | ${time} | ${duration} | ${label} | ${item.status || "Planned"} | ${project.name}`;
}

function buildMatrixRows({ projects, teamMembers, timeline, timelineScheduleItems }) {
  return [
    headerRow(["Project lane", ...timeline.slots.map((slot) => slot.selectLabel)]),
    ...projects.map((project) => {
      const projectScheduleItems = timelineScheduleItems.filter((item) => item.projectId === project.id);
      return row([
        `${project.name} (${project.client || "No client"})`,
        ...timeline.slots.map((slot) => {
          const slotItems = projectScheduleItems.filter((item) => scheduleItemIntersectsSlot(item, slot));
          return slotItems.map((item) => formatAssignment(item, { projects, teamMembers })).join("\n");
        })
      ]);
    })
  ];
}

function buildAssignmentRows({ projects, teamMembers, timeline, timelineScheduleItems }) {
  const sortedItems = [...timelineScheduleItems].sort((left, right) =>
    `${left.dateKey || ""}-${projectName(left.projectId, projects)}-${memberName(left.memberId, teamMembers)}`
      .localeCompare(`${right.dateKey || ""}-${projectName(right.projectId, projects)}-${memberName(right.memberId, teamMembers)}`)
  );

  return [
    headerRow([
      "Date",
      "End date",
      "Project",
      "Client",
      "Person",
      "Start",
      "End",
      "Duration",
      "Duration hours",
      "Label",
      "Status"
    ]),
    ...sortedItems.map((item) => {
      const project = getProject(projects, item.projectId);
      const durationSeconds = scheduleDurationSeconds(item);

      return row([
        item.dateKey,
        item.endDateKey || item.dateKey,
        project.name,
        project.client || "",
        memberName(item.memberId, teamMembers),
        item.start,
        item.end,
        formatDurationLabel(durationSeconds),
        Math.round((durationSeconds / 3600) * 100) / 100,
        item.location || "",
        item.status || "Planned"
      ]);
    })
  ];
}

function buildDependencyRows({ projectDependencies, projects }) {
  return [
    headerRow(["From project", "To project", "Dependency note"]),
    ...projectDependencies.map((dependency) =>
      row([
        projectName(dependency.fromProjectId, projects),
        projectName(dependency.toProjectId, projects),
        dependency.label || ""
      ])
    )
  ];
}

function buildSummaryRows({
  assignedSeconds,
  generatedAt,
  projectDependencies,
  timeline,
  timelineMode,
  timelineScheduleItems
}) {
  return [
    row(["Resource Plan Export"], { styleId: "Title" }),
    row(["Generated at", generatedAt.toISOString()]),
    row(["Timeline", timelineMode]),
    row(["Planning range", timeline.rangeLabel]),
    row(["Assignments", timelineScheduleItems.length]),
    row(["Total scheduled", formatDurationLabel(assignedSeconds)]),
    row(["Dependencies", projectDependencies.length])
  ];
}

export function buildResourcePlanExcelXml({
  assignedSeconds,
  generatedAt = new Date(),
  projectDependencies = [],
  projects = [],
  teamMembers = [],
  timeline,
  timelineMode,
  timelineScheduleItems = []
}) {
  const workbookXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">',
    "<Styles>",
    '<Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" /><Alignment ss:Vertical="Center" /></Style>',
    '<Style ss:ID="Header"><Font ss:Bold="1" /><Interior ss:Color="#E2E8F0" ss:Pattern="Solid" /></Style>',
    "</Styles>",
    worksheet("Summary", buildSummaryRows({
      assignedSeconds,
      generatedAt,
      projectDependencies,
      timeline,
      timelineMode,
      timelineScheduleItems
    })),
    worksheet("Plan Matrix", buildMatrixRows({
      projects,
      teamMembers,
      timeline,
      timelineScheduleItems
    })),
    worksheet("Assignments", buildAssignmentRows({
      projects,
      teamMembers,
      timeline,
      timelineScheduleItems
    })),
    worksheet("Dependencies", buildDependencyRows({ projectDependencies, projects })),
    "</Workbook>"
  ].join("");

  return workbookXml;
}

export function buildResourcePlanExcelFilename({ timeline, timelineMode }) {
  const mode = String(timelineMode || "resource-plan").toLowerCase();
  return `creative-operations-resource-plan-${mode}-${timeline.startKey}-to-${timeline.endKey}.xls`;
}
