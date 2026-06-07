import React from "react";
import { cx } from "../classNames.js";
import styles from "./Buttons.module.css";

export function PrimaryButton({ type = "button", icon: Icon, onClick, children, className, ...buttonProps }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(styles.button, styles["button--primary"], className)}
      {...buttonProps}
    >
      {Icon ? <Icon className={styles.button__icon} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ icon: Icon, onClick, children, className, ...buttonProps }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(styles.button, styles["button--ghost"], className)}
      {...buttonProps}
    >
      {Icon ? <Icon className={styles.button__icon} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function DangerButton({ type = "button", icon: Icon, onClick, children, className, ...buttonProps }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(styles.button, styles["button--danger"], className)}
      {...buttonProps}
    >
      {Icon ? <Icon className={styles.button__icon} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
