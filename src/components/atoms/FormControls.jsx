import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { cx } from "../classNames.js";
import styles from "./FormControls.module.css";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  if (!DATE_KEY_PATTERN.test(String(dateKey || ""))) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function buildCalendarDays(viewDate) {
  const firstOfMonth = getStartOfMonth(viewDate);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      dateKey: getDateKey(date),
      isCurrentMonth: date.getMonth() === viewDate.getMonth()
    };
  });
}

export function FormField({ label, htmlFor, helper, children }) {
  return (
    <div className={styles["form-field"]}>
      <label htmlFor={htmlFor} className={styles["form-field__label"]}>
        {label}
      </label>
      {children}
      {helper ? <p className={styles["form-field__helper"]}>{helper}</p> : null}
    </div>
  );
}

export function Select({ id, value, onChange, children, className, ...selectProps }) {
  return (
    <select
      {...selectProps}
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cx(styles.select, className)}
    >
      {children}
    </select>
  );
}

export function DateInput({
  id,
  value,
  onChange,
  className,
  min,
  max,
  disabled,
  ...inputProps
}) {
  const generatedId = useId();
  const controlId = id || `date-input-${generatedId}`;
  const calendarId = `${controlId}-calendar`;
  const controlRef = useRef(null);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  const selectedDate = useMemo(() => parseDateKey(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => getStartOfMonth(selectedDate || new Date()));
  const [popoverStyle, setPopoverStyle] = useState(null);
  const todayKey = getDateKey(new Date());
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(viewDate),
    [viewDate]
  );

  useEffect(() => {
    if (selectedDate && !open) {
      setViewDate(getStartOfMonth(selectedDate));
    }
  }, [open, selectedDate]);

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
    const width = Math.min(Math.max(rect.width, 292), viewportWidth - margin * 2);
    const measuredHeight = Math.max(popoverRef.current?.getBoundingClientRect().height || 0, 360);
    const availableBelow = viewportHeight - rect.bottom - gap - margin;
    const availableAbove = rect.top - gap - margin;
    const placeAbove = availableBelow < measuredHeight && availableAbove > availableBelow;
    const availableHeight = Math.max(236, placeAbove ? availableAbove : availableBelow);
    const left = Math.min(
      Math.max(margin, rect.left),
      Math.max(margin, viewportWidth - width - margin)
    );
    const preferredTop = placeAbove
      ? rect.top - gap - Math.min(measuredHeight, availableHeight)
      : rect.bottom + gap;
    const top = Math.min(
      Math.max(margin, preferredTop),
      Math.max(margin, viewportHeight - Math.min(measuredHeight, availableHeight) - margin)
    );

    setPopoverStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `${Math.min(availableHeight, viewportHeight - margin * 2)}px`
    });
  }, []);

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
  }, [open, updatePopoverPosition, viewDate]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      const target = event.target;
      if (
        controlRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelectDate(nextDateKey) {
    onChange(nextDateKey);
    setOpen(false);
    inputRef.current?.focus();
  }

  function isDateDisabled(dateKey) {
    return Boolean((min && dateKey < min) || (max && dateKey > max));
  }

  const calendar = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popoverRef}
          id={calendarId}
          role="dialog"
          aria-label="Choose date"
          className={styles["date-picker"]}
          style={popoverStyle || undefined}
        >
          <div className={styles["date-picker__header"]}>
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, -1))}
              className={styles["date-picker__nav-button"]}
              aria-label="Previous month"
            >
              <ChevronLeft className={styles["date-picker__nav-icon"]} aria-hidden="true" />
            </button>
            <p className={styles["date-picker__month"]} aria-live="polite">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, 1))}
              className={styles["date-picker__nav-button"]}
              aria-label="Next month"
            >
              <ChevronRight className={styles["date-picker__nav-icon"]} aria-hidden="true" />
            </button>
          </div>
          <div className={styles["date-picker__weekdays"]} aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className={styles["date-picker__grid"]}>
            {days.map((day) => {
              const isSelected = day.dateKey === value;
              const disabledDay = isDateDisabled(day.dateKey);
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => handleSelectDate(day.dateKey)}
                  disabled={disabledDay}
                  aria-pressed={isSelected}
                  aria-label={new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  }).format(day.date)}
                  className={cx(
                    styles["date-picker__day"],
                    day.isCurrentMonth
                      ? styles["date-picker__day--current-month"]
                      : styles["date-picker__day--adjacent-month"],
                    day.dateKey === todayKey ? styles["date-picker__day--today"] : null,
                    isSelected ? styles["date-picker__day--selected"] : null
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={controlRef} className={styles["date-input"]}>
      <input
        {...inputProps}
        ref={inputRef}
        id={controlId}
        type="text"
        inputMode="numeric"
        pattern="\\d{4}-\\d{2}-\\d{2}"
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
        className={cx(styles["date-input__control"], className)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setViewDate(getStartOfMonth(selectedDate || new Date()));
          setOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) {
              window.requestAnimationFrame(() => inputRef.current?.focus());
            }
            return nextOpen;
          });
        }}
        className={styles["date-input__button"]}
        aria-label="Choose date"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
      >
        <CalendarDays className={styles["date-input__icon"]} aria-hidden="true" />
      </button>
      {calendar}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className={styles["filter-select"]}>
      <Filter className={styles["filter-select__icon"]} aria-hidden="true" />
      <span className={styles["filter-select__label"]}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={styles["filter-select__control"]}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
