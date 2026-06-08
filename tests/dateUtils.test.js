import test from "node:test";
import assert from "node:assert/strict";
import {
  getCurrentWeekDays,
  getRollingWeekDays
} from "../src/domain/dateUtils.js";

test("current week days keep the Monday to Sunday reporting week", () => {
  const days = getCurrentWeekDays(new Date(2026, 5, 6));

  assert.deepEqual(days.map((day) => day.dateKey), [
    "2026-06-01",
    "2026-06-02",
    "2026-06-03",
    "2026-06-04",
    "2026-06-05",
    "2026-06-06",
    "2026-06-07"
  ]);
  assert.equal(days[5].isToday, true);
});

test("rolling week days start with the current day for planning views", () => {
  const days = getRollingWeekDays(new Date(2026, 5, 6));

  assert.deepEqual(days.map((day) => day.dateKey), [
    "2026-06-06",
    "2026-06-07",
    "2026-06-08",
    "2026-06-09",
    "2026-06-10",
    "2026-06-11",
    "2026-06-12"
  ]);
  assert.equal(days[0].isToday, true);
});
