import React from "react";
import { formatRelativeTime } from "../../domain/dateUtils.js";

export function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-brand-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#5e5e5e]">{label}</p>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-black">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold leading-8 text-black">{value}</p>
      <p className="mt-1 text-sm text-[#5e5e5e]">{helper}</p>
    </article>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead>
          <tr className="border-b border-brand-200 bg-white text-left text-xs font-medium uppercase text-[#5e5e5e]">
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${columns.join("-")}`} className="bg-white hover:bg-brand-50">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-4 text-sm text-black">
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[#5e5e5e]">
                No records match this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityList({ items }) {
  return (
    <ol className="divide-y divide-slate-100">
      {items.length ? items.map((item) => (
        <li key={item.id} className="flex gap-3 px-4 py-4 sm:px-5">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-black" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-black">{item.description}</p>
            <p className="mt-1 text-xs text-[#5e5e5e]">{item.type} · {item.actor} · {formatRelativeTime(item.timestamp)}</p>
          </div>
        </li>
      )) : (
        <li className="px-4 py-10 text-center text-sm text-[#5e5e5e]">No activity yet.</li>
      )}
    </ol>
  );
}
