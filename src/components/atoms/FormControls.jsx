import React, {
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
  Clock3,
  Filter
} from "lucide-react";
import { cx } from "../classNames.js";
import { useAnchoredPopover } from "./useAnchoredPopover.js";
import styles from "./FormControls.module.css";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
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

function buildTimeOptions(stepMinutes) {
  const safeStepMinutes = Number.isFinite(Number(stepMinutes)) && Number(stepMinutes) > 0
    ? Number(stepMinutes)
    : 15;
  const optionCount = Math.ceil((24 * 60) / safeStepMinutes);

  return Array.from({ length: optionCount }, (_, index) => {
    const minutesFromMidnight = Math.min(index * safeStepMinutes, (24 * 60) - 1);
    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = minutesFromMidnight % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  });
}

function getTimeOptions(value, stepMinutes) {
  const options = buildTimeOptions(stepMinutes);
  if (TIME_VALUE_PATTERN.test(String(value || "")) && !options.includes(value)) {
    return [...options, value].sort();
  }

  return options;
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
  placeholder = "YYYY-MM-DD",
  title = "Use YYYY-MM-DD format.",
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
  const { popoverStyle } = useAnchoredPopover({
    controlRef,
    fallbackHeight: 360,
    minAvailableHeight: 236,
    minWidth: 292,
    open,
    popoverRef,
    positionKey: viewDate
  });
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
        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
        placeholder={placeholder}
        title={title}
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

export function TimeInput({
  id,
  value,
  onChange,
  className,
  disabled,
  stepMinutes = 15,
  onClick,
  onFocus,
  onKeyDown,
  ...inputProps
}) {
  const generatedId = useId();
  const controlId = id || `time-input-${generatedId}`;
  const pickerId = `${controlId}-picker`;
  const controlRef = useRef(null);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { popoverStyle } = useAnchoredPopover({
    controlRef,
    fallbackHeight: 260,
    minAvailableHeight: 180,
    minWidth: 220,
    open,
    popoverRef
  });
  const options = useMemo(() => getTimeOptions(value, stepMinutes), [stepMinutes, value]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    window.requestAnimationFrame(() => {
      selectedOptionRef.current?.scrollIntoView({ block: "nearest" });
    });
  }, [open, value]);

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

    function handleDocumentKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [open]);

  function openPicker() {
    if (!disabled) {
      setOpen(true);
    }
  }

  function handleSelectTime(nextValue) {
    onChange(nextValue);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleInputKeyDown(event) {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  const picker = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popoverRef}
          id={pickerId}
          role="dialog"
          aria-label="Choose time"
          className={styles["time-picker"]}
          style={popoverStyle || undefined}
        >
          <div role="listbox" aria-label="Time options" className={styles["time-picker__list"]}>
            {options.map((option) => {
              const selected = option === value;
              return (
                <button
                  key={option}
                  ref={selected ? selectedOptionRef : null}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelectTime(option)}
                  className={cx(
                    styles["time-picker__option"],
                    selected ? styles["time-picker__option--selected"] : null
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={controlRef} className={styles["time-input"]}>
      <input
        {...inputProps}
        ref={inputRef}
        id={controlId}
        type="time"
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => {
          onFocus?.(event);
          openPicker();
        }}
        onClick={(event) => {
          onClick?.(event);
          openPicker();
        }}
        onKeyDown={handleInputKeyDown}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? pickerId : undefined}
        className={cx(styles["time-input__control"], className)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          openPicker();
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={styles["time-input__button"]}
        aria-label="Choose time"
        aria-expanded={open}
        aria-controls={open ? pickerId : undefined}
      >
        <Clock3 className={styles["time-input__icon"]} aria-hidden="true" />
      </button>
      {picker}
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
