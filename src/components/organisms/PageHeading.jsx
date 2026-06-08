import React from "react";
import { Clock3 } from "lucide-react";
import { formatDurationLabel } from "../../domain/formatters.js";
import styles from "./PageHeading.module.css";

export function PageHeading({ title, subtitle, weeklyTotal, headingRef }) {
  return (
    <header className={styles["page-heading"]}>
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={styles["page-heading__title"]}
        >
          {title}
        </h1>
        <p className={styles["page-heading__subtitle"]}>{subtitle}</p>
      </div>
      <div
        className={styles["page-heading__week-total"]}
      >
        <Clock3 className={styles["page-heading__week-icon"]} aria-hidden="true" />
        <span>This week</span>
        <span className={styles["page-heading__week-value"]}>{formatDurationLabel(weeklyTotal)}</span>
      </div>
    </header>
  );
}
