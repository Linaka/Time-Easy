import React from "react";
import {
  ArrowRight,
  GitBranch,
  Plus,
  Trash2
} from "lucide-react";
import {
  DangerButton,
  DateInput,
  FormField,
  Panel,
  PrimaryButton,
  ProjectBadge,
  Select
} from "../../components/ui.jsx";
import { cx } from "../../components/classNames.js";
import { formatDurationLabel } from "../../domain/formatters.js";
import { setFormValue } from "../../domain/formUtils.js";
import {
  getProject,
  projectName
} from "../../domain/projectUtils.js";
import { scheduleDurationSeconds } from "../../domain/scheduleUtils.js";
import { scheduleItemIntersectsSlot } from "../../ganttUtils.js";
import { GanttAssignmentCard } from "./GanttAssignmentCard.jsx";
import { useGanttPlanner } from "./useGanttPlanner.js";
import styles from "../SchedulePage.module.css";

export function GanttChart({
  scheduleItems,
  projects,
  teamMembers,
  weekDays,
  projectDependencies,
  onAddSchedule,
  onUpdateSchedule,
  onMoveScheduleProject,
  onAddDependency,
  onDeleteDependency
}) {
  const planner = useGanttPlanner({
    onAddDependency,
    onAddSchedule,
    onMoveScheduleProject,
    projects,
    scheduleItems,
    teamMembers,
    weekDays
  });

  return (
    <Panel
      title="Resource plan"
      subtitle="Drag people between project lanes, then switch the timeline to plan the week, month, or year ahead."
      action={
        <div className={styles["schedule-page__style-008"]}>
          <GitBranch className={styles["schedule-page__style-009"]} aria-hidden="true" />
          <span>{formatDurationLabel(planner.assignedSeconds)} scheduled</span>
        </div>
      }
    >
      <div className={styles["schedule-page__style-010"]}>
        <FormField label="Timeline" htmlFor="gantt-timeline">
          <Select id="gantt-timeline" value={planner.timelineMode} onChange={planner.setTimelineMode}>
            <option value="Week">Week</option>
            <option value="Month">Month ahead</option>
            <option value="Year">Year ahead</option>
          </Select>
        </FormField>
        <FormField label="Start date" htmlFor="gantt-start-date">
          <DateInput
            id="gantt-start-date"
            value={planner.timelineStart}
            onChange={planner.setTimelineStart}
            className={styles["schedule-page__style-011"]}
          />
        </FormField>
        <div className={styles["schedule-page__style-012"]}>
          <p className={styles["schedule-page__style-013"]}>Planning range</p>
          <p className={styles["schedule-page__style-014"]}>{planner.timeline.rangeLabel}</p>
        </div>
      </div>

      <div className={styles["schedule-page__style-015"]}>
        <div style={planner.timelineGridStyle}>
          <div className={styles["schedule-page__style-016"]} style={planner.timelineGridStyle}>
            <div className={styles["schedule-page__style-017"]}>Project lane</div>
            {planner.timeline.slots.map((slot) => (
              <div
                key={slot.key}
                className={cx(
                  styles["schedule-page__timeline-heading-cell"],
                  slot.isToday ? styles["schedule-page__timeline-heading-cell--today"] : null
                )}
              >
                <span>{slot.label}</span>
                <span className={styles["schedule-page__style-018"]}>{slot.subLabel}</span>
              </div>
            ))}
          </div>

          {projects.map((project) => {
            const projectScheduleItems = planner.timelineScheduleItems.filter((item) => item.projectId === project.id);
            return (
              <section
                key={project.id}
                aria-label={`${project.name} schedule lane`}
                className={styles["schedule-page__style-019"]}
                style={planner.timelineGridStyle}
              >
                <div className={styles["schedule-page__style-020"]}>
                  <ProjectBadge project={project} />
                  <p className={styles["schedule-page__style-021"]}>{project.client}</p>
                  <p className={styles["schedule-page__style-022"]}>
                    {formatDurationLabel(projectScheduleItems.reduce((sum, item) => sum + scheduleDurationSeconds(item), 0))}
                    <span className={styles["schedule-page__style-023"]}> scheduled</span>
                  </p>
                </div>

                {planner.timeline.slots.map((slot) => {
                  const slotItems = projectScheduleItems.filter((item) => scheduleItemIntersectsSlot(item, slot));
                  return (
                    <div
                      key={`${project.id}-${slot.key}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => planner.handleDrop(event, project.id, slot)}
                      className={cx(
                        styles["schedule-page__timeline-cell"],
                        slot.isWeekend
                          ? styles["schedule-page__timeline-cell--weekend"]
                          : styles["schedule-page__timeline-cell--weekday"],
                        slot.isToday ? styles["schedule-page__timeline-cell--today"] : null
                      )}
                      aria-label={`Drop assignments onto ${project.name} during ${slot.accessibleLabel}`}
                    >
                      <div
                        className={cx(
                          styles["schedule-page__slot-bucket"],
                          slotItems.length
                            ? styles["schedule-page__slot-bucket--filled"]
                            : styles["schedule-page__slot-bucket--empty"]
                        )}
                      >
                        {slotItems.length ? (
                          slotItems.map((item) => (
                            <GanttAssignmentCard
                              key={item.id}
                              item={item}
                              slot={slot}
                              projects={projects}
                              teamMembers={teamMembers}
                              timelineSlots={planner.timeline.slots}
                              onDragStart={planner.handleDragStart}
                              onUpdateSchedule={onUpdateSchedule}
                              onMoveScheduleProject={onMoveScheduleProject}
                            />
                          ))
                        ) : (
                          <span className={styles["schedule-page__style-024"]}>
                            Drop here
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>

      <div className={styles["schedule-page__style-025"]}>
        <section aria-labelledby="dependency-list-heading">
          <div className={styles["schedule-page__style-026"]}>
            <h3 id="dependency-list-heading" className={styles["schedule-page__style-027"]}>
              Dependencies
            </h3>
            <span className={styles["schedule-page__style-028"]}>
              {projectDependencies.length} links
            </span>
          </div>
          <ul className={styles["schedule-page__style-029"]}>
            {projectDependencies.length ? projectDependencies.map((dependency) => (
              <li key={dependency.id} className={styles["schedule-page__style-030"]}>
                <div className={styles["schedule-page__style-031"]}>
                  <div className={styles["schedule-page__style-032"]}>
                    <div className={styles["schedule-page__style-033"]}>
                      <ProjectBadge project={getProject(projects, dependency.fromProjectId)} />
                      <ArrowRight className={styles["schedule-page__style-034"]} aria-hidden="true" />
                      <ProjectBadge project={getProject(projects, dependency.toProjectId)} />
                    </div>
                    <p className={styles["schedule-page__style-035"]}>{dependency.label}</p>
                  </div>
                  <DangerButton
                    onClick={() => onDeleteDependency(dependency.id)}
                    aria-label={`Delete dependency from ${projectName(dependency.fromProjectId, projects)} to ${projectName(dependency.toProjectId, projects)}`}
                    icon={Trash2}
                  >
                    Delete
                  </DangerButton>
                </div>
              </li>
            )) : (
              <li className={styles["schedule-page__style-036"]}>
                No dependencies yet.
              </li>
            )}
          </ul>
        </section>

        <div className={styles["schedule-page__style-037"]}>
          <form className={styles["schedule-page__style-038"]} onSubmit={planner.handlePlanSubmit}>
            <div>
              <h3 className={styles["schedule-page__style-039"]}>Plan assignment</h3>
              <p className={styles["schedule-page__style-040"]}>{planner.timeline.rangeLabel}</p>
            </div>
            <FormField label="Person" htmlFor="gantt-plan-person"><Select id="gantt-plan-person" value={planner.planForm.memberId} onChange={(value) => setFormValue(planner.setPlanForm, "memberId", value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></FormField>
            <FormField label="Project" htmlFor="gantt-plan-project"><Select id="gantt-plan-project" value={planner.planForm.projectId} onChange={(value) => setFormValue(planner.setPlanForm, "projectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
            <FormField label="Period" htmlFor="gantt-plan-period"><Select id="gantt-plan-period" value={planner.planForm.slotKey} onChange={(value) => setFormValue(planner.setPlanForm, "slotKey", value)}>{planner.timeline.slots.map((slot) => <option key={slot.key} value={slot.key}>{slot.selectLabel}</option>)}</Select></FormField>
            <div className={styles["schedule-page__style-041"]}>
              <FormField label="Start" htmlFor="gantt-plan-start"><input id="gantt-plan-start" type="time" value={planner.planForm.start} onChange={(event) => setFormValue(planner.setPlanForm, "start", event.target.value)} className={styles["schedule-page__style-042"]} /></FormField>
              <FormField label="End" htmlFor="gantt-plan-end"><input id="gantt-plan-end" type="time" value={planner.planForm.end} onChange={(event) => setFormValue(planner.setPlanForm, "end", event.target.value)} className={styles["schedule-page__style-043"]} /></FormField>
            </div>
            <FormField label="Label" htmlFor="gantt-plan-location" helper="Plain text only."><input id="gantt-plan-location" value={planner.planForm.location} onChange={(event) => setFormValue(planner.setPlanForm, "location", event.target.value)} className={styles["schedule-page__style-044"]} /></FormField>
            <PrimaryButton type="submit" icon={Plus}>Add to plan</PrimaryButton>
          </form>

          <form className={styles["schedule-page__style-045"]} onSubmit={planner.handleDependencySubmit}>
            <div>
              <h3 className={styles["schedule-page__style-046"]}>Add dependency</h3>
              <p className={styles["schedule-page__style-047"]}>Link projects where one should finish before another starts.</p>
            </div>
            <FormField label="From project" htmlFor="dependency-from"><Select id="dependency-from" value={planner.dependencyForm.fromProjectId} onChange={(value) => setFormValue(planner.setDependencyForm, "fromProjectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
            <FormField label="To project" htmlFor="dependency-to"><Select id="dependency-to" value={planner.dependencyForm.toProjectId} onChange={(value) => setFormValue(planner.setDependencyForm, "toProjectId", value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
            <FormField label="Dependency note" htmlFor="dependency-label" helper="Plain text only."><input id="dependency-label" value={planner.dependencyForm.label} onChange={(event) => setFormValue(planner.setDependencyForm, "label", event.target.value)} className={styles["schedule-page__style-048"]} /></FormField>
            <PrimaryButton type="submit" icon={GitBranch}>Add dependency</PrimaryButton>
          </form>
        </div>
      </div>
    </Panel>
  );
}
