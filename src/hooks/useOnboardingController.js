import { useEffect, useMemo, useState } from "react";
import {
  canAccessSection,
  firstAccessibleSection
} from "../domain/auth.js";
import { OVERVIEW_SECTION } from "../domain/appConfig.js";
import {
  GUIDANCE_STEPS,
  ONBOARDING_STATUS
} from "../domain/onboarding.js";
import { trackClientEvent } from "../services/clientLogger.js";

export function useOnboardingController({
  currentUser,
  setActiveSection,
  setActiveUtility,
  setStatusMessage,
  setWorkspaceSettings,
  workspaceSettings
}) {
  const [guidanceStepIndex, setGuidanceStepIndex] = useState(null);
  const availableGuidanceSteps = useMemo(
    () => GUIDANCE_STEPS.filter((step) => canAccessSection(currentUser, step.section)),
    [currentUser]
  );
  const guidanceStep = guidanceStepIndex === null ? null : availableGuidanceSteps[guidanceStepIndex] || null;
  const onboardingStatus = workspaceSettings.onboardingStatus || ONBOARDING_STATUS.PENDING;
  const showOnboardingPrompt = onboardingStatus === ONBOARDING_STATUS.PENDING && guidanceStepIndex === null;

  useEffect(() => {
    if (onboardingStatus !== ONBOARDING_STATUS.STARTED || guidanceStepIndex !== null) {
      return;
    }

    if (!availableGuidanceSteps.length) {
      updateOnboardingStatus(ONBOARDING_STATUS.COMPLETED);
      return;
    }

    setActiveUtility(null);
    setActiveSection(availableGuidanceSteps[0].section);
    setGuidanceStepIndex(0);
  }, [
    availableGuidanceSteps,
    guidanceStepIndex,
    onboardingStatus,
    setActiveSection,
    setActiveUtility,
    setWorkspaceSettings
  ]);

  useEffect(() => {
    if (!guidanceStep) {
      return;
    }

    if (!canAccessSection(currentUser, guidanceStep.section)) {
      setGuidanceStepIndex(null);
      updateOnboardingStatus(ONBOARDING_STATUS.COMPLETED);
      return;
    }

    setActiveUtility(null);
    setActiveSection(guidanceStep.section);
  }, [
    currentUser,
    guidanceStep,
    setActiveSection,
    setActiveUtility,
    setWorkspaceSettings
  ]);

  function updateOnboardingStatus(status) {
    setWorkspaceSettings((currentSettings) => ({
      ...currentSettings,
      onboardingStatus: status
    }));
  }

  function openOverviewSection() {
    const nextSection = firstAccessibleSection(currentUser, OVERVIEW_SECTION);
    setActiveSection(nextSection);
    setActiveUtility(null);
    return nextSection;
  }

  function handleStartGuidance() {
    if (!availableGuidanceSteps.length) {
      updateOnboardingStatus(ONBOARDING_STATUS.COMPLETED);
      const nextSection = openOverviewSection();
      setStatusMessage(`${nextSection} opened.`);
      return false;
    }

    updateOnboardingStatus(ONBOARDING_STATUS.STARTED);
    setGuidanceStepIndex(0);
    setActiveUtility(null);
    setActiveSection(availableGuidanceSteps[0].section);
    setStatusMessage("Walkthrough started.");
    trackClientEvent("onboarding_started", { steps: availableGuidanceSteps.length });
    return true;
  }

  function handleDeclineGuidance() {
    updateOnboardingStatus(ONBOARDING_STATUS.DECLINED);
    setGuidanceStepIndex(null);
    const nextSection = openOverviewSection();
    setStatusMessage(`${nextSection} opened.`);
    trackClientEvent("onboarding_declined", { destination: nextSection });
    return true;
  }

  function handleNextGuidance() {
    if (guidanceStepIndex === null) {
      return false;
    }

    const nextIndex = guidanceStepIndex + 1;
    if (nextIndex >= availableGuidanceSteps.length) {
      updateOnboardingStatus(ONBOARDING_STATUS.COMPLETED);
      setGuidanceStepIndex(null);
      const nextSection = openOverviewSection();
      setStatusMessage("Walkthrough complete.");
      trackClientEvent("onboarding_completed", { destination: nextSection });
      return true;
    }

    setGuidanceStepIndex(nextIndex);
    setActiveUtility(null);
    setActiveSection(availableGuidanceSteps[nextIndex].section);
    setStatusMessage(`${availableGuidanceSteps[nextIndex].section} guidance opened.`);
    return true;
  }

  function handlePreviousGuidance() {
    if (guidanceStepIndex === null || guidanceStepIndex <= 0) {
      return false;
    }

    const previousIndex = guidanceStepIndex - 1;
    setGuidanceStepIndex(previousIndex);
    setActiveUtility(null);
    setActiveSection(availableGuidanceSteps[previousIndex].section);
    setStatusMessage(`${availableGuidanceSteps[previousIndex].section} guidance opened.`);
    return true;
  }

  function handleSkipGuidance() {
    updateOnboardingStatus(ONBOARDING_STATUS.SKIPPED);
    setGuidanceStepIndex(null);
    const nextSection = openOverviewSection();
    setStatusMessage(`${nextSection} opened.`);
    trackClientEvent("onboarding_skipped", { destination: nextSection });
    return true;
  }

  return {
    guidanceStep,
    guidanceStepCount: availableGuidanceSteps.length,
    guidanceStepIndex,
    handleDeclineGuidance,
    handleNextGuidance,
    handlePreviousGuidance,
    handleSkipGuidance,
    handleStartGuidance,
    showOnboardingPrompt
  };
}
