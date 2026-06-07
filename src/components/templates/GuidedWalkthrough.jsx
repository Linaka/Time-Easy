import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  LayoutDashboard,
  X
} from "lucide-react";
import { cx } from "../classNames.js";
import styles from "./GuidedWalkthrough.module.css";

export function GuidedWalkthrough({
  promptOpen,
  step,
  stepCount,
  stepIndex,
  onBack,
  onDecline,
  onNext,
  onSkip,
  onStart
}) {
  const dialogRef = useRef(null);
  const [targetRect, setTargetRect] = useState(null);
  const isTourOpen = Boolean(step);
  const isOpen = promptOpen || isTourOpen;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }));
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (promptOpen) {
          onDecline();
          return;
        }
        onSkip();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onDecline, onSkip, promptOpen]);

  useEffect(() => {
    if (!step?.targetId || !isTourOpen) {
      setTargetRect(null);
      return undefined;
    }

    let frameId = 0;
    const selector = `[data-guidance-target="${step.targetId}"]`;

    function updateTargetRect() {
      const target = document.querySelector(selector);
      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const inset = 8;
      setTargetRect({
        height: Math.max(40, rect.height + inset * 2),
        left: Math.max(8, rect.left - inset),
        top: Math.max(8, rect.top - inset),
        width: Math.min(window.innerWidth - 16, rect.width + inset * 2)
      });
    }

    function scheduleUpdate() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTargetRect);
    }

    const target = document.querySelector(selector);
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
      inline: "nearest"
    });

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [isTourOpen, step]);

  if (!isOpen) {
    return null;
  }

  const finalStep = isTourOpen && stepIndex === stepCount - 1;

  return (
    <div className={styles["guided-walkthrough"]}>
      {targetRect ? (
        <div
          className={styles["guided-walkthrough__highlight"]}
          style={{
            height: `${targetRect.height}px`,
            left: `${targetRect.left}px`,
            top: `${targetRect.top}px`,
            width: `${targetRect.width}px`
          }}
          aria-hidden="true"
        />
      ) : (
        <div className={styles["guided-walkthrough__scrim"]} aria-hidden="true" />
      )}

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-walkthrough-title"
        aria-describedby="guided-walkthrough-body"
        tabIndex={-1}
        className={cx(
          styles["guided-walkthrough__dialog"],
          isTourOpen ? styles["guided-walkthrough__dialog--tour"] : null
        )}
      >
        {promptOpen ? (
          <PromptContent onDecline={onDecline} onStart={onStart} />
        ) : (
          <TourContent
            finalStep={finalStep}
            onBack={onBack}
            onNext={onNext}
            onSkip={onSkip}
            step={step}
            stepCount={stepCount}
            stepIndex={stepIndex}
          />
        )}
      </section>
    </div>
  );
}

function PromptContent({ onDecline, onStart }) {
  return (
    <>
      <div className={styles["guided-walkthrough__kicker"]}>
        <Compass className={styles["guided-walkthrough__kicker-icon"]} aria-hidden="true" />
        First Load
      </div>
      <h2 id="guided-walkthrough-title" className={styles["guided-walkthrough__title"]}>
        Would you like a walkthrough?
      </h2>
      <p id="guided-walkthrough-body" className={styles["guided-walkthrough__body"]}>
        A short guided pass can highlight the main areas and open each section for you.
      </p>
      <div className={styles["guided-walkthrough__actions"]}>
        <button
          type="button"
          onClick={onStart}
          className={cx(
            styles["guided-walkthrough__button"],
            styles["guided-walkthrough__button--primary"]
          )}
        >
          <Compass className={styles["guided-walkthrough__button-icon"]} aria-hidden="true" />
          Show Me Around
        </button>
        <button
          type="button"
          onClick={onDecline}
          className={cx(
            styles["guided-walkthrough__button"],
            styles["guided-walkthrough__button--ghost"]
          )}
        >
          <LayoutDashboard className={styles["guided-walkthrough__button-icon"]} aria-hidden="true" />
          Go To Overview
        </button>
      </div>
    </>
  );
}

function TourContent({
  finalStep,
  onBack,
  onNext,
  onSkip,
  step,
  stepCount,
  stepIndex
}) {
  return (
    <>
      <div className={styles["guided-walkthrough__topline"]}>
        <div className={styles["guided-walkthrough__kicker"]}>
          Step {stepIndex + 1} Of {stepCount}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className={styles["guided-walkthrough__icon-button"]}
          aria-label="Skip walkthrough"
        >
          <X className={styles["guided-walkthrough__button-icon"]} aria-hidden="true" />
        </button>
      </div>
      <h2 id="guided-walkthrough-title" className={styles["guided-walkthrough__title"]}>
        {step.title}
      </h2>
      <p id="guided-walkthrough-body" className={styles["guided-walkthrough__body"]}>
        {step.body}
      </p>
      <div className={styles["guided-walkthrough__steps"]} aria-hidden="true">
        {Array.from({ length: stepCount }, (_, index) => (
          <span
            key={index}
            className={cx(
              styles["guided-walkthrough__step-dot"],
              index === stepIndex ? styles["guided-walkthrough__step-dot--active"] : null
            )}
          />
        ))}
      </div>
      <div className={styles["guided-walkthrough__actions"]}>
        <button
          type="button"
          onClick={onBack}
          disabled={stepIndex === 0}
          className={cx(
            styles["guided-walkthrough__button"],
            styles["guided-walkthrough__button--ghost"]
          )}
        >
          <ArrowLeft className={styles["guided-walkthrough__button-icon"]} aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className={cx(
            styles["guided-walkthrough__button"],
            styles["guided-walkthrough__button--primary"]
          )}
        >
          {finalStep ? (
            <Check className={styles["guided-walkthrough__button-icon"]} aria-hidden="true" />
          ) : (
            <ArrowRight className={styles["guided-walkthrough__button-icon"]} aria-hidden="true" />
          )}
          {finalStep ? "Finish" : "Next"}
        </button>
      </div>
    </>
  );
}
