import React, { useEffect, useRef } from "react";
import {
  PageHeading,
  QuickClockPanel,
  Sidebar,
  TopBar
} from "../organisms/index.js";

export function AppLayout({
  activeSection,
  activeUtility,
  activeProjects,
  children,
  currentUser,
  employmentGrades,
  onNavigate,
  onQuickClockToggle,
  onQuickDescriptionChange,
  onQuickProjectChange,
  onSettingChange,
  onUtilityClose,
  onUtilityToggle,
  pageSubtitle,
  pendingApprovalCount,
  quickDescription,
  quickProjectId,
  quickRunning,
  quickSeconds,
  statusMessage,
  weeklyTotal,
  workspaceSettings
}) {
  const headingRef = useRef(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    document.title = `${activeSection} | Creative Operations`;

    if (hasMountedRef.current) {
      window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
      return;
    }

    hasMountedRef.current = true;
  }, [activeSection]);

  return (
    <div
      className={`min-h-screen bg-brand-50 text-black ${
        workspaceSettings.compactTables ? "[&_td]:py-2 [&_th]:py-2" : ""
      }`}
    >
      <a
        href="#main-content"
        className="focus-ring fixed left-4 top-4 z-50 -translate-y-16 rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-pill transition focus-visible:translate-y-0"
      >
        Skip to content
      </a>

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
        quickDescription={quickDescription}
        quickProjectId={quickProjectId}
        quickRunning={quickRunning}
        quickSeconds={quickSeconds}
        onQuickDescriptionChange={onQuickDescriptionChange}
        onQuickProjectChange={onQuickProjectChange}
        onQuickClockToggle={onQuickClockToggle}
      />

      <div className="pt-16 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar activeSection={activeSection} onNavigate={onNavigate} />

        <main
          id="main-content"
          className="min-w-0 px-4 py-6 sm:px-6 lg:col-start-2 lg:px-8"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <PageHeading
              title={activeSection}
              weeklyTotal={weeklyTotal}
              subtitle={pageSubtitle}
              headingRef={headingRef}
            />

            <QuickClockPanel
              activeProjects={activeProjects}
              description={quickDescription}
              projectId={quickProjectId}
              running={quickRunning}
              seconds={quickSeconds}
              onDescriptionChange={onQuickDescriptionChange}
              onProjectChange={onQuickProjectChange}
              onToggle={onQuickClockToggle}
            />

            {children}
          </div>
        </main>
      </div>

      <div className="sr-status" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
    </div>
  );
}
