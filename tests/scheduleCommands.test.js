import test from "node:test";
import assert from "node:assert/strict";
import { createScheduleCommands } from "../src/hooks/workspaceCommands/scheduleCommands.js";

function createHarness(scheduleItems) {
  let items = scheduleItems;
  const activities = [];
  const statusMessages = [];
  const projects = [{ id: "acme", name: "ACME" }];
  const teamMembers = [{ id: "ava", name: "Ava Morgan" }];
  const commands = createScheduleCommands({
    addActivity: (type, description) => activities.push({ type, description }),
    projectDependencies: [],
    projects,
    scheduleItems,
    setProjectDependencies: () => {},
    setScheduleItems: (updater) => {
      items = typeof updater === "function" ? updater(items) : updater;
    },
    setStatusMessage: (message) => statusMessages.push(message),
    teamMembers
  });

  return {
    activities,
    commands,
    get items() {
      return items;
    },
    statusMessages
  };
}

test("schedule command deletes an existing scheduled block", () => {
  const harness = createHarness([
    {
      id: "schedule-1",
      memberId: "ava",
      projectId: "acme",
      dateKey: "2026-06-20",
      start: "09:00",
      end: "17:00",
      location: "Remote",
      status: "Planned"
    },
    {
      id: "schedule-2",
      memberId: "ava",
      projectId: "acme",
      dateKey: "2026-06-21",
      start: "09:00",
      end: "17:00",
      location: "Office",
      status: "Published"
    }
  ]);

  assert.equal(harness.commands.deleteScheduleItem("schedule-1"), true);
  assert.deepEqual(harness.items.map((item) => item.id), ["schedule-2"]);
  assert.deepEqual(harness.activities.at(-1), {
    type: "Schedule",
    description: "Deleted scheduled block for Ava Morgan"
  });
  assert.equal(harness.statusMessages.at(-1), "Schedule item deleted.");
});

test("schedule command reports missing scheduled blocks", () => {
  const harness = createHarness([]);

  assert.equal(harness.commands.deleteScheduleItem("missing"), false);
  assert.deepEqual(harness.items, []);
  assert.equal(harness.activities.length, 0);
  assert.equal(harness.statusMessages.at(-1), "Scheduled block was not found.");
});
