import React from "react";
import { PauseCircle, Play } from "lucide-react";
import { formatTimer } from "../../timeUtils.js";
import { cx } from "../classNames.js";
import styles from "./QuickClockPanel.module.css";

export function QuickClockPanel({
  activeProjects,
  description,
  projectId,
  running,
  seconds,
  onDescriptionChange,
  onProjectChange,
  onToggle
}) {
  return (
    <section
      aria-labelledby="quick-clock-title"
      className={styles["quick-clock-panel"]}
    >
      <div className={styles["quick-clock-panel__content"]}>
        <div className={styles["quick-clock-panel__field"]}>
          <h2 id="quick-clock-title" className={styles["quick-clock-panel__title"]}>
            Quick start stop clock
          </h2>
          <label htmlFor="quick-clock-panel-task" className={styles["quick-clock-panel__label"]}>
            Quick clock task
          </label>
          <input
            id="quick-clock-panel-task"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className={styles["quick-clock-panel__input"]}
            placeholder="Describe your task"
          />
        </div>
        <div className={styles["quick-clock-panel__project"]}>
          <label htmlFor="quick-clock-panel-project" className={styles["quick-clock-panel__label"]}>
            Quick clock project
          </label>
          <select
            id="quick-clock-panel-project"
            value={projectId}
            onChange={(event) => onProjectChange(event.target.value)}
            className={styles["quick-clock-panel__select"]}
          >
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div
          className={styles["quick-clock-panel__timer"]}
          role="timer"
        >
          {formatTimer(seconds)}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cx(
            styles["quick-clock-panel__button"],
            running ? styles["quick-clock-panel__button--running"] : styles["quick-clock-panel__button--idle"]
          )}
        >
          {running ? (
            <PauseCircle className={styles["quick-clock-panel__button-icon"]} aria-hidden="true" />
          ) : (
            <Play className={styles["quick-clock-panel__button-icon"]} aria-hidden="true" />
          )}
          {running ? "Stop quick clock" : "Start quick clock"}
        </button>
      </div>
    </section>
  );
}
