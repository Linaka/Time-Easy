import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeCsvCell,
  formatDuration,
  formatTimer,
  groupEntriesByDay,
  groupDurationsByProject,
  isSafeDisplayText,
  parseCsvRecords,
  parseCsvRows,
  parseDurationInput,
  sumBillableDurations,
  sumDurations
} from "../src/timeUtils.js";

test("formats durations for entry rows and totals", () => {
  assert.equal(formatDuration(7200), "2:00");
  assert.equal(formatDuration(12600), "3:30");
  assert.equal(formatDuration(1800), "0:30");
});

test("formats the active timer as hh:mm:ss", () => {
  assert.equal(formatTimer(0), "00:00:00");
  assert.equal(formatTimer(3661), "01:01:01");
});

test("sums and groups entries", () => {
  const entries = [
    { day: "Today", projectId: "acme", durationSeconds: 7200, billable: true },
    { day: "Today", projectId: "acme", durationSeconds: 1800, billable: false },
    { day: "Yesterday", projectId: "office", durationSeconds: 3600, billable: true }
  ];

  assert.equal(sumDurations(entries), 12600);
  assert.equal(sumBillableDurations(entries), 10800);
  assert.equal(groupEntriesByDay(entries).Today.length, 2);
  assert.equal(groupEntriesByDay(entries).Yesterday.length, 1);
  assert.equal(groupDurationsByProject(entries).acme, 9000);
});

test("flags sample malicious script input before saving", () => {
  assert.equal(isSafeDisplayText('<script>alert("xss")</script>'), false);
  assert.equal(isSafeDisplayText("Fixing bug #212"), true);
});

test("parses duration input from minutes or hh:mm", () => {
  assert.equal(parseDurationInput("90"), 5400);
  assert.equal(parseDurationInput("1:30"), 5400);
  assert.equal(parseDurationInput("0:45"), 2700);
  assert.equal(parseDurationInput("nope"), 0);
});

test("escapes csv cells and mitigates spreadsheet formula injection", () => {
  assert.equal(escapeCsvCell("ACME, Inc."), '"ACME, Inc."');
  assert.equal(escapeCsvCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(escapeCsvCell("=IMPORTXML()"), "'=IMPORTXML()");
});

test("parses csv rows with quoted commas and records", () => {
  const csv = 'Date,Task,Project,Duration\n2026-05-15,"Design, QA",ACME,1:30';

  assert.deepEqual(parseCsvRows(csv), [
    ["Date", "Task", "Project", "Duration"],
    ["2026-05-15", "Design, QA", "ACME", "1:30"]
  ]);
  assert.deepEqual(parseCsvRecords(csv), [
    {
      date: "2026-05-15",
      task: "Design, QA",
      project: "ACME",
      duration: "1:30"
    }
  ]);
});
