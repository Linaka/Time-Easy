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

test("team command updates member profile details", () => {
  const harness = createHarness([
    {
      id: "mia",
      name: "Mia Patel",
      email: "mia@example.com",
      role: "Designer",
      accessRole: "Member",
      capacityHours: 40,
      gradeId: "grade-2",
      status: "Active"
    }
  ]);

  assert.equal(
    harness.commands.updateTeamMember("mia", {
      name: "Mia Shah",
      email: "mia.shah@example.com",
      role: "Lead Designer",
      accessRole: "Owner",
      capacityHours: "32.5",
      gradeId: "grade-3"
    }),
    true
  );
  assert.deepEqual(harness.members[0], {
    id: "mia",
    name: "Mia Shah",
    email: "mia.shah@example.com",
    role: "Lead Designer",
    accessRole: "Owner",
    capacityHours: 32.5,
    gradeId: "grade-3",
    status: "Active"
  });
  assert.equal(harness.activities.at(-1).description, "Updated Mia Shah");
  assert.equal(harness.statusMessages.at(-1), "Mia Shah updated.");
});

test("team command imports members in a single batch", () => {
  const harness = createHarness([]);

  assert.equal(
    harness.commands.addTeamMembers([
      {
        name: "Sana Lee",
        email: "sana@example.com",
        role: "Producer",
        accessRole: "Manager",
        capacityHours: "32.5",
        gradeId: "grade-3",
        status: "Inactive"
      },
      {
        name: "Owen Park",
        email: "owen@example.com",
        role: "Designer",
        accessRole: "Member",
        capacityHours: "0",
        gradeId: "grade-2",
        status: "Active"
      }
    ]),
    true
  );

  assert.deepEqual(
    harness.members.map((member) => ({
      name: member.name,
      accessRole: member.accessRole,
      capacityHours: member.capacityHours,
      gradeId: member.gradeId,
      status: member.status
    })),
    [
      {
        name: "Sana Lee",
        accessRole: "Owner",
        capacityHours: 32.5,
        gradeId: "grade-3",
        status: "Inactive"
      },
      {
        name: "Owen Park",
        accessRole: "Member",
        capacityHours: 0,
        gradeId: "grade-2",
        status: "Active"
      }
    ]
  );
  assert.equal(harness.activities.at(-1).description, "Imported 2 team members");
  assert.equal(harness.statusMessages.at(-1), "2 team members imported.");
});

test("team command defaults blank member capacity to 37.5 hours", () => {
  const harness = createHarness([
    {
      id: "ava",
      name: "Ava Morgan",
      email: "ava@example.com",
      role: "Design Lead",
      accessRole: "Owner"
    }
  ]);

  assert.equal(
    harness.commands.addTeamMember({
      name: "Owen Park",
      email: "owen@example.com",
      role: "Designer",
      accessRole: "Member",
      capacityHours: "",
      gradeId: "grade-2"
    }),
    true
  );

  assert.equal(harness.members[0].capacityHours, 37.5);
  assert.equal(harness.members[0].accessRole, "Member");
});

test("team command refuses imported duplicate emails", () => {
  const harness = createHarness([
    {
      id: "ava",
      name: "Ava Morgan",
      email: "ava@example.com",
      role: "Design Lead",
      accessRole: "Owner"
    }
  ]);

  assert.equal(
    harness.commands.addTeamMembers([
      {
        name: "Ava Copy",
        email: "ava@example.com",
        role: "Designer",
        accessRole: "Member",
        capacityHours: "40",
        gradeId: "grade-2"
      }
    ]),
    false
  );

  assert.equal(harness.members.length, 1);
  assert.equal(harness.activities.length, 0);
  assert.equal(harness.statusMessages.at(-1), "ava@example.com already exists.");
});

test("team command refuses to demote the last workspace owner", () => {
  const harness = createHarness([
    {
      id: "ava",
      name: "Ava Morgan",
      email: "ava@example.com",
      role: "Founder",
      accessRole: "Owner",
      capacityHours: 40,
      gradeId: "grade-4"
    }
  ]);

  assert.equal(
    harness.commands.updateTeamMember("ava", {
      name: "Ava Morgan",
      email: "ava@example.com",
      role: "Founder",
      accessRole: "Member",
      capacityHours: "40",
      gradeId: "grade-4"
    }),
    false
  );
  assert.equal(harness.members[0].accessRole, "Owner");
  assert.equal(harness.activities.length, 0);
  assert.equal(harness.statusMessages.at(-1), "Add another owner before changing the last workspace owner.");
});
