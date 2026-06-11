import test from "node:test";
import assert from "node:assert/strict";
import { createProjectCommands } from "../src/hooks/workspaceCommands/projectCommands.js";

function createHarness(projects = []) {
  let projectRecords = projects;
  const activities = [];
  const statusMessages = [];
  const commands = createProjectCommands({
    addActivity: (type, description) => activities.push({ type, description }),
    projects,
    setProjects: (updater) => {
      projectRecords = typeof updater === "function" ? updater(projectRecords) : updater;
    },
    setStatusMessage: (message) => statusMessages.push(message)
  });

  return {
    activities,
    commands,
    get projects() {
      return projectRecords;
    },
    statusMessages
  };
}

test("project command stores internal team and external client fields", () => {
  const harness = createHarness();

  assert.equal(
    harness.commands.addProject({
      name: "Launch Site",
      client: "Brand",
      internalTeam: "Growth",
      externalClient: "Northstar Studio",
      colorKey: "green",
      budgetHours: "24",
      hourlyRate: "125",
      tagText: "Web, Launch"
    }),
    true
  );

  assert.equal(harness.projects[0].internalTeam, "Growth");
  assert.equal(harness.projects[0].externalClient, "Northstar Studio");
  assert.deepEqual(harness.projects[0].tags, ["Web", "Launch"]);
  assert.equal(harness.statusMessages.at(-1), "Launch Site created.");
});

test("project command updates internal team and external client fields", () => {
  const harness = createHarness([
    {
      id: "launch-site",
      name: "Launch Site",
      client: "Brand",
      internalTeam: "Growth",
      externalClient: "Northstar Studio",
      colorKey: "green",
      budgetHours: 24,
      hourlyRate: 125,
      status: "Active",
      tags: ["Web"]
    }
  ]);

  assert.equal(
    harness.commands.updateProject("launch-site", {
      name: "Launch Site",
      client: "Brand",
      internalTeam: "Product",
      externalClient: "Northstar Group",
      colorKey: "blue",
      budgetHours: "32",
      hourlyRate: "140",
      tagText: "Web, Build"
    }),
    true
  );

  assert.equal(harness.projects[0].internalTeam, "Product");
  assert.equal(harness.projects[0].externalClient, "Northstar Group");
  assert.equal(harness.projects[0].budgetHours, 32);
  assert.equal(harness.projects[0].hourlyRate, 140);
  assert.deepEqual(harness.projects[0].tags, ["Web", "Build"]);
});
