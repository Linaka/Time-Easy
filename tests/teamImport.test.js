import test from "node:test";
import assert from "node:assert/strict";
import { buildTeamImportPreview } from "../src/domain/teamImport.js";

const employmentGrades = [
  {
    id: "grade-1",
    label: "Grade 1",
    title: "Associate",
    hourlyRate: 45
  },
  {
    id: "grade-2",
    label: "Grade 2",
    title: "Designer",
    hourlyRate: 65
  },
  {
    id: "grade-3",
    label: "Grade 3",
    title: "Senior",
    hourlyRate: 85
  }
];

test("team CSV preview maps valid rows into member drafts", () => {
  const previewRows = buildTeamImportPreview({
    csvText:
      "Name,Email,Role,Capacity,Access role,Employment grade,Status\n" +
      "Sana Lee,sana@example.com,Producer,32.5,Manager,Grade 3,Inactive",
    employmentGrades,
    teamMembers: []
  });

  assert.equal(previewRows.length, 1);
  assert.deepEqual(previewRows[0].errors, []);
  assert.equal(previewRows[0].rowNumber, 2);
  assert.deepEqual(previewRows[0].memberDraft, {
    name: "Sana Lee",
    email: "sana@example.com",
    role: "Producer",
    accessRole: "Manager",
    capacityHours: 32.5,
    gradeId: "grade-3",
    status: "Inactive"
  });
  assert.equal(previewRows[0].display.gradeLabel, "Grade 3 - Senior");
});

test("team CSV preview validates duplicates and unknown values", () => {
  const previewRows = buildTeamImportPreview({
    csvText:
      "Name,Email,Role,Capacity,Access role,Employment grade,Status\n" +
      "Ava Morgan,ava@example.com,Design Lead,40,Admin,Grade 9,Paused\n" +
      "Sana Lee,sana@example.com,Producer,-1,Member,Grade 2,Active\n" +
      "Sana Copy,sana@example.com,Designer,24,Member,Grade 2,Active",
    employmentGrades,
    teamMembers: [{ email: "ava@example.com" }]
  });

  assert.deepEqual(previewRows[0].errors, [
    "Access role must be Owner, Manager, or Member",
    "Employment grade not found",
    "Status must be Active or Inactive",
    "Email already exists"
  ]);
  assert.deepEqual(previewRows[1].errors, [
    "Capacity must be a number greater than or equal to 0"
  ]);
  assert.deepEqual(previewRows[2].errors, ["Duplicate email in CSV"]);
});

test("team CSV preview defaults optional fields", () => {
  const previewRows = buildTeamImportPreview({
    csvText: "Full name,Work email,Job title\nOwen Park,owen@example.com,Designer",
    employmentGrades,
    teamMembers: []
  });

  assert.deepEqual(previewRows[0].errors, []);
  assert.equal(previewRows[0].memberDraft.capacityHours, 37.5);
  assert.equal(previewRows[0].memberDraft.accessRole, "Member");
  assert.equal(previewRows[0].memberDraft.gradeId, "grade-2");
  assert.equal(previewRows[0].memberDraft.status, "Active");
});
