import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGanttTimeline,
  getScheduleEndDateKey,
  getTimelineSlotKeyForDate,
  isDateKeyInRange,
  scheduleItemIntersectsSlot,
  scheduleSpansMultipleDays,
  slotContainsDateKey
} from "../src/ganttUtils.js";

test("builds day-based week and month Gantt timelines", () => {
  const week = buildGanttTimeline("Week", "2026-05-16", "2026-05-17");
  assert.equal(week.slots.length, 7);
  assert.equal(week.startKey, "2026-05-16");
  assert.equal(week.endKey, "2026-05-22");
  assert.equal(week.slots[1].isToday, true);

  const month = buildGanttTimeline("Month", "2026-05-16", "2026-05-16");
  assert.equal(month.slots.length, 31);
  assert.equal(month.endKey, "2026-06-15");
  assert.equal(month.slotMinWidth, 124);
});

test("builds month-bucketed year Gantt timeline", () => {
  const year = buildGanttTimeline("Year", "2026-05-16", "2026-09-03");
  assert.equal(year.slots.length, 12);
  assert.equal(year.startKey, "2026-05-01");
  assert.equal(year.endKey, "2027-04-30");
  assert.equal(year.slots[4].isToday, true);
  assert.equal(year.slots[0].selectLabel, "May 2026");
});

test("locates dates inside Gantt timeline slots", () => {
  const year = buildGanttTimeline("Year", "2026-05-16", "2026-05-16");
  assert.equal(isDateKeyInRange("2026-06-10", "2026-06-01", "2026-06-30"), true);
  assert.equal(slotContainsDateKey(year.slots[1], "2026-06-15"), true);
  assert.equal(getTimelineSlotKeyForDate(year.slots, "2026-06-15"), "month-2026-06-01");
  assert.equal(getTimelineSlotKeyForDate(year.slots, "2028-01-01"), "");
});

test("keeps single-day schedule items in one slot and detects multi-day spans", () => {
  const month = buildGanttTimeline("Month", "2026-05-17", "2026-05-17");
  const singleDayItem = { dateKey: "2026-05-17" };
  const multiDayItem = { dateKey: "2026-05-17", endDateKey: "2026-05-19" };

  assert.equal(getScheduleEndDateKey(singleDayItem), "2026-05-17");
  assert.equal(scheduleSpansMultipleDays(singleDayItem), false);
  assert.equal(scheduleItemIntersectsSlot(singleDayItem, month.slots[0]), true);
  assert.equal(scheduleItemIntersectsSlot(singleDayItem, month.slots[1]), false);

  assert.equal(getScheduleEndDateKey(multiDayItem), "2026-05-19");
  assert.equal(scheduleSpansMultipleDays(multiDayItem), true);
  assert.equal(scheduleItemIntersectsSlot(multiDayItem, month.slots[0]), true);
  assert.equal(scheduleItemIntersectsSlot(multiDayItem, month.slots[1]), true);
  assert.equal(scheduleItemIntersectsSlot(multiDayItem, month.slots[2]), true);
  assert.equal(scheduleItemIntersectsSlot(multiDayItem, month.slots[3]), false);
});
