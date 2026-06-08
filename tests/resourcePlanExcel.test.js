import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResourcePlanExcelFilename,
  buildResourcePlanExcelXml
} from "../src/domain/resourcePlanExcel.js";
import { buildGanttTimeline } from "../src/ganttUtils.js";

const timeline = buildGanttTimeline("Week", "2026-06-08", "2026-06-08");
const projects = [
  { id: "acme", name: "ACME", client: "Creative Studio" },
  { id: "project-x", name: "Project X", client: "Core Product" }
];
const teamMembers = [
  { id: "ava", name: "Ava Morgan" },
  { id: "noah", name: "Noah Kim" }
];
const scheduleItems = [
  {
    id: "schedule-1",
    memberId: "ava",
    projectId: "acme",
    dateKey: "2026-06-08",
    start: "09:00",
    end: "17:00",
    location: "Remote & review",
    status: "Published"
  },
  {
    id: "schedule-2",
    memberId: "noah",
    projectId: "project-x",
    dateKey: "2026-06-09",
    start: "10:00",
    end: "14:30",
    location: "=sprint planning",
    status: "Planned"
  }
];

test("resource plan export builds an Excel workbook with plan sheets", () => {
  const xml = buildResourcePlanExcelXml({
    assignedSeconds: 45_000,
    generatedAt: new Date("2026-06-08T12:00:00.000Z"),
    projectDependencies: [
      {
        id: "dependency-1",
        fromProjectId: "acme",
        toProjectId: "project-x",
        label: "Design approval before build"
      }
    ],
    projects,
    teamMembers,
    timeline,
    timelineMode: "Week",
    timelineScheduleItems: scheduleItems
  });

  assert.match(xml, /<Worksheet ss:Name="Summary">/);
  assert.match(xml, /<Worksheet ss:Name="Plan Matrix">/);
  assert.match(xml, /<Worksheet ss:Name="Assignments">/);
  assert.match(xml, /<Worksheet ss:Name="Dependencies">/);
  assert.match(xml, /Ava Morgan \| 09:00 - 17:00 \| 8h \| Remote &amp; review/);
  assert.match(xml, /=sprint planning/);
  assert.match(xml, /Design approval before build/);
});

test("resource plan export filename reflects the visible range", () => {
  assert.equal(
    buildResourcePlanExcelFilename({ timeline, timelineMode: "Week" }),
    "creative-operations-resource-plan-week-2026-06-08-to-2026-06-14.xls"
  );
});
