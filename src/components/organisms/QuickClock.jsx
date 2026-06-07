import React from "react";
import { PauseCircle, Play } from "lucide-react";
import { formatTimer } from "../../timeUtils.js";
import { cx } from "../classNames.js";
import styles from "./QuickClock.module.css";

export function QuickClock({
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
    <form
      className={styles["quick-clock"]}
      aria-label="Quick start stop clock"
      onSubmit={(event) => {
        event.preventDefault();
        onToggle();
      }}
    >
      <label className={styles["quick-clock__label"]} htmlFor="quick-clock-task">
        Quick clock task
      </label>
      <input
        id="quick-clock-task"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        className={styles["quick-clock__input"]}
        placeholder="Describe your task"
      />
      <label className={styles["quick-clock__label"]} htmlFor="quick-clock-project">
        Quick clock project
      </label>
      <select
        id="quick-clock-project"
        value={projectId}
        onChange={(event) => onProjectChange(event.target.value)}
        className={styles["quick-clock__select"]}
      >
        {activeProjects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <span
        className={styles["quick-clock__timer"]}
        role="timer"
      >
        {formatTimer(seconds)}
      </span>
      <button
        type="submit"
        className={cx(
          styles["quick-clock__button"],
          running ? styles["quick-clock__button--running"] : styles["quick-clock__button--idle"]
        )}
      >
        {running ? (
          <PauseCircle className={styles["quick-clock__button-icon"]} aria-hidden="true" />
        ) : (
          <Play className={styles["quick-clock__button-icon"]} aria-hidden="true" />
        )}
        {running ? "Stop" : "Start"}
      </button>
    </form>
  );
}
