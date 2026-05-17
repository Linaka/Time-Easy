import React from "react";
import { Filter } from "lucide-react";

export function FormField({ label, htmlFor, helper, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
}

export function Select({ id, value, onChange, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="focus-ring min-h-11 w-full rounded-md border border-transparent bg-brand-100 px-4 text-sm text-black"
    >
      {children}
    </select>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 text-sm font-medium text-black">
      <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring border-0 bg-transparent text-sm outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
