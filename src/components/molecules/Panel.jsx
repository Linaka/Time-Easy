import React from "react";
import { slugify } from "../../domain/formUtils.js";

export function Panel({ title, subtitle, action, children }) {
  return (
    <section aria-labelledby={slugify(title)} className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-brand-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 id={slugify(title)} className="text-lg font-bold leading-7 text-black">{title}</h2>
          {subtitle ? <p className="text-sm text-[#5e5e5e]">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
