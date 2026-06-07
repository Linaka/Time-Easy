import { useCallback, useLayoutEffect, useRef, useState } from "react";

export function useFloatingPicker() {
  const [openPicker, setOpenPicker] = useState(null);
  const [pickerStyle, setPickerStyle] = useState(null);
  const projectButtonRef = useRef(null);
  const periodButtonRef = useRef(null);
  const pickerRef = useRef(null);

  function togglePicker(picker) {
    setOpenPicker((current) => (current === picker ? null : picker));
  }

  const updatePickerPosition = useCallback(() => {
    if (!openPicker || typeof window === "undefined") {
      return;
    }

    const anchor = openPicker === "project" ? projectButtonRef.current : periodButtonRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;
    const gap = 8;
    const width = Math.min(240, viewportWidth - margin * 2);
    const measuredHeight = Math.max(pickerRef.current?.getBoundingClientRect().height || 0, 240);
    const availableBelow = viewportHeight - rect.bottom - gap - margin;
    const availableAbove = rect.top - gap - margin;
    const placeAbove = availableBelow < measuredHeight && availableAbove > availableBelow;
    const availableHeight = Math.max(180, placeAbove ? availableAbove : availableBelow);
    const height = Math.min(measuredHeight, availableHeight, viewportHeight - margin * 2);
    const left = Math.min(
      Math.max(margin, rect.right - width),
      Math.max(margin, viewportWidth - width - margin)
    );
    const preferredTop = placeAbove ? rect.top - gap - height : rect.bottom + gap;
    const top = Math.min(
      Math.max(margin, preferredTop),
      Math.max(margin, viewportHeight - height - margin)
    );

    setPickerStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `${height}px`
    });
  }, [openPicker]);

  useLayoutEffect(() => {
    if (!openPicker) {
      return undefined;
    }

    function handleViewportChange() {
      updatePickerPosition();
      window.requestAnimationFrame(updatePickerPosition);
    }

    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [openPicker, updatePickerPosition]);

  return {
    openPicker,
    periodButtonRef,
    pickerRef,
    pickerStyle,
    projectButtonRef,
    setOpenPicker,
    togglePicker
  };
}
