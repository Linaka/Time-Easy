import React from "react";
import { formatRelativeTime } from "../../domain/dateUtils.js";
import styles from "./DataDisplay.module.css";

export function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <article className={styles["metric-card"]}>
      <div className={styles["metric-card__header"]}>
        <p className={styles["metric-card__label"]}>{label}</p>
        <span className={styles["metric-card__icon-shell"]}>
          <Icon className={styles["metric-card__icon"]} aria-hidden="true" />
        </span>
      </div>
      <p className={styles["metric-card__value"]}>{value}</p>
      <p className={styles["metric-card__helper"]}>{helper}</p>
    </article>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className={styles["data-table"]}>
      <table className={styles["data-table__table"]}>
        <thead>
          <tr className={styles["data-table__heading-row"]}>
            {columns.map((column) => (
              <th key={column} scope="col" className={styles["data-table__heading-cell"]}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className={styles["data-table__body"]}>
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${columns.join("-")}`} className={styles["data-table__row"]}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className={styles["data-table__cell"]}
                  data-label={columns[cellIndex]}
                >
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className={styles["data-table__empty-cell"]}>
                No records match this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityList({ items }) {
  return (
    <ol className={styles["activity-list"]}>
      {items.length ? items.map((item) => (
        <li key={item.id} className={styles["activity-list__item"]}>
          <span className={styles["activity-list__marker"]} aria-hidden="true" />
          <div className={styles["activity-list__content"]}>
            <p className={styles["activity-list__description"]}>{item.description}</p>
            <p className={styles["activity-list__meta"]}>{item.type} · {item.actor} · {formatRelativeTime(item.timestamp)}</p>
          </div>
        </li>
      )) : (
        <li className={styles["activity-list__empty"]}>No activity yet.</li>
      )}
    </ol>
  );
}
