import React from "react";

export function RowActions({ primaryLabel, primaryIcon: PrimaryIcon, primaryDisabled, onPrimary, secondaryLabel, secondaryIcon: SecondaryIcon, onSecondary }) {
  return (
    <div className="flex flex-wrap gap-2">
      {onPrimary ? (
        <button
          type="button"
          disabled={primaryDisabled}
          onClick={onPrimary}
          className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border border-transparent bg-black px-4 text-xs font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PrimaryIcon ? <PrimaryIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {primaryLabel}
        </button>
      ) : null}
      {onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border border-transparent bg-brand-100 px-4 text-xs font-medium text-black hover:bg-brand-200"
        >
          {SecondaryIcon ? <SecondaryIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
