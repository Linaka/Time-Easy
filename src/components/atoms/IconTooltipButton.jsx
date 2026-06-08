import React, { useId } from "react";
import { cx } from "../classNames.js";
import styles from "./IconTooltipButton.module.css";

export function IconTooltipButton({
  icon: Icon,
  label,
  title,
  description,
  type = "button",
  variant = "ghost",
  className,
  ...buttonProps
}) {
  const generatedId = useId();
  const tooltipId = `${generatedId}-tooltip`;
  const buttonVariantClass =
    styles[`icon-tooltip-button__button--${variant}`] ||
    styles["icon-tooltip-button__button--ghost"];

  return (
    <span className={styles["icon-tooltip-button"]}>
      <button
        {...buttonProps}
        type={type}
        className={cx(styles["icon-tooltip-button__button"], buttonVariantClass, className)}
        aria-label={label}
        aria-describedby={tooltipId}
      >
        {Icon ? <Icon className={styles["icon-tooltip-button__icon"]} aria-hidden="true" /> : null}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={styles["icon-tooltip-button__tooltip"]}
      >
        <span className={styles["icon-tooltip-button__tooltip-title"]}>
          {title}
        </span>
        <span className={styles["icon-tooltip-button__tooltip-description"]}>
          {description}
        </span>
      </span>
    </span>
  );
}
