import test from "node:test";
import assert from "node:assert/strict";
import {
  scheduleDurationSeconds,
  validateScheduleBlockDraft
} from "../src/domain/scheduleUtils.js";

const projects = [{ id: "acme", name: "ACME" }];
const teamMembers = [{ id: "ava", name: "Ava Morgan" }];
const validDraft = {
  memberId: "ava",
  projectId: "acme",
  dateKey: "2026-06-20",
  start: "09:00",
  end: "17:00",
  location: "Remote"
};

test("validates schedule blocks with clear messages", () => {
  assert.equal(validateScheduleBlockDraft(validDraft, { projects, teamMembers }), "");
  assert.equal(
    validateScheduleBlockDraft({ ...validDraft, dateKey: "2026-02-31" }, { projects, teamMembers }),
    "Choose a valid date for this scheduled block."
  );
  assert.equal(
    validateScheduleBlockDraft({ ...validDraft, start: "09:00", end: "09:00" }, { projects, teamMembers }),
    "Start and end times cannot be the same."
  );
  assert.equal(
    validateScheduleBlockDraft({ ...validDraft, location: "" }, { projects, teamMembers }),
    "Add a short label or location for this scheduled block."
  );
});

test("keeps overnight schedule durations valid", () => {
  assert.equal(scheduleDurationSeconds({ start: "22:00", end: "02:00" }), 14400);
  assert.equal(validateScheduleBlockDraft({ ...validDraft, start: "22:00", end: "02:00" }, { projects, teamMembers }), "");
});
