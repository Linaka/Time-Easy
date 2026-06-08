import React from "react";
import {
  Bell,
  CircleHelp,
  Clock3,
  Settings,
  UserCircle2
} from "lucide-react";
import {
  canPerform,
  PERMISSIONS
} from "../../domain/auth.js";
import { formatDurationLabel } from "../../domain/formatters.js";
import { cx } from "../classNames.js";
import { QuickClock } from "./QuickClock.jsx";
import { UtilityPanel } from "./UtilityPanel.jsx";
import styles from "./TopBar.module.css";

export function TopBar({
  weeklyTotal,
  pendingApprovalCount,
  activeUtility,
  onUtilityToggle,
  onUtilityClose,
  onNavigate,
  workspaceSettings,
  onSettingChange,
  onClearDemoData,
  currentUser,
  employmentGrades,
  activeProjects,
  quickDescription,
  quickProjectId,
  quickRunning,
  quickSeconds,
  onQuickDescriptionChange,
  onQuickProjectChange,
  onQuickClockToggle
}) {
  const utilityItems = [
    ...(canPerform(currentUser, PERMISSIONS.MANAGE_SETTINGS)
      ? [{ id: "Settings", label: "Settings", icon: Settings }]
      : []),
    { id: "Notifications", label: `${pendingApprovalCount} notifications`, icon: Bell },
    { id: "Help", label: "Help", icon: CircleHelp },
    { id: "Profile", label: "User profile", icon: UserCircle2 }
  ];

  return (
    <header className={styles["top-bar"]}>
      <div className={styles["top-bar__content"]}>
        <div className={styles["top-bar__brand-area"]}>
          <a href="#main-content" className={styles["top-bar__brand"]}>
            <img
              src="/creative-operations-logo.png"
              alt="Creative Operations"
              className={styles["top-bar__brand-logo"]}
            />
          </a>
        </div>

        <div className={styles["top-bar__quick-clock"]}>
          <QuickClock
            activeProjects={activeProjects}
            description={quickDescription}
            projectId={quickProjectId}
            running={quickRunning}
            seconds={quickSeconds}
            onDescriptionChange={onQuickDescriptionChange}
            onProjectChange={onQuickProjectChange}
            onToggle={onQuickClockToggle}
          />
        </div>

        <div className={styles["top-bar__actions"]}>
          <div className={styles["top-bar__week-total"]}>
            <Clock3 className={styles["top-bar__week-icon"]} aria-hidden="true" />
            <span className={styles["top-bar__week-label"]}>Week</span>
            <span className={styles["top-bar__week-value"]}>{formatDurationLabel(weeklyTotal)}</span>
          </div>
          {utilityItems.map((item) => {
            const Icon = item.icon;
            const isOpen = activeUtility === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onUtilityToggle(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && isOpen) {
                    onUtilityClose();
                  }
                }}
                aria-expanded={isOpen}
                aria-controls={isOpen ? "utility-panel" : undefined}
                className={cx(
                  styles["top-bar__utility-button"],
                  isOpen ? styles["top-bar__utility-button--active"] : null
                )}
                aria-label={item.label}
              >
                <Icon className={styles["top-bar__utility-icon"]} aria-hidden="true" />
                {item.id === "Notifications" && pendingApprovalCount ? (
                  <span className={styles["top-bar__notification-count"]}>
                    {pendingApprovalCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {activeUtility ? (
        <UtilityPanel
          activeUtility={activeUtility}
          pendingApprovalCount={pendingApprovalCount}
          workspaceSettings={workspaceSettings}
          onSettingChange={onSettingChange}
          onClearDemoData={onClearDemoData}
          onNavigate={onNavigate}
          onClose={onUtilityClose}
          currentUser={currentUser}
          employmentGrades={employmentGrades}
        />
      ) : null}
    </header>
  );
}
