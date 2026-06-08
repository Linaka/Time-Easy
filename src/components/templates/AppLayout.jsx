import React, { useEffect, useRef, useState } from "react";
import {
  PageHeading,
  QuickClockPanel,
  Sidebar,
  TopBar
} from "../organisms/index.js";
import { cx } from "../classNames.js";
import { GuidedWalkthrough } from "./GuidedWalkthrough.jsx";
import { WORKSPACE_THEME_IDS } from "../../domain/appConfig.js";
import { sectionUsesQuickClock } from "../../domain/sections.js";
import styles from "./AppLayout.module.css";

export function AppLayout({
  children,
  guidance,
  metrics,
  navigation,
  quickClock,
  statusMessage,
  workspace
}) {
  const {
    activeSection,
    activeUtility,
    onNavigate,
    onUtilityClose,
    onUtilityToggle,
    pageSubtitle
  } = navigation;
  const {
    activeProjects,
    currentUser,
    employmentGrades,
    onClearDemoData,
    onSwitchUser,
    onSettingChange,
    settings: workspaceSettings
  } = workspace;
  const {
    pendingApprovalCount,
    weeklyTotal
  } = metrics;
  const headingRef = useRef(null);
  const hasMountedRef = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.title = `${activeSection} | Creative Operations`;

    if (hasMountedRef.current) {
      window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
      return;
    }

    hasMountedRef.current = true;
  }, [activeSection]);

  const showQuickClockPanel = sectionUsesQuickClock(activeSection);
  const themeClassName = {
    [WORKSPACE_THEME_IDS.SOFT_STUDIO]: styles["app-layout--theme-soft-studio"],
    [WORKSPACE_THEME_IDS.KAWAII_POP]: styles["app-layout--theme-kawaii-pop"]
  }[workspaceSettings.themeId];
  const isKawaiiPopTheme = workspaceSettings.themeId === WORKSPACE_THEME_IDS.KAWAII_POP;

  return (
    <div
      className={cx(
        styles["app-layout"],
        themeClassName,
        workspaceSettings.compactTables ? styles["app-layout--compact-tables"] : null
      )}
    >
      <a
        href="#main-content"
        className={styles["app-layout__skip-link"]}
      >
        Skip to content
      </a>

      {isKawaiiPopTheme ? (
        <div className={styles["app-layout__clouds"]} aria-hidden="true">
          <span className={cx(styles["app-layout__cloud"], styles["app-layout__cloud--one"])} />
          <span className={cx(styles["app-layout__cloud"], styles["app-layout__cloud--two"])} />
          <span className={cx(styles["app-layout__cloud"], styles["app-layout__cloud--three"])} />
          <span className={cx(styles["app-layout__cloud"], styles["app-layout__cloud--four"])} />
        </div>
      ) : null}

      <TopBar
        weeklyTotal={weeklyTotal}
        pendingApprovalCount={pendingApprovalCount}
        activeUtility={activeUtility}
        onUtilityToggle={onUtilityToggle}
        onUtilityClose={onUtilityClose}
        onNavigate={onNavigate}
        workspaceSettings={workspaceSettings}
        onSettingChange={onSettingChange}
        currentUser={currentUser}
        employmentGrades={employmentGrades}
        activeProjects={activeProjects}
        quickDescription={quickClock.description}
        quickProjectId={quickClock.projectId}
        quickRunning={quickClock.running}
        quickSeconds={quickClock.seconds}
        onClearDemoData={onClearDemoData}
        onSwitchUser={onSwitchUser}
        onQuickDescriptionChange={quickClock.onDescriptionChange}
        onQuickProjectChange={quickClock.onProjectChange}
        onQuickClockToggle={quickClock.onToggle}
      />

      <div
        className={cx(
          styles["app-layout__shell"],
          sidebarCollapsed ? styles["app-layout__shell--sidebar-collapsed"] : null
        )}
      >
        <Sidebar
          activeSection={activeSection}
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          workspaceSettings={workspaceSettings}
          onNavigate={onNavigate}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />

        <main
          id="main-content"
          className={styles["app-layout__main"]}
        >
          <div className={styles["app-layout__content"]}>
            <PageHeading
              title={activeSection}
              weeklyTotal={weeklyTotal}
              subtitle={pageSubtitle}
              headingRef={headingRef}
            />

            {showQuickClockPanel ? (
              <QuickClockPanel
                activeProjects={activeProjects}
                description={quickClock.description}
                projectId={quickClock.projectId}
                running={quickClock.running}
                seconds={quickClock.seconds}
                onDescriptionChange={quickClock.onDescriptionChange}
                onProjectChange={quickClock.onProjectChange}
                onToggle={quickClock.onToggle}
              />
            ) : null}

            {children}
          </div>
        </main>
      </div>

      <div className={styles["app-layout__status"]} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <GuidedWalkthrough
        promptOpen={guidance.promptOpen}
        step={guidance.step}
        stepCount={guidance.stepCount}
        stepIndex={guidance.stepIndex}
        onBack={guidance.onBack}
        onDecline={guidance.onDecline}
        onNext={guidance.onNext}
        onSkip={guidance.onSkip}
        onStart={guidance.onStart}
      />
    </div>
  );
}
