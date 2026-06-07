import React from "react";
import { PoundSterling, ShieldCheck } from "lucide-react";
import { formatMargin } from "../../domain/formatters.js";
import { projectStyle } from "../../domain/projectUtils.js";
import { cx } from "../classNames.js";
import styles from "./Badges.module.css";

export function ProjectBadge({ project, showMarker = true }) {
  const style = projectStyle(project);
  return (
    <div className={styles["project-badge"]}>
      {showMarker ? (
        <>
          <span className={cx(styles["project-badge__marker"], style.dot)} aria-hidden="true" />
          <span className={styles["project-badge__marker-label"]}>{project.name} project colour marker.</span>
        </>
      ) : null}
      <div className={styles["project-badge__content"]}>
        <p className={cx(styles["project-badge__name"], style.text)}>{project.name}</p>
        <p className={styles["project-badge__client"]}>{project.client}</p>
      </div>
    </div>
  );
}

export function TagList({ tags, showEmpty = false, compact = false, plain = false }) {
  if (!tags?.length) {
    return showEmpty ? (
      <span className={styles["tag-list__empty"]}>No tags</span>
    ) : (
      <span className={styles["tag-list__empty--hidden"]}>No tags</span>
    );
  }

  return (
    <div className={styles["tag-list"]}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cx(
            styles["tag-list__item"],
            compact ? styles["tag-list__item--compact"] : null,
            plain ? styles["tag-list__item--plain"] : null
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function BillableBadge({ billable, compact = false, plain = false }) {
  return (
    <span
      className={cx(
        styles.badge,
        styles["badge--with-icon"],
        compact ? styles["badge--compact"] : null,
        plain ? styles["badge--plain"] : null,
        billable ? styles["badge--positive"] : styles["badge--neutral"]
      )}
    >
      {!plain && (billable ? <PoundSterling className={styles.badge__icon} aria-hidden="true" /> : <ShieldCheck className={styles.badge__icon} aria-hidden="true" />)}
      {billable ? "Billable" : "Internal"}
    </span>
  );
}

export function StatusBadge({ status, compact = false }) {
  const normalized = status || "Draft";
  const classes = {
    Active: styles["badge--info"],
    Approved: styles["badge--positive"],
    Paid: styles["badge--positive"],
    Published: styles["badge--info"],
    Pending: styles["badge--warning"],
    Planned: styles["badge--warning"],
    Completed: styles["badge--positive"],
    Archived: styles["badge--muted"],
    Inactive: styles["badge--muted"],
    Rejected: styles["badge--danger"]
  };
  return (
    <span className={cx(styles.badge, compact ? styles["badge--compact"] : null, classes[normalized] || classes.Planned)}>
      {normalized}
    </span>
  );
}

export function MarginBadge({ value }) {
  if (value === null) {
    return (
      <span className={cx(styles.badge, styles["badge--empty"])}>
        N/A
      </span>
    );
  }

  const classes =
    value >= 40
      ? styles["badge--positive"]
      : value >= 20
        ? styles["badge--info"]
        : value >= 0
          ? styles["badge--warning"]
          : styles["badge--danger"];

  return (
    <span className={cx(styles.badge, classes)}>
      {formatMargin(value)}
    </span>
  );
}
