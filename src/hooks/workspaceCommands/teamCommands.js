import { ACCESS_ROLES } from "../../domain/auth.js";
import { slugify, validatePlainFields } from "../../domain/formUtils.js";
import {
  getEmploymentGrade,
  memberName
} from "../../domain/projectUtils.js";

export function createTeamCommands({
  addActivity,
  employmentGrades,
  setEmploymentGrades,
  setStatusMessage,
  setTeamMembers,
  teamMembers
}) {
  function addTeamMember(memberDraft) {
    const validationError = validatePlainFields([memberDraft.name, memberDraft.email, memberDraft.role]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const isFirstMember = teamMembers.length === 0;
    const requestedAccessRole = ACCESS_ROLES.includes(memberDraft.accessRole)
      ? memberDraft.accessRole
      : "Member";
    const nextMember = {
      id: `${slugify(memberDraft.name)}-${Date.now()}`,
      status: "Active",
      ...memberDraft,
      accessRole: isFirstMember ? "Owner" : requestedAccessRole,
      capacityHours: Number(memberDraft.capacityHours) || 40
    };
    setTeamMembers((currentMembers) => [nextMember, ...currentMembers]);
    addActivity("Team", `Added ${nextMember.name} to the workspace`);
    setStatusMessage(`${nextMember.name} added to the team.`);
    return true;
  }

  function updateMemberStatus(memberId, nextStatus) {
    setTeamMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, status: nextStatus } : member
      )
    );
    addActivity("Team", `${memberName(memberId, teamMembers)} marked ${nextStatus}`);
    setStatusMessage(`Team member marked ${nextStatus}.`);
  }

  function deleteTeamMember(memberId) {
    const member = teamMembers.find((currentMember) => currentMember.id === memberId);
    if (!member) {
      setStatusMessage("Team member was not found.");
      return false;
    }

    if (teamMembers.length <= 1) {
      setStatusMessage("Add another owner before deleting the last workspace member.");
      return false;
    }

    setTeamMembers((currentMembers) =>
      currentMembers.filter((currentMember) => currentMember.id !== memberId)
    );
    addActivity("Team", `Deleted ${member.name} from the workspace`);
    setStatusMessage(`${member.name} deleted. Historical records remain available as Unassigned.`);
    return true;
  }

  function updateEmploymentGrade(gradeId, gradePatch) {
    const validationError = validatePlainFields([gradePatch.title, gradePatch.description]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextGrades = employmentGrades.map((grade) =>
      grade.id === gradeId
        ? {
            ...grade,
            ...gradePatch,
            hourlyRate: Number(gradePatch.hourlyRate) || 0
          }
        : grade
    );
    const hasIncreasingRates = nextGrades.every(
      (grade, index) => index === 0 || Number(grade.hourlyRate) > Number(nextGrades[index - 1].hourlyRate)
    );
    if (!hasIncreasingRates) {
      setStatusMessage("Employment grade rates must increase from Grade 1 through Grade 4.");
      return false;
    }

    setEmploymentGrades(nextGrades);
    addActivity("Team", `${getEmploymentGrade(gradeId, employmentGrades).label} updated`);
    setStatusMessage("Employment grade updated.");
    return true;
  }

  return {
    addTeamMember,
    deleteTeamMember,
    updateEmploymentGrade,
    updateMemberStatus
  };
}
