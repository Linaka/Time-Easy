import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  Search,
  X
} from "lucide-react";
import {
  FilterSelect,
  FormField,
  GhostButton,
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
import { setFormValue } from "../domain/formUtils.js";
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
  const [clientFilter, setClientFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagDrafts, setTagDrafts] = useState(() =>
    Object.fromEntries(projects.map((project) => [project.id, project.tags?.join(", ") || ""]))
  );
  const createProjectButtonRef = useRef(null);
  const modalReturnFocusRef = useRef(null);
  const projectNameRef = useRef(null);
  const isEditingProject = Boolean(editingProjectId);
  const searchTerm = searchQuery.trim().toLowerCase();
  const clientOptions = ["All", ...Array.from(new Set(projects.map((project) => project.client)))];
  const tagOptions = ["All", ...Array.from(new Set(projects.flatMap((project) => project.tags || [])))];
  const visibleProjects = projects.filter((project) => {
    const matchesClient = clientFilter === "All" || project.client === clientFilter;
    const matchesTag = tagFilter === "All" || project.tags?.includes(tagFilter);
    const matchesSearch = projectMatchesSearch(project, searchTerm);
    return matchesClient && matchesTag && matchesSearch;
  });

  useEffect(() => {
    setTagDrafts(Object.fromEntries(projects.map((project) => [project.id, project.tags?.join(", ") || ""])));
  }, [projects]);

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

  function handleProjectSubmit(event) {
    event.preventDefault();
    const saved = isEditingProject
      ? onUpdateProject(editingProjectId, form)
      : onAddProject(form);
    if (saved) {
      closeProjectModal();
    }
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
              <FilterSelect label="Client" value={clientFilter} onChange={setClientFilter} options={clientOptions} />
              <FilterSelect label="Project tag" value={tagFilter} onChange={setTagFilter} options={tagOptions} />
            </div>
          }
        >
          <div className={styles["projects-page__style-004"]}>
            {visibleProjects.length ? visibleProjects.map((project) => {
              const trackedSeconds = sumDurations(entries.filter((entry) => entry.projectId === project.id));
              const budgetSeconds = Number(project.budgetHours || 0) * 3600;
              return (
                <article key={project.id} className={styles["projects-page__style-005"]}>
                  <div className={styles["projects-page__style-006"]}>
                    <div>
                      <ProjectBadge project={project} />
                      <p className={styles["projects-page__style-007"]}>{project.client} · {currency(project.hourlyRate)}/hr</p>
                      {(project.internalTeam || project.externalClient) ? (
                        <dl className={styles["projects-page__style-034"]}>
                          {project.internalTeam ? (
                            <div className={styles["projects-page__style-035"]}>
                              <dt className={styles["projects-page__style-036"]}>Team</dt>
                              <dd className={styles["projects-page__style-037"]}>{project.internalTeam}</dd>
                            </div>
                          ) : null}
                          {project.externalClient ? (
                            <div className={styles["projects-page__style-035"]}>
                              <dt className={styles["projects-page__style-036"]}>External</dt>
                              <dd className={styles["projects-page__style-037"]}>{project.externalClient}</dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : null}
                      <div className={styles["projects-page__style-008"]}>
                        <TagList tags={project.tags || []} />
                      </div>
                    </div>
                    <div className={styles["projects-page__style-009"]}>
                      <StatusBadge status={project.status} />
                      <GhostButton
                        onClick={(event) => openEditProjectModal(project, event)}
                        icon={Pencil}
                      >
                        Edit
                      </GhostButton>
                      <GhostButton
                        onClick={() => onProjectStatusChange(project.id, project.status === "Archived" ? "Active" : "Archived")}
                        icon={project.status === "Archived" ? Check : X}
                      >
                        {project.status === "Archived" ? "Reactivate" : "Archive"}
                      </GhostButton>
                    </div>
                  </div>
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
                  <form
                    className={styles["projects-page__style-015"]}
                    onSubmit={(event) => {
                      event.preventDefault();
                      onProjectTagsChange(project.id, tagDrafts[project.id] || "");
                    }}
                  >
                    <FormField label={`Tags for ${project.name}`} htmlFor={`${project.id}-tags`}>
                      <input
                        id={`${project.id}-tags`}
                        value={tagDrafts[project.id] || ""}
                        onChange={(event) =>
                          setTagDrafts((current) => ({
                            ...current,
                            [project.id]: event.target.value
                          }))
                        }
                        className={styles["projects-page__style-016"]}
                        placeholder="Retainer, UX"
                      />
                    </FormField>
                    <button
                      type="submit"
                      className={styles["projects-page__style-017"]}
                    >
                      Save tags
                    </button>
                  </form>
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
              <FormField label="Custom project tags" htmlFor="project-tags" helper="Separate tags with commas, such as Retainer, UX, High priority.">
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
    </>
  );
}
