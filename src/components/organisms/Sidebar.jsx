import React, { useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileCheck2,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  LucideCalendarClock,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Sparkles,
  UsersRound
} from "lucide-react";
import { filterNavigationGroups } from "../../domain/auth.js";
import { buildNavigationGroups } from "../../domain/sections.js";
import { cx } from "../classNames.js";
import styles from "./Sidebar.module.css";

const SECTION_ICONS = {
  alarm: AlarmClock,
  briefcase: BriefcaseBusiness,
  calendarClock: LucideCalendarClock,
  calendarDays: CalendarDays,
  clock: Clock3,
  fileCheck: FileCheck2,
  gauge: Gauge,
  grid: Grid2X2,
  layoutDashboard: LayoutDashboard,
  listChecks: ListChecks,
  receipt: Receipt,
  sparkles: Sparkles,
  users: UsersRound
};

const navGroups = buildNavigationGroups();

export function Sidebar({
  activeSection,
  collapsed = false,
  currentUser,
  workspaceSettings,
  onNavigate,
  onToggleCollapsed
}) {
  const permittedNavGroups = filterNavigationGroups(navGroups, currentUser, workspaceSettings);
  const activeGroupLabel = useMemo(
    () => permittedNavGroups.find((group) =>
      group.items.some((item) => item.label === activeSection)
    )?.label,
    [activeSection, permittedNavGroups]
  );
  const [expandedGroups, setExpandedGroups] = useState(() =>
    activeGroupLabel ? [activeGroupLabel] : []
  );

  useEffect(() => {
    if (!activeGroupLabel) {
      return;
    }

    setExpandedGroups((currentGroups) =>
      currentGroups.length === 1 && currentGroups[0] === activeGroupLabel
        ? currentGroups
        : [activeGroupLabel]
    );
  }, [activeGroupLabel]);

  function toggleGroup(groupLabel) {
    setExpandedGroups((currentGroups) =>
      currentGroups.includes(groupLabel)
        ? currentGroups.filter((label) => label !== groupLabel)
        : [...currentGroups, groupLabel]
    );
  }

  return (
    <aside
      className={cx(
        styles.sidebar,
        collapsed ? styles["sidebar--collapsed"] : null
      )}
    >
      <nav
        className={styles.sidebar__nav}
        aria-label="Primary navigation"
      >
        <div className={styles["sidebar__mobile-control"]}>
          <label className={styles["sidebar__select-label"]} htmlFor="primary-navigation-section">
            Navigate to section
          </label>
          <select
            id="primary-navigation-section"
            value={activeSection}
            onChange={(event) => onNavigate(event.target.value)}
            className={styles.sidebar__select}
          >
            {permittedNavGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className={styles["sidebar__desktop-nav"]}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={styles["sidebar__collapse-button"]}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className={styles["sidebar__collapse-icon"]} aria-hidden="true" />
            ) : (
              <PanelLeftClose className={styles["sidebar__collapse-icon"]} aria-hidden="true" />
            )}
            <span className={styles["sidebar__collapse-label"]}>
              {collapsed ? "Expand" : "Collapse"} sidebar
            </span>
          </button>

          {permittedNavGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.label);
            const showItems = collapsed || isExpanded;
            const activeItem = group.items.find((item) => item.label === activeSection);
            const groupId = `sidebar-group-${group.label.toLowerCase()}`;
            const tooltipId = `${groupId}-tooltip`;

            return (
              <div key={group.label} className={styles.sidebar__group}>
                {!collapsed ? (
                  <div className={styles["sidebar__group-heading"]}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className={cx(
                        styles["sidebar__group-button"],
                        activeItem ? styles["sidebar__group-button--active"] : null
                      )}
                      aria-expanded={isExpanded}
                      aria-controls={groupId}
                      aria-describedby={tooltipId}
                    >
                      <span>
                        <span className={styles["sidebar__group-label"]}>
                          {group.label}
                        </span>
                      </span>
                      <ChevronDown
                        className={cx(
                          styles["sidebar__group-chevron"],
                          isExpanded ? styles["sidebar__group-chevron--expanded"] : null
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <span
                      id={tooltipId}
                      role="tooltip"
                      className={styles["sidebar__group-tooltip"]}
                    >
                      {activeItem ? activeItem.label : group.description}
                    </span>
                  </div>
                ) : null}

                <div
                  id={groupId}
                  className={cx(
                    styles.sidebar__items,
                    showItems ? styles["sidebar__items--expanded"] : null
                  )}
                  hidden={!showItems}
                >
                  {group.items.map((item) => {
                    const Icon = SECTION_ICONS[item.iconKey] || Clock3;
                    const isActive = item.label === activeSection;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        title={collapsed ? item.label : undefined}
                        onClick={() => onNavigate(item.label)}
                        className={cx(
                          styles.sidebar__item,
                          isActive ? styles["sidebar__item--active"] : null
                        )}
                      >
                        <Icon
                          className={cx(
                            styles.sidebar__icon,
                            isActive ? styles["sidebar__icon--active"] : null
                          )}
                          aria-hidden="true"
                        />
                        <span className={styles["sidebar__item-label"]}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
