import test from "node:test";
import assert from "node:assert/strict";
import { createTeamCommands } from "../src/hooks/workspaceCommands/teamCommands.js";

function createHarness(teamMembers) {
  let members = teamMembers;
  const activities = [];
  const statusMessages = [];
  const commands = createTeamCommands({
    addActivity: (type, description) => activities.push({ type, description }),
    employmentGrades: [],
    setEmploymentGrades: () => {},
    setStatusMessage: (message) => statusMessages.push(message),
    setTeamMembers: (updater) => {
      members = typeof updater === "function" ? updater(members) : updater;
    },
    teamMembers
  });

  return {
    activities,
    commands,
    get members() {
      return members;
    },
    statusMessages
  };
}

test("team command refuses to delete the last workspace owner", () => {
  const harness = createHarness([
    { id: "ava", name: "Ava Morgan", accessRole: "Owner" },
    { id: "mia", name: "Mia Patel", accessRole: "Member" }
  ]);

  assert.equal(harness.commands.deleteTeamMember("ava"), false);
  assert.equal(harness.members.length, 2);
  assert.equal(harness.activities.length, 0);
  assert.equal(harness.statusMessages.at(-1), "Add another owner before deleting the last workspace owner.");
});

test("team command deletes an owner when another owner remains", () => {
  const harness = createHarness([
    { id: "ava", name: "Ava Morgan", accessRole: "Owner" },
    { id: "sana", name: "Sana Lee", accessRole: "Owner" },
    { id: "mia", name: "Mia Patel", accessRole: "Member" }
  ]);

  assert.equal(harness.commands.deleteTeamMember("ava"), true);
  assert.deepEqual(harness.members.map((member) => member.id), ["sana", "mia"]);
  assert.equal(harness.statusMessages.at(-1), "Ava Morgan deleted. Historical records remain available as Unassigned.");
});
