import React from "react";
import { DollarSign, ShieldCheck } from "lucide-react";
import { formatMargin } from "../../domain/formatters.js";
import { projectStyle } from "../../domain/projectUtils.js";

export function ProjectBadge({ project }) {
  const style = projectStyle(project);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <span className="sr-only">{project.name} project colour marker.</span>
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${style.text}`}>{project.name}</p>
        <p className="truncate text-xs text-[#5e5e5e]">{project.client}</p>
      </div>
    </div>
  );
}

export function TagList({ tags, showEmpty = false }) {
  if (!tags?.length) {
    return showEmpty ? (
      <span className="text-sm text-[#5e5e5e]">No tags</span>
    ) : (
      <span className="sr-only">No tags</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-transparent bg-brand-100 px-2.5 py-1 text-xs font-medium text-black">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function BillableBadge({ billable }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${
      billable ? "border-transparent bg-black text-white" : "border-transparent bg-brand-100 text-black"
    }`}>
      {billable ? <DollarSign className="h-3.5 w-3.5" aria-hidden="true" /> : <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
      {billable ? "Billable" : "Internal"}
    </span>
  );
}

export function StatusBadge({ status }) {
  const normalized = status || "Draft";
  const classes = {
    Active: "border-transparent bg-black text-white",
    Approved: "border-transparent bg-black text-white",
    Paid: "border-transparent bg-black text-white",
    Published: "border-transparent bg-black text-white",
    Pending: "border-transparent bg-brand-100 text-black",
    Planned: "border-transparent bg-brand-100 text-black",
    Completed: "border-transparent bg-brand-100 text-black",
    Archived: "border-transparent bg-brand-100 text-[#5e5e5e]",
    Inactive: "border-transparent bg-brand-100 text-[#5e5e5e]",
    Rejected: "border-transparent bg-brand-100 text-black"
  };
  return (
    <span className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs font-semibold ${classes[normalized] || classes.Planned}`}>
      {normalized}
    </span>
  );
}

export function MarginBadge({ value }) {
  if (value === null) {
    return (
      <span className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600">
        N/A
      </span>
    );
  }

  const classes =
    value >= 40
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value >= 20
        ? "border-transparent bg-black text-white"
        : value >= 0
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-red-200 bg-red-50 text-red-700";

  return (
    <span className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs font-semibold ${classes}`}>
      {formatMargin(value)}
    </span>
  );
}
