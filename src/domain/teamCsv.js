import {
  escapeCsvCell,
  formatDuration,
  sumDurations
} from "../timeUtils.js";
import { DEFAULT_EMPLOYMENT_GRADES } from "./appConfig.js";
import { getAccessRole } from "./auth.js";
import { currency } from "./formatters.js";
import { getEmploymentGrade } from "./projectUtils.js";

export function buildTeamCsv({
  teamMembers = [],
  entries = [],
  employmentGrades = DEFAULT_EMPLOYMENT_GRADES
}) {
  const safeEmploymentGrades = employmentGrades.length ? employmentGrades : DEFAULT_EMPLOYMENT_GRADES;
  const rows = [
    [
      "Name",
      "Email",
      "Role",
      "Capacity",
      "Access role",
      "Employment grade",
      "Hourly rate",
      "Status",
      "Tracked time"
    ],
    ...teamMembers.map((member) => {
      const grade = getEmploymentGrade(member.gradeId, safeEmploymentGrades);
      const trackedSeconds = sumDurations(entries.filter((entry) => entry.memberId === member.id));

      return [
        member.name,
        member.email,
        member.role,
        member.capacityHours,
        getAccessRole(member),
        `${grade.label} - ${grade.title}`,
        currency(grade.hourlyRate),
        member.status || "Active",
        formatDuration(trackedSeconds)
      ];
    })
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
