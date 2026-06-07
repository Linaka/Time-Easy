import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EMPLOYMENT_GRADES,
  DEFAULT_WORKSPACE_SETTINGS
} from "../src/domain/appConfig.js";
import { createFreshWorkspace } from "../src/domain/workspaceSetup.js";

test("fresh workspace clears demo records while preserving a usable setup", () => {
  const timestamp = new Date("2026-06-06T12:00:00.000Z");
  const workspace = createFreshWorkspace(timestamp);

  assert.deepEqual(workspace.entries, []);
  assert.deepEqual(workspace.expenses, []);
  assert.deepEqual(workspace.timeOffRequests, []);
  assert.deepEqual(workspace.scheduleItems, []);
  assert.deepEqual(workspace.projectDependencies, []);
  assert.deepEqual(workspace.kioskSessions, []);
  assert.equal(workspace.projects.length, 1);
  assert.equal(workspace.projects[0].id, "starter");
  assert.equal(workspace.teamMembers.length, 1);
  assert.equal(workspace.teamMembers[0].id, "ava");
  assert.equal(workspace.teamMembers[0].accessRole, "Owner");
  assert.deepEqual(workspace.workspaceSettings, DEFAULT_WORKSPACE_SETTINGS);
  assert.notEqual(workspace.employmentGrades[0], DEFAULT_EMPLOYMENT_GRADES[0]);
  assert.equal(workspace.activityItems[0].timestamp, timestamp.toISOString());
});
