import React from "react";

export function PrimaryButton({ type = "button", icon: Icon, onClick, children }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-800"
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-transparent bg-brand-100 px-4 text-sm font-medium text-black hover:bg-brand-200"
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
