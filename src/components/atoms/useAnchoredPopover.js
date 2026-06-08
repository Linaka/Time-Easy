import {
  useCallback,
  useLayoutEffect,
  useState
} from "react";

export function useAnchoredPopover({
  controlRef,
  fallbackHeight,
  minAvailableHeight,
  minWidth,
  open,
  popoverRef,
  positionKey
}) {
  const [popoverStyle, setPopoverStyle] = useState(null);

  const updatePopoverPosition = useCallback(() => {
    const control = controlRef.current;
    if (!control || typeof window === "undefined") {
      return;
    }

    const rect = control.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;
    const gap = 8;
    const width = Math.min(Math.max(rect.width, minWidth), viewportWidth - margin * 2);
    const measuredHeight = Math.max(
      popoverRef.current?.getBoundingClientRect().height || 0,
      fallbackHeight
    );
    const availableBelow = viewportHeight - rect.bottom - gap - margin;
    const availableAbove = rect.top - gap - margin;
    const placeAbove = availableBelow < measuredHeight && availableAbove > availableBelow;
    const availableHeight = Math.max(
      minAvailableHeight,
      placeAbove ? availableAbove : availableBelow
    );
    const visibleHeight = Math.min(availableHeight, viewportHeight - margin * 2);
    const left = Math.min(
      Math.max(margin, rect.left),
      Math.max(margin, viewportWidth - width - margin)
    );
    const preferredTop = placeAbove
      ? rect.top - gap - Math.min(measuredHeight, availableHeight)
      : rect.bottom + gap;
    const top = Math.min(
      Math.max(margin, preferredTop),
      Math.max(margin, viewportHeight - visibleHeight - margin)
    );

    setPopoverStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `${visibleHeight}px`
    });
  }, [controlRef, fallbackHeight, minAvailableHeight, minWidth, popoverRef]);

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleViewportChange() {
      updatePopoverPosition();
      window.requestAnimationFrame(updatePopoverPosition);
    }

    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, positionKey, updatePopoverPosition]);

  return {
    popoverStyle,
    updatePopoverPosition
  };
}
