import React from "react";
import { cx } from "../classNames.js";
import styles from "./RowActions.module.css";

export function RowActions({
  primaryLabel,
  primaryAriaLabel,
  primaryIcon: PrimaryIcon,
  primaryDisabled,
  primaryIntent = "default",
  onPrimary,
  secondaryLabel,
  secondaryAriaLabel,
  secondaryIcon: SecondaryIcon,
  secondaryIntent = "default",
  onSecondary
}) {
  const intentClasses = {
    default: null,
    success: styles["row-actions__button--success"],
    warning: styles["row-actions__button--warning"],
    danger: styles["row-actions__button--danger"],
    info: styles["row-actions__button--info"]
  };

  return (
    <div className={styles["row-actions"]}>
      {onPrimary ? (
        <button
          type="button"
          disabled={primaryDisabled}
          onClick={onPrimary}
          aria-label={primaryAriaLabel}
          className={cx(
            styles["row-actions__button"],
            styles["row-actions__button--primary"],
            intentClasses[primaryIntent]
          )}
        >
          {PrimaryIcon ? <PrimaryIcon className={styles["row-actions__icon"]} aria-hidden="true" /> : null}
          {primaryLabel}
        </button>
      ) : null}
      {onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          aria-label={secondaryAriaLabel}
          className={cx(
            styles["row-actions__button"],
            styles["row-actions__button--secondary"],
            intentClasses[secondaryIntent]
          )}
        >
          {SecondaryIcon ? <SecondaryIcon className={styles["row-actions__icon"]} aria-hidden="true" /> : null}
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
