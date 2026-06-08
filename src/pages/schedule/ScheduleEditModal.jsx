import React, {
  useEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  X
} from "lucide-react";
import {
  DateInput,
  FormField,
  Select
} from "../../components/ui.jsx";
import { cx } from "../../components/classNames.js";
import { formatReadableDate } from "../../domain/dateUtils.js";
import { setFormValue } from "../../domain/formUtils.js";
import { memberName } from "../../domain/projectUtils.js";
import { createScheduleEditDraft } from "./scheduleDrafts.js";
import styles from "../SchedulePage.module.css";

export function ScheduleEditModal({
  item,
  projects,
  teamMembers,
  onClose,
  onUpdateSchedule
}) {
  const [draft, setDraft] = useState(() => createScheduleEditDraft(item));
  const dialogRef = useRef(null);
  const memberLabel = memberName(item.memberId, teamMembers);
  const readableDate = formatReadableDate(item.dateKey);
  const titleId = `${item.id}-schedule-edit-title`;
  const subtitleId = `${item.id}-schedule-edit-subtitle`;

  useEffect(() => {
    setDraft(createScheduleEditDraft(item));
  }, [item]);

  useEffect(() => {
    window.requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }));

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event) {
    event.preventDefault();
    if (onUpdateSchedule(item.id, draft)) {
      onClose();
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={styles["schedule-page__modal-backdrop"]}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        tabIndex={-1}
        className={styles["schedule-page__modal"]}
      >
        <div className={styles["schedule-page__modal-header"]}>
          <div>
            <h2 id={titleId} className={styles["schedule-page__modal-title"]}>
              Edit scheduled block
            </h2>
            <p id={subtitleId} className={styles["schedule-page__modal-subtitle"]}>
              {memberLabel} - {readableDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close schedule editor"
            className={styles["schedule-page__modal-close-button"]}
          >
            <X className={styles["schedule-page__modal-close-icon"]} aria-hidden="true" />
          </button>
        </div>

        <form className={styles["schedule-page__modal-form"]} onSubmit={handleSubmit}>
          <div className={styles["schedule-page__modal-grid"]}>
            <FormField label="Person" htmlFor={`${item.id}-schedule-edit-person`}>
              <Select
                id={`${item.id}-schedule-edit-person`}
                value={draft.memberId}
                onChange={(value) => setFormValue(setDraft, "memberId", value)}
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Project" htmlFor={`${item.id}-schedule-edit-project`}>
              <Select
                id={`${item.id}-schedule-edit-project`}
                value={draft.projectId}
                onChange={(value) => setFormValue(setDraft, "projectId", value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Date" htmlFor={`${item.id}-schedule-edit-date`}>
            <DateInput
              id={`${item.id}-schedule-edit-date`}
              value={draft.dateKey}
              onChange={(value) => setFormValue(setDraft, "dateKey", value)}
              className={styles["schedule-page__modal-input"]}
            />
          </FormField>

          <div className={styles["schedule-page__modal-grid"]}>
            <FormField label="Start" htmlFor={`${item.id}-schedule-edit-start`}>
              <input
                id={`${item.id}-schedule-edit-start`}
                type="time"
                value={draft.start}
                onChange={(event) => setFormValue(setDraft, "start", event.target.value)}
                className={styles["schedule-page__modal-input"]}
              />
            </FormField>
            <FormField label="End" htmlFor={`${item.id}-schedule-edit-end`}>
              <input
                id={`${item.id}-schedule-edit-end`}
                type="time"
                value={draft.end}
                onChange={(event) => setFormValue(setDraft, "end", event.target.value)}
                className={styles["schedule-page__modal-input"]}
              />
            </FormField>
          </div>

          <FormField label="Label" htmlFor={`${item.id}-schedule-edit-location`}>
            <input
              id={`${item.id}-schedule-edit-location`}
              value={draft.location}
              onChange={(event) => setFormValue(setDraft, "location", event.target.value)}
              className={styles["schedule-page__modal-input"]}
            />
          </FormField>

          <div className={styles["schedule-page__modal-actions"]}>
            <button
              type="button"
              onClick={onClose}
              className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--ghost"])}
            >
              <X className={styles["schedule-page__button-icon"]} aria-hidden="true" />
              Cancel
            </button>
            <button
              type="submit"
              className={cx(styles["schedule-page__action-button"], styles["schedule-page__action-button--save"])}
            >
              <Check className={styles["schedule-page__button-icon"]} aria-hidden="true" />
              Save changes
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
