import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_EMPLOYMENT_GRADES } from "../src/domain/appConfig.js";
import { buildTeamCsv } from "../src/domain/teamCsv.js";

test("team CSV export includes directory details and tracked time", () => {
  const csv = buildTeamCsv({
    employmentGrades: DEFAULT_EMPLOYMENT_GRADES,
    entries: [
      { memberId: "ava", durationSeconds: 7200 },
      { memberId: "ava", durationSeconds: 1800 }
    ],
    teamMembers: [
      {
        id: "ava",
        name: "Ava Morgan",
        email: "ava@example.test",
        role: "Design Lead",
        accessRole: "Owner",
        capacityHours: 37.5,
        gradeId: "grade-4",
        status: "Active"
      }
    ]
  });

  assert.match(csv, /Name,Email,Role,Capacity,Access role,Employment grade,Hourly rate,Status,Tracked time/);
  assert.match(csv, /Ava Morgan,ava@example.test,Design Lead,37.5,Owner,Grade 4 - Lead,£160,Active,2:30/);
});

test("team CSV export escapes formula-like cells", () => {
  const csv = buildTeamCsv({
    teamMembers: [
      {
        id: "mal",
        name: "=IMPORTXML()",
        email: "mal@example.test",
        role: "Designer",
        capacityHours: 40,
        accessRole: "Member",
        gradeId: "grade-2",
        status: "Active"
      }
    ]
  });

  assert.match(csv, /'=IMPORTXML\(\)/);
});
