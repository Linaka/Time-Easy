import React from "react";
import { slugify } from "../../domain/formUtils.js";
import styles from "./Panel.module.css";

export function Panel({ title, subtitle, action, children }) {
  return (
    <section aria-labelledby={slugify(title)} className={styles.panel}>
      <div className={styles.panel__header}>
        <div>
          <h2 id={slugify(title)} className={styles.panel__heading}>{title}</h2>
          {subtitle ? <p className={styles.panel__subtitle}>{subtitle}</p> : null}
        </div>
        {action ? <div className={styles.panel__action}>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
