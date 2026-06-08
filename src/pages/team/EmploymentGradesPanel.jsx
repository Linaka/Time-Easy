import React, { useEffect, useState } from "react";
import {
  FormField,
  Panel
} from "../../components/ui.jsx";
import { currency } from "../../domain/formatters.js";
import styles from "../TeamPage.module.css";

function createGradeDrafts(employmentGrades) {
  return Object.fromEntries(
    employmentGrades.map((grade) => [
      grade.id,
      {
        title: grade.title,
        hourlyRate: String(grade.hourlyRate),
        description: grade.description
      }
    ])
  );
}

export function EmploymentGradesPanel({
  employmentGrades,
  onEmploymentGradeChange
}) {
  const [gradeDrafts, setGradeDrafts] = useState(() => createGradeDrafts(employmentGrades));

  useEffect(() => {
    setGradeDrafts(createGradeDrafts(employmentGrades));
  }, [employmentGrades]);

  return (
    <Panel title="Employment grades" subtitle="Four fixed grades with increasing hourly rates.">
      <div className={styles["team-page__style-010"]}>
        {employmentGrades.map((grade, index) => (
          <form
            key={grade.id}
            className={styles["team-page__style-011"]}
            onSubmit={(event) => {
              event.preventDefault();
              onEmploymentGradeChange(grade.id, {
                title: gradeDrafts[grade.id]?.title || grade.title,
                hourlyRate: gradeDrafts[grade.id]?.hourlyRate || grade.hourlyRate,
                description: gradeDrafts[grade.id]?.description || grade.description
              });
            }}
          >
            <div className={styles["team-page__style-012"]}>
              <div className={styles["team-page__style-013"]}>
                <p className={styles["team-page__style-014"]}>{grade.label}</p>
                <span className={styles["team-page__style-015"]}>
                  {currency(grade.hourlyRate)}/hr
                </span>
              </div>
              <FormField label={`${grade.label} title`} htmlFor={`${grade.id}-title`}>
                <input
                  id={`${grade.id}-title`}
                  value={gradeDrafts[grade.id]?.title || ""}
                  onChange={(event) =>
                    setGradeDrafts((current) => ({
                      ...current,
                      [grade.id]: { ...current[grade.id], title: event.target.value }
                    }))
                  }
                  className={styles["team-page__style-016"]}
                />
              </FormField>
              <FormField label={`${grade.label} hourly rate (GBP)`} htmlFor={`${grade.id}-rate`}>
                <input
                  id={`${grade.id}-rate`}
                  type="text"
                  inputMode="decimal"
                  value={gradeDrafts[grade.id]?.hourlyRate || ""}
                  onChange={(event) =>
                    setGradeDrafts((current) => ({
                      ...current,
                      [grade.id]: { ...current[grade.id], hourlyRate: event.target.value }
                    }))
                  }
                  className={styles["team-page__style-017"]}
                />
              </FormField>
              <FormField label={`${grade.label} description`} htmlFor={`${grade.id}-description`}>
                <input
                  id={`${grade.id}-description`}
                  value={gradeDrafts[grade.id]?.description || ""}
                  onChange={(event) =>
                    setGradeDrafts((current) => ({
                      ...current,
                      [grade.id]: { ...current[grade.id], description: event.target.value }
                    }))
                  }
                  className={styles["team-page__style-018"]}
                />
              </FormField>
            </div>
            {index > 0 ? (
              <p className={styles["team-page__style-019"]}>
                Higher than {employmentGrades[index - 1].label} by{" "}
                {currency(grade.hourlyRate - employmentGrades[index - 1].hourlyRate)}/hr
              </p>
            ) : null}
            <button
              type="submit"
              className={styles["team-page__style-020"]}
            >
              Save {grade.label}
            </button>
          </form>
        ))}
      </div>
    </Panel>
  );
}
