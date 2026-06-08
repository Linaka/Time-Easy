import React from "react";
import {
  BriefcaseBusiness,
  Clock3,
  FileCheck2,
  Gauge,
  LogOut,
  Palette,
  Sparkles,
  Trash2,
  UserCircle2,
  UsersRound,
  X
} from "lucide-react";
import {
  WORKSPACE_THEME_IDS,
  WORKSPACE_THEMES
} from "../../domain/appConfig.js";
import { currency } from "../../domain/formatters.js";
import { utilitySubtitle } from "../../domain/navigation.js";
import { getEmploymentGrade } from "../../domain/projectUtils.js";
import { GhostButton, PrimaryButton } from "../atoms/index.js";
import { cx } from "../classNames.js";
import styles from "./UtilityPanel.module.css";

export function UtilityPanel({
  activeUtility,
  pendingApprovalCount,
  workspaceSettings,
  onSettingChange,
  onClearDemoData,
  onSwitchUser,
  onNavigate,
  onClose,
  currentUser,
  employmentGrades
}) {
  const userGrade = getEmploymentGrade(currentUser?.gradeId, employmentGrades);

  function handleNavigate(section) {
    onNavigate(section);
    onClose();
  }

  return (
    <section
      id="utility-panel"
      role="region"
      aria-labelledby="utility-panel-title"
      className={styles["utility-panel"]}
    >
      <div className={styles["utility-panel__header"]}>
        <div>
          <h2 id="utility-panel-title" className={styles["utility-panel__title"]}>
            {activeUtility}
          </h2>
          <p className={styles["utility-panel__subtitle"]}>{utilitySubtitle(activeUtility)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles["utility-panel__close"]}
          aria-label="Close utility panel"
        >
          <X className={styles["utility-panel__close-icon"]} aria-hidden="true" />
        </button>
      </div>

      {activeUtility === "Settings" ? (
        <div className={styles["utility-panel__settings"]}>
          <ThemeChooser
            themeId={workspaceSettings.themeId}
            onChange={(themeId) => onSettingChange("themeId", themeId)}
          />
          <SwitchRow
            label="Require approvals"
            description="New time entries route to Approvals before reporting as approved."
            checked={workspaceSettings.requireApprovals}
            onChange={(checked) => onSettingChange("requireApprovals", checked)}
          />
          <SwitchRow
            label="Default billable"
            description="New timers start with billable enabled for faster client work logging."
            checked={workspaceSettings.defaultBillable}
            onChange={(checked) => onSettingChange("defaultBillable", checked)}
          />
          <SwitchRow
            label="Compact table mode"
            description="Saved preference for denser operational views."
            checked={workspaceSettings.compactTables}
            onChange={(checked) => onSettingChange("compactTables", checked)}
          />
          <GhostButton onClick={() => handleNavigate("Projects")} icon={BriefcaseBusiness}>
            Manage projects
          </GhostButton>
          <div className={styles["utility-panel__danger-zone"]}>
            <div>
              <p className={styles["utility-panel__danger-title"]}>Fresh setup</p>
              <p className={styles["utility-panel__danger-description"]}>
                Clear demo records and keep a starter project with owner access.
              </p>
            </div>
            <button
              type="button"
              onClick={onClearDemoData}
              className={styles["utility-panel__danger-button"]}
            >
              <Trash2 className={styles["utility-panel__danger-icon"]} aria-hidden="true" />
              Clear demo data
            </button>
          </div>
        </div>
      ) : null}

      {activeUtility === "Notifications" ? (
        <div className={styles["utility-panel__section"]}>
          <div className={styles["utility-panel__notice"]}>
            <p className={styles["utility-panel__notice-count"]}>{pendingApprovalCount}</p>
            <p className={styles["utility-panel__notice-title"]}>items need review</p>
            <p className={styles["utility-panel__notice-body"]}>
              Time, expenses, and time off requests are waiting in Approvals.
            </p>
          </div>
          <div className={styles["utility-panel__actions"]}>
            <PrimaryButton onClick={() => handleNavigate("Approvals")} icon={FileCheck2}>
              Review approvals
            </PrimaryButton>
            <GhostButton onClick={() => handleNavigate("Activity")} icon={Sparkles}>
              View activity
            </GhostButton>
          </div>
        </div>
      ) : null}

      {activeUtility === "Help" ? (
        <div className={styles["utility-panel__help"]}>
          <HelpItem title="Start tracking" description="Add a task description, choose a project, and press START." />
          <HelpItem title="Manual entries" description="Use the timer-reset button to open manual date and duration fields." />
          <HelpItem title="Approvals" description="Pending time, expenses, and time off requests can be approved or rejected." />
          <div className={styles["utility-panel__help-actions"]}>
            <GhostButton onClick={() => handleNavigate("Reports")} icon={Gauge}>Open reports</GhostButton>
            <GhostButton onClick={() => handleNavigate("Team")} icon={UsersRound}>Open team</GhostButton>
          </div>
        </div>
      ) : null}

      {activeUtility === "Profile" ? (
        <div className={styles["utility-panel__section"]}>
          <div className={styles["utility-panel__profile-card"]}>
            <p className={styles["utility-panel__profile-name"]}>{currentUser?.name || "Ava Morgan"}</p>
            <p className={styles["utility-panel__profile-email"]}>{currentUser?.email || "ava@timetrackr.local"}</p>
            <p className={styles["utility-panel__profile-grade"]}>
              {userGrade.label} · {userGrade.title} · {currency(userGrade.hourlyRate)}/hr
            </p>
            <p className={styles["utility-panel__profile-role"]}>
              Access role: {currentUser?.accessRole || "Member"}
            </p>
          </div>
          <div className={styles["utility-panel__actions"]}>
            <PrimaryButton onClick={() => handleNavigate("Team")} icon={UserCircle2}>
              Manage profile
            </PrimaryButton>
            <GhostButton onClick={onSwitchUser} icon={LogOut}>
              Switch user
            </GhostButton>
            <GhostButton onClick={() => handleNavigate("Time Tracker")} icon={Clock3}>
              Track time
            </GhostButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ThemeChooser({ themeId, onChange }) {
  const activeThemeId = themeId || WORKSPACE_THEME_IDS.STUDIO;

  return (
    <fieldset className={styles["theme-chooser"]}>
      <legend className={styles["theme-chooser__legend"]}>
        <Palette className={styles["theme-chooser__legend-icon"]} aria-hidden="true" />
        Theme
      </legend>
      <div className={styles["theme-chooser__options"]}>
        {WORKSPACE_THEMES.map((theme) => {
          const isActive = activeThemeId === theme.id;
          return (
            <label
              key={theme.id}
              className={cx(
                styles["theme-chooser__option"],
                isActive ? styles["theme-chooser__option--active"] : null
              )}
            >
              <input
                type="radio"
                name="workspace-theme"
                value={theme.id}
                checked={isActive}
                onChange={() => onChange(theme.id)}
                className={styles["theme-chooser__control"]}
              />
              <span className={styles["theme-chooser__content"]}>
                <span className={styles["theme-chooser__label"]}>{theme.label}</span>
                <span className={styles["theme-chooser__description"]}>{theme.description}</span>
              </span>
              <span className={styles["theme-chooser__swatches"]} aria-hidden="true">
                <span className={cx(styles["theme-chooser__swatch"], styles[`theme-chooser__swatch--${theme.id}-one`])} />
                <span className={cx(styles["theme-chooser__swatch"], styles[`theme-chooser__swatch--${theme.id}-two`])} />
                <span className={cx(styles["theme-chooser__swatch"], styles[`theme-chooser__swatch--${theme.id}-three`])} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SwitchRow({ label, description, checked, onChange }) {
  return (
    <label className={styles["switch-row"]}>
      <span>
        <span className={styles["switch-row__label"]}>{label}</span>
        <span className={styles["switch-row__description"]}>{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={styles["switch-row__control"]}
      />
    </label>
  );
}

function HelpItem({ title, description }) {
  return (
    <div className={styles["help-item"]}>
      <p className={styles["help-item__title"]}>{title}</p>
      <p className={styles["help-item__description"]}>{description}</p>
    </div>
  );
}
