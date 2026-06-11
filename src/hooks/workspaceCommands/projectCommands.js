import { parseTags, slugify, validatePlainFields } from "../../domain/formUtils.js";
import { projectName } from "../../domain/projectUtils.js";

export function createProjectCommands({
  addActivity,
  projects,
  setProjects,
  setStatusMessage
}) {
  function addProject(projectDraft) {
    const validationError = validatePlainFields([
      projectDraft.name,
      projectDraft.client,
      projectDraft.internalTeam,
      projectDraft.externalClient,
      projectDraft.tagText
    ]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextProject = {
      id: `${slugify(projectDraft.name)}-${Date.now()}`,
      status: "Active",
      ...projectDraft,
      tags: parseTags(projectDraft.tagText),
      tagText: undefined,
      budgetHours: Number(projectDraft.budgetHours) || 0,
      hourlyRate: Number(projectDraft.hourlyRate) || 0
    };
    setProjects((currentProjects) => [nextProject, ...currentProjects]);
    addActivity("Projects", `Created project ${nextProject.name}`);
    setStatusMessage(`${nextProject.name} created.`);
    return true;
  }

  function updateProject(targetProjectId, projectDraft) {
    const validationError = validatePlainFields([
      projectDraft.name,
      projectDraft.client,
      projectDraft.internalTeam,
      projectDraft.externalClient,
      projectDraft.tagText
    ]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextProjectFields = {
      ...projectDraft,
      tags: parseTags(projectDraft.tagText),
      tagText: undefined,
      budgetHours: Number(projectDraft.budgetHours) || 0,
      hourlyRate: Number(projectDraft.hourlyRate) || 0
    };

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === targetProjectId ? { ...project, ...nextProjectFields } : project
      )
    );
    addActivity("Projects", `${projectName(targetProjectId, projects)} details updated`);
    setStatusMessage(`${nextProjectFields.name} updated.`);
    return true;
  }

  function updateProjectStatus(targetProjectId, nextStatus) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === targetProjectId ? { ...project, status: nextStatus } : project
      )
    );
    addActivity("Projects", `${projectName(targetProjectId, projects)} marked ${nextStatus}`);
    setStatusMessage(`Project marked ${nextStatus}.`);
  }

  function updateProjectTags(targetProjectId, tagTextValue) {
    const validationError = validatePlainFields([tagTextValue]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === targetProjectId ? { ...project, tags: parseTags(tagTextValue) } : project
      )
    );
    addActivity("Projects", `${projectName(targetProjectId, projects)} tags updated`);
    setStatusMessage("Project tags updated.");
    return true;
  }

  return {
    addProject,
    updateProject,
    updateProjectStatus,
    updateProjectTags
  };
}
