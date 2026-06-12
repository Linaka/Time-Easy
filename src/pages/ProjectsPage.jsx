import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  Search,
  Tags,
  X
} from "lucide-react";
import {
  FormField,
  IconTooltipButton,
  Panel,
  PrimaryButton,
  ProjectBadge,
  Select,
  StatusBadge,
  TagList
} from "../components/ui.jsx";
import { cx } from "../components/classNames.js";
import { sumDurations } from "../timeUtils.js";
import { PROJECT_COLORS } from "../domain/appConfig.js";
import {
  currency,
  formatDurationLabel,
  percent
} from "../domain/formatters.js";
import { MAX_TAGS, setFormValue } from "../domain/formUtils.js";
import { projectStyle } from "../domain/projectUtils.js";
import styles from "./ProjectsPage.module.css";

const initialProjectForm = {
  name: "",
  client: "",
  internalTeam: "",
  externalClient: "",
  colorKey: "blue",
  budgetHours: "80",
  hourlyRate: "95",
  tagText: ""
};

function projectToForm(project) {
  return {
    name: project.name || "",
    client: project.client || "",
    internalTeam: project.internalTeam || "",
    externalClient: project.externalClient || "",
    colorKey: project.colorKey || "blue",
    budgetHours: String(project.budgetHours ?? ""),
    hourlyRate: String(project.hourlyRate ?? ""),
    tagText: project.tags?.join(", ") || ""
  };
}

function projectMatchesSearch(project, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return [
    project.name,
    project.client,
    project.internalTeam,
    project.externalClient,
    project.status,
    ...(project.tags || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(searchTerm);
}

function normalizeDisplayValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isRepeatedDisplayValue(value, displayedValues) {
  const normalizedValue = normalizeDisplayValue(value);
  return !normalizedValue || displayedValues.some((displayedValue) => normalizeDisplayValue(displayedValue) === normalizedValue);
}

function getProjectCardDisplay(project) {
  const displayedValues = [project.name, project.client];
  const visibleTags = [];

  for (const tag of project.tags || []) {
    if (isRepeatedDisplayValue(tag, displayedValues)) {
      continue;
    }

    visibleTags.push(tag);
    displayedValues.push(tag);
  }

  const metaItems = [
    { label: "Rate", value: `${currency(project.hourlyRate)}/hr` }
  ];

  if (!isRepeatedDisplayValue(project.internalTeam, displayedValues)) {
    metaItems.push({ label: "Team", value: project.internalTeam });
    displayedValues.push(project.internalTeam);
  }

  if (!isRepeatedDisplayValue(project.externalClient, displayedValues)) {
    metaItems.push({ label: "External", value: project.externalClient });
    displayedValues.push(project.externalClient);
  }

  metaItems.push({ label: "Status", value: project.status || "Draft", variant: "status" });

  return {
    metaItems,
    visibleTags
  };
}

export function ProjectsPage({
  projects,
  entries,
  onAddProject,
  onUpdateProject,
  onProjectStatusChange,
  onProjectTagsChange
}) {
  const [form, setForm] = useState(initialProjectForm);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [tagModalProjectId, setTagModalProjectId] = useState(null);
  const [tagModalDraft, setTagModalDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const createProjectButtonRef = useRef(null);
  const modalReturnFocusRef = useRef(null);
  const tagModalReturnFocusRef = useRef(null);
  const projectNameRef = useRef(null);
  const tagInputRef = useRef(null);
  const isEditingProject = Boolean(editingProjectId);
  const tagModalProject = projects.find((project) => project.id === tagModalProjectId);
  const searchTerm = searchQuery.trim().toLowerCase();
  const visibleProjects = projects.filter((project) => projectMatchesSearch(project, searchTerm));

  useEffect(() => {
    if (!projectModalOpen) {
      return undefined;
    }

    window.requestAnimationFrame(() => projectNameRef.current?.focus({ preventScroll: true }));

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeProjectModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [projectModalOpen]);

  useEffect(() => {
    if (!tagModalProjectId) {
      return undefined;
    }

    window.requestAnimationFrame(() => tagInputRef.current?.focus({ preventScroll: true }));

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeProjectTagsModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tagModalProjectId]);

  function openCreateProjectModal() {
    modalReturnFocusRef.current = createProjectButtonRef.current;
    setEditingProjectId(null);
    setForm(initialProjectForm);
    setProjectModalOpen(true);
  }

  function openEditProjectModal(project, event) {
    modalReturnFocusRef.current = event.currentTarget;
    setEditingProjectId(project.id);
    setForm(projectToForm(project));
    setProjectModalOpen(true);
  }

  function closeProjectModal() {
    const returnFocusTarget = modalReturnFocusRef.current;
    setProjectModalOpen(false);
    setEditingProjectId(null);
    setForm(initialProjectForm);
    window.requestAnimationFrame(() => returnFocusTarget?.focus({ preventScroll: true }));
  }

  function openProjectTagsModal(project, event) {
    tagModalReturnFocusRef.current = event.currentTarget;
    setTagModalProjectId(project.id);
    setTagModalDraft(project.tags?.join(", ") || "");
  }

  function closeProjectTagsModal() {
    const returnFocusTarget = tagModalReturnFocusRef.current;
    setTagModalProjectId(null);
    setTagModalDraft("");
    window.requestAnimationFrame(() => returnFocusTarget?.focus({ preventScroll: true }));
  }

  function handleProjectSubmit(event) {
    event.preventDefault();
    const saved = isEditingProject
      ? onUpdateProject(editingProjectId, form)
      : onAddProject(form);
    if (saved) {
      closeProjectModal();
    }
  }

  function handleProjectTagsSubmit(event) {
    event.preventDefault();
    if (!tagModalProjectId) {
      return;
    }

    onProjectTagsChange(tagModalProjectId, tagModalDraft);
    closeProjectTagsModal();
  }

  return (
    <>
      <div data-guidance-target="project-portfolio">
        <Panel
          title="Project portfolio"
          subtitle="Track budgets, status, clients, and custom project tags."
          action={
            <div className={styles["projects-page__style-001"]}>
              <button
                ref={createProjectButtonRef}
                type="button"
                onClick={openCreateProjectModal}
                aria-label="Create project"
                title="Create project"
                className={styles["projects-page__style-002"]}
              >
                <Plus className={styles["projects-page__style-003"]} aria-hidden="true" />
              </button>
              <label className={styles["projects-page__style-040"]}>
                <Search className={styles["projects-page__style-041"]} aria-hidden="true" />
                <span className={styles["projects-page__style-042"]}>Search projects</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={styles["projects-page__style-043"]}
                  placeholder="Search projects"
                />
              </label>
            </div>
          }
        >
          <div className={styles["projects-page__style-004"]}>
            {visibleProjects.length ? visibleProjects.map((project) => {
              const trackedSeconds = sumDurations(entries.filter((entry) => entry.projectId === project.id));
              const budgetSeconds = Number(project.budgetHours || 0) * 3600;
              const { metaItems, visibleTags } = getProjectCardDisplay(project);
              return (
                <article key={project.id} className={styles["projects-page__style-005"]}>
                  <div className={styles["projects-page__style-006"]}>
                    <ProjectBadge project={project} />
                    <div className={styles["projects-page__style-009"]}>
                      <IconTooltipButton
                        onClick={(event) => openEditProjectModal(project, event)}
                        icon={Pencil}
                        label={`Edit ${project.name}`}
                        title="Edit project."
                        description="Change project details, budget, client, team, and custom tags."
                        className={styles["projects-page__style-051"]}
                      />
                      <IconTooltipButton
                        onClick={() => onProjectStatusChange(project.id, project.status === "Archived" ? "Active" : "Archived")}
                        icon={project.status === "Archived" ? Check : X}
                        label={project.status === "Archived" ? `Reactivate ${project.name}` : `Archive ${project.name}`}
                        title={project.status === "Archived" ? "Reactivate project." : "Archive project."}
                        description={project.status === "Archived" ? "Return this project to active project lists." : "Move this project out of active project lists."}
                        className={styles["projects-page__style-051"]}
                      />
                    </div>
                  </div>
                  <dl className={styles["projects-page__style-034"]}>
                    {metaItems.map((item) => (
                      <div key={`${item.label}-${item.value}`} className={styles["projects-page__style-035"]}>
                        <dt className={styles["projects-page__style-036"]}>{item.label}</dt>
                        <dd className={styles["projects-page__style-037"]}>
                          {item.variant === "status" ? <StatusBadge status={item.value} compact /> : item.value}
                        </dd>
                      </div>
                    ))}
                    <div className={styles["projects-page__style-035"]}>
                      <dt className={styles["projects-page__style-036"]}>Tags</dt>
                      <dd className={styles["projects-page__style-049"]}>
                        {visibleTags.length ? (
                          <TagList tags={visibleTags} compact />
                        ) : (
                          <span className={styles["projects-page__style-050"]}>No tags</span>
                        )}
                        <IconTooltipButton
                          onClick={(event) => openProjectTagsModal(project, event)}
                          icon={Tags}
                          label={`Edit tags for ${project.name}`}
                          title="Edit tags."
                          description="Open a tag editor for this project."
                          className={styles["projects-page__style-046"]}
                        />
                      </dd>
                    </div>
                  </dl>
                  <div className={styles["projects-page__style-010"]}>
                    <div className={styles["projects-page__style-011"]}>
                      <span className={styles["projects-page__style-012"]}>Budget used</span>
                      <span className={styles["projects-page__style-013"]}>{formatDurationLabel(trackedSeconds)} / {formatDurationLabel(budgetSeconds)}</span>
                    </div>
                    <div className={styles["projects-page__style-014"]}>
                      <div
                        className={cx(styles["projects-page__progress-fill"], projectStyle(project).dot)}
                        style={{ width: `${Math.min(100, Math.max(4, percent(trackedSeconds, budgetSeconds)))}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            }) : (
              <p className={styles["projects-page__style-044"]}>No projects match the current search.</p>
            )}
          </div>
        </Panel>
      </div>

      {projectModalOpen ? (
        <div
          className={styles["projects-page__style-018"]}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            aria-describedby="project-modal-subtitle"
            className={styles["projects-page__style-019"]}
          >
            <div className={styles["projects-page__style-020"]}>
              <div>
                <h2 id="project-modal-title" className={styles["projects-page__style-021"]}>
                  {isEditingProject ? "Edit project" : "Create project"}
                </h2>
                <p id="project-modal-subtitle" className={styles["projects-page__style-022"]}>
                  {isEditingProject
                    ? "Project changes update timers, timesheets, and reports that use this project."
                    : "Projects become available in timers, timesheets, and reports."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeProjectModal}
                aria-label="Close project form"
                className={styles["projects-page__style-023"]}
              >
                <X className={styles["projects-page__style-024"]} aria-hidden="true" />
              </button>
            </div>
            <form
              className={styles["projects-page__style-025"]}
              onSubmit={handleProjectSubmit}
            >
              <FormField label="Project name" htmlFor="project-name">
                <input
                  ref={projectNameRef}
                  id="project-name"
                  value={form.name}
                  onChange={(event) => setFormValue(setForm, "name", event.target.value)}
                  className={styles["projects-page__style-026"]}
                />
              </FormField>
              <FormField label="Client" htmlFor="project-client">
                <input
                  id="project-client"
                  value={form.client}
                  onChange={(event) => setFormValue(setForm, "client", event.target.value)}
                  className={styles["projects-page__style-027"]}
                />
              </FormField>
              <div className={styles["projects-page__style-028"]}>
                <FormField label="Internal Team" htmlFor="project-internal-team">
                  <input
                    id="project-internal-team"
                    value={form.internalTeam}
                    onChange={(event) => setFormValue(setForm, "internalTeam", event.target.value)}
                    className={styles["projects-page__style-038"]}
                  />
                </FormField>
                <FormField label="External Client" htmlFor="project-external-client">
                  <input
                    id="project-external-client"
                    value={form.externalClient}
                    onChange={(event) => setFormValue(setForm, "externalClient", event.target.value)}
                    className={styles["projects-page__style-039"]}
                  />
                </FormField>
              </div>
              <FormField label="Colour" htmlFor="project-color">
                <Select id="project-color" value={form.colorKey} onChange={(value) => setFormValue(setForm, "colorKey", value)}>
                  {Object.entries(PROJECT_COLORS).map(([key, color]) => <option key={key} value={key}>{color.label}</option>)}
                </Select>
              </FormField>
              <div className={styles["projects-page__style-028"]}>
                <FormField label="Budget hours" htmlFor="project-budget">
                  <input
                    id="project-budget"
                    type="number"
                    min="0"
                    value={form.budgetHours}
                    onChange={(event) => setFormValue(setForm, "budgetHours", event.target.value)}
                    className={styles["projects-page__style-029"]}
                  />
                </FormField>
                <FormField label="Hourly rate (GBP)" htmlFor="project-rate">
                  <input
                    id="project-rate"
                    type="number"
                    min="0"
                    value={form.hourlyRate}
                    onChange={(event) => setFormValue(setForm, "hourlyRate", event.target.value)}
                    className={styles["projects-page__style-030"]}
                  />
                </FormField>
              </div>
              <FormField label="Custom project tags" htmlFor="project-tags" helper={`Add up to ${MAX_TAGS} tags. Separate tags with commas, such as Retainer, UX, High priority.`}>
                <input
                  id="project-tags"
                  value={form.tagText}
                  onChange={(event) => setFormValue(setForm, "tagText", event.target.value)}
                  className={styles["projects-page__style-031"]}
                />
              </FormField>
              <div className={styles["projects-page__style-032"]}>
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className={styles["projects-page__style-033"]}
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" icon={isEditingProject ? Check : Plus}>
                  {isEditingProject ? "Save project" : "Create project"}
                </PrimaryButton>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {tagModalProject ? (
        <div
          className={styles["projects-page__style-018"]}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectTagsModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-tags-modal-title"
            aria-describedby="project-tags-modal-subtitle"
            className={styles["projects-page__style-019"]}
          >
            <div className={styles["projects-page__style-020"]}>
              <div>
                <h2 id="project-tags-modal-title" className={styles["projects-page__style-021"]}>
                  Tags for {tagModalProject.name}
                </h2>
                <p id="project-tags-modal-subtitle" className={styles["projects-page__style-022"]}>
                  Update project tags without changing the project details.
                </p>
              </div>
              <button
                type="button"
                onClick={closeProjectTagsModal}
                aria-label="Close tag editor"
                className={styles["projects-page__style-023"]}
              >
                <X className={styles["projects-page__style-024"]} aria-hidden="true" />
              </button>
            </div>
            <form
              className={styles["projects-page__style-025"]}
              onSubmit={handleProjectTagsSubmit}
            >
              <FormField label="Tags" htmlFor="project-tag-editor" helper={`Add up to ${MAX_TAGS} tags. Separate tags with commas, such as Retainer, UX, High priority.`}>
                <input
                  ref={tagInputRef}
                  id="project-tag-editor"
                  value={tagModalDraft}
                  onChange={(event) => setTagModalDraft(event.target.value)}
                  className={styles["projects-page__style-031"]}
                  placeholder="Retainer, UX"
                />
              </FormField>
              <div className={styles["projects-page__style-032"]}>
                <button
                  type="button"
                  onClick={closeProjectTagsModal}
                  className={styles["projects-page__style-033"]}
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" icon={Check}>
                  Save tags
                </PrimaryButton>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
