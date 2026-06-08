import React from "react";
import { AppLayout, IdentityLaunch } from "./components/templates/index.js";
import { getSectionDefinition } from "./domain/sections.js";
import { useCreativeOperationsApp } from "./hooks/useCreativeOperationsApp.js";
import * as PageComponents from "./pages/AppPages.jsx";

function App() {
  const {
    activeSection,
    activeUtility,
    activeProjects,
    currentUser,
    employmentGrades,
    handleNavigate,
    handleDeclineGuidance,
    handleNextGuidance,
    handlePreviousGuidance,
    handleQuickClockToggle,
    handleSkipGuidance,
    handleStartGuidance,
    identity,
    onClearDemoData,
    pagePropsBySection,
    pendingApprovalCount,
    guidanceStep,
    guidanceStepCount,
    guidanceStepIndex,
    quickDescription,
    quickProjectId,
    quickRunning,
    quickSeconds,
    setActiveUtility,
    setQuickDescription,
    setQuickProjectId,
    statusMessage,
    showOnboardingPrompt,
    toggleUtility,
    updateWorkspaceSetting,
    weeklyTotal,
    workspaceSettings
  } = useCreativeOperationsApp();

  const activeSectionDefinition = getSectionDefinition(activeSection);
  if (identity.requiresSelection) {
    return (
      <IdentityLaunch
        employmentGrades={employmentGrades}
        onSelectUser={identity.onSelectUser}
        selectedUserId={identity.selectedUserId}
        statusMessage={statusMessage}
        teamMembers={identity.teamMembers}
        workspaceSettings={workspaceSettings}
      />
    );
  }

  const ActivePage = PageComponents[activeSectionDefinition?.componentName];
  const activePageProps = pagePropsBySection[activeSection] || {};
  const navigation = {
    activeSection,
    activeUtility,
    onNavigate: handleNavigate,
    onUtilityClose: () => setActiveUtility(null),
    onUtilityToggle: toggleUtility,
    pageSubtitle: activeSectionDefinition?.subtitle || ""
  };
  const workspace = {
    activeProjects,
    currentUser,
    employmentGrades,
    settings: workspaceSettings,
    onClearDemoData,
    onSettingChange: updateWorkspaceSetting,
    onSwitchUser: identity.onSwitchUser
  };
  const metrics = {
    pendingApprovalCount,
    weeklyTotal
  };
  const quickClock = {
    description: quickDescription,
    projectId: quickProjectId,
    running: quickRunning,
    seconds: quickSeconds,
    onDescriptionChange: setQuickDescription,
    onProjectChange: setQuickProjectId,
    onToggle: handleQuickClockToggle
  };
  const guidance = {
    promptOpen: showOnboardingPrompt,
    step: guidanceStep,
    stepCount: guidanceStepCount,
    stepIndex: guidanceStepIndex,
    onBack: handlePreviousGuidance,
    onDecline: handleDeclineGuidance,
    onNext: handleNextGuidance,
    onSkip: handleSkipGuidance,
    onStart: handleStartGuidance
  };

  return (
    <AppLayout
      guidance={guidance}
      metrics={metrics}
      navigation={navigation}
      quickClock={quickClock}
      statusMessage={statusMessage}
      workspace={workspace}
    >
      {ActivePage ? <ActivePage {...activePageProps} /> : null}
    </AppLayout>
  );
}
export default App;
