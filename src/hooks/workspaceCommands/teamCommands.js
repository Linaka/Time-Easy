import { getAccessRole } from "../../domain/auth.js";
import { slugify, validatePlainFields } from "../../domain/formUtils.js";
import {
  getEmploymentGrade,
  memberName
} from "../../domain/projectUtils.js";
import {
  getTeamMemberDeleteAvailability,
  isDemotingLastWorkspaceOwner,
  normalizeTeamAccessRole,
  normalizeTeamStatus,
  parseTeamCapacityHours
} from "../../domain/teamMember.js";

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
    const requestedAccessRole = normalizeTeamAccessRole(memberDraft.accessRole);
    const nextMember = {
      id: `${slugify(memberDraft.name)}-${Date.now()}`,
      ...memberDraft,
      accessRole: isFirstMember ? "Owner" : requestedAccessRole,
      capacityHours: parseTeamCapacityHours(memberDraft.capacityHours),
      status: normalizeTeamStatus(memberDraft.status)
    };
    setTeamMembers((currentMembers) => [nextMember, ...currentMembers]);
    addActivity("Team", `Added ${nextMember.name} to the workspace`);
    setStatusMessage(`${nextMember.name} added to the team.`);
    return true;
  }

  function addTeamMembers(memberDrafts) {
    if (!memberDrafts.length) {
      setStatusMessage("There are no valid team members to import.");
      return false;
    }

    const existingEmails = new Set(teamMembers.map((member) => String(member.email || "").toLowerCase()));
    const incomingEmails = new Set();
    const validationError = memberDrafts
      .map((memberDraft) => {
        const plainFieldError = validatePlainFields([memberDraft.name, memberDraft.email, memberDraft.role]);
        const normalizedEmail = String(memberDraft.email || "").toLowerCase();
        if (plainFieldError) {
          return plainFieldError;
        }
        if (!String(memberDraft.name || "").trim() || !normalizedEmail || !String(memberDraft.role || "").trim()) {
          return "Imported team members need a name, email, and role.";
        }
        if (existingEmails.has(normalizedEmail) || incomingEmails.has(normalizedEmail)) {
          return `${memberDraft.email} already exists.`;
        }
        incomingEmails.add(normalizedEmail);
        return "";
      })
      .find(Boolean);

    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const importedAt = Date.now();
    const nextMembers = memberDrafts.map((memberDraft, index) => {
      const requestedAccessRole = normalizeTeamAccessRole(memberDraft.accessRole);
      const isFirstMember = teamMembers.length === 0 && index === 0;

      return {
        id: `${slugify(memberDraft.name)}-${importedAt}-${index}`,
        ...memberDraft,
        accessRole: isFirstMember ? "Owner" : requestedAccessRole,
        capacityHours: parseTeamCapacityHours(memberDraft.capacityHours),
        status: normalizeTeamStatus(memberDraft.status)
      };
    });

    setTeamMembers((currentMembers) => [...nextMembers, ...currentMembers]);
    addActivity("Team", `Imported ${nextMembers.length} team members`);
    setStatusMessage(`${nextMembers.length} team members imported.`);
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

  function updateTeamMember(memberId, memberPatch) {
    const member = teamMembers.find((currentMember) => currentMember.id === memberId);
    if (!member) {
      setStatusMessage("Team member was not found.");
      return false;
    }

    const validationError = validatePlainFields([memberPatch.name, memberPatch.email, memberPatch.role]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextAccessRole = normalizeTeamAccessRole(memberPatch.accessRole, getAccessRole(member));

    if (isDemotingLastWorkspaceOwner(teamMembers, member, nextAccessRole)) {
      setStatusMessage("Add another owner before changing the last workspace owner.");
      return false;
    }

    const nextMember = {
      ...member,
      ...memberPatch,
      accessRole: nextAccessRole,
      capacityHours: parseTeamCapacityHours(memberPatch.capacityHours)
    };

    setTeamMembers((currentMembers) =>
      currentMembers.map((currentMember) =>
        currentMember.id === memberId ? nextMember : currentMember
      )
    );
    addActivity("Team", `Updated ${nextMember.name}`);
    setStatusMessage(`${nextMember.name} updated.`);
    return true;
  }

  function deleteTeamMember(memberId) {
    const member = teamMembers.find((currentMember) => currentMember.id === memberId);
    if (!member) {
      setStatusMessage("Team member was not found.");
      return false;
    }

    const deleteAvailability = getTeamMemberDeleteAvailability(teamMembers, member);

    if (!deleteAvailability.canDelete) {
      setStatusMessage(deleteAvailability.message);
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
    addTeamMembers,
    addTeamMember,
    deleteTeamMember,
    updateEmploymentGrade,
    updateTeamMember,
    updateMemberStatus
  };
}
