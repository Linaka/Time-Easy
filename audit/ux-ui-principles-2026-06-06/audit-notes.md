# Laws of UX and UI Principles Audit

Date: 2026-06-06
App: Creative Operations / TimeEasy
Audit mode: UX, UI, and screenshot-based accessibility review
Update: refactor-aware amendment pass completed on 2026-06-06

## Audit Scope

This audit reviews the visible application experience in the local React app. The original capture used `http://127.0.0.1:5173/`; the refactor/amendment verification used `http://127.0.0.1:5174/` because 5173 was already occupied.

The refactor split the app shell into smaller organisms, CSS modules, and `src/pages/AppPages.jsx`. The amendments below work with that new structure.

Evidence captured:

1. `01-time-tracker-desktop.png` - Time Tracker desktop
2. `02-reports-desktop.png` - Reports desktop
3. `03-schedule-desktop-viewport.png` - Schedule desktop
4. `04-settings-panel-desktop.png` - Settings utility panel
5. `05-time-tracker-mobile.png` - Time Tracker at 390px width
6. `06-reports-mobile-viewport.png` - Reports at 390px width
7. `07-validation-error-desktop.png` - Time Tracker validation error
8. `08-amended-time-tracker-mobile.png` - Amended Time Tracker mobile top
9. `09-amended-reports-mobile.png` - Amended Reports mobile top
10. `10-amended-time-entry-cards-mobile.png` - Amended mobile time-entry cards
11. `11-amended-report-cards-mobile.png` - Amended mobile report data cards
12. `12-amended-settings-desktop.png` - Amended utility panel semantics and sizing

Evidence limits:

- This is not a full WCAG audit. Keyboard flow, screen reader output, zoom behavior, and drag-and-drop alternatives need manual assistive technology testing.
- Screenshots were captured against seeded local data. Findings may shift with larger real datasets.
- No production analytics or user behavior data was available, so prioritization is based on expected task frequency and severity.

## Flow Steps

1. Time Tracker desktop - Healthy overall. The primary time-entry task is prominent and the current week list is scannable. Target sizes were improved after the refactor.
2. Reports desktop - Healthy with medium complexity. Metrics and filters are grouped well, though eight filters remain visible upfront.
3. Schedule desktop - Improved but still complex. Drop-zone contrast and tiny assignment controls were amended, but the Gantt surface remains cognitively dense.
4. Settings panel - Amended. Settings remain in a clear utility panel and now use non-modal region semantics instead of dialog semantics.
5. Time Tracker mobile - Improved. Mobile navigation is now a grouped selector and time entries render as cards instead of clipped desktop tables.
6. Reports mobile - Improved. The page now starts with report-specific work instead of an app-wide quick-clock panel.
7. Validation state - Healthy. The inline error is immediate, local to the field, and uses `aria-invalid`/`aria-describedby`.

## Strengths

- Strong information scent on desktop: the sidebar groups navigation into Track, Manage, and Review, which supports recognition over recall.
- Good mapping between task and UI hierarchy: the Time Tracker page puts the main entry form first, then current work history.
- Clear feedback loops: timers use live regions, route changes update title/focus, validation is inline, and report filters summarize the active state.
- Consistent component language: panels, metric cards, badges, tables, and buttons create a cohesive operating-system feel.
- Accessible foundations are present in code: skip link, semantic landmarks, labelled icon buttons, table captions, `aria-current`, and focus rings.

## Findings

### 1. Hick's Law: too many visible choices on mobile

Status: Amended.

Evidence: `05-time-tracker-mobile.png`, `06-reports-mobile-viewport.png`

Original issue: the mobile primary nav exposed 13 destinations in one horizontal strip. In the Reports mobile screenshot, the nav was scrolled so earlier destinations were partially offscreen.

Amendment: mobile navigation now uses one grouped native selector with `optgroup` categories, while desktop keeps the grouped sidebar.

Code reference: `src/components/organisms/Sidebar.jsx` lines 61-80 and `src/components/organisms/Sidebar.module.css`.

Recommendation:

- Replace the mobile strip with a compact section switcher, bottom navigation for 3-5 core destinations, or a grouped menu.
- Keep the current desktop sidebar grouping, but preserve group labels on mobile through menu sections.
- Consider task-priority ordering: Track Time, Timesheet, Reports, Approvals, More.

### 2. Fitts's Law: several frequent controls are below common touch target guidance

Status: Amended for audited controls.

Evidence: `01-time-tracker-desktop.png`, `05-time-tracker-mobile.png`

Original issue: measured visible interactive targets included 32px quick-clock controls, 40px utility buttons, 40px sidebar/nav buttons, and 40px row action buttons.

Code references:

- Header quick clock: `src/components/organisms/QuickClock.module.css` lines 1-25
- Utility buttons: `src/components/organisms/TopBar.module.css`
- Sidebar nav: `src/components/organisms/Sidebar.module.css`
- Entry actions and editable page controls: `src/pages/AppPages.jsx`

Amendment:

- Frequent controls now use a 44px floor via `min-h-11`/`min-w-11`.
- Non-interactive badges remain smaller, which is acceptable because they are not touch targets.

### 3. Jakob's Law and recognition: icon-only controls need stronger visible meaning

Evidence: `01-time-tracker-desktop.png`, `03-schedule-desktop-viewport.png`

The main time-entry bar contains a dollar icon, reset icon, and ellipsis. Row actions use play and ellipsis. These have accessible labels and tooltips, which is good, but visually they require learning. The schedule assignment cards also truncate key information like names and time ranges, making recognition harder.

Code references:

- Time-entry icon controls: `src/pages/AppPages.jsx`
- Schedule card/grid density: `src/pages/AppPages.jsx`

Recommendation:

- Keep icon-only controls for secondary actions, but make the primary action visibly labelled.
- For business-critical schedule cards, show full person, time, status, and project on hover/focus or at wider cell widths.
- Use labelled segmented controls for modes like billing/manual entry where the state affects downstream reporting.

### 4. Gestalt similarity: pills are doing too many jobs

Evidence: `01-time-tracker-desktop.png`, `02-reports-desktop.png`

Pill shapes represent actions, statuses, filters, totals, badges, project labels, and toolbar controls. This creates a polished but slightly ambiguous visual system: users must read every pill instead of recognizing type by shape.

Recommendation:

- Reserve filled black pills for primary actions and confirmed statuses.
- Use outlined chips for filters/tags.
- Use square-ish controls for inputs and settings.
- Use neutral labels without heavy pill treatment for metadata like currency, invoice state, or project tags.

### 5. Progressive disclosure: Quick Clock competes with page-specific work on mobile

Status: Amended.

Evidence: `06-reports-mobile-viewport.png`

Original issue: on mobile Reports, the quick clock appeared before report filters and metrics. That meant a report user saw the app-wide quick clock before the page-specific task.

Amendment: `QuickClockPanel` is now shown only on Time Tracker. Reports starts with report filters and page metrics.

Code reference: `src/components/templates/AppLayout.jsx` lines 49 and 101-112.

### 6. Responsive reflow: tables and schedule grids overflow rather than adapting

Status: Partially amended.

Evidence: `05-time-tracker-mobile.png`, `06-reports-mobile-viewport.png`

Original issue: mobile Time Tracker kept a desktop table structure, causing time ranges to clip and actions to move offscreen. Shared report tables depended on horizontal overflow.

Code references:

- Time entries: `src/pages/AppPages.jsx` lines 484-565
- Shared data table labels/cards: `src/components/molecules/DataDisplay.jsx` lines 20-54 and `src/components/molecules/DataDisplay.module.css` lines 61-94
- Schedule timeline still uses a wide planning grid.

Amendment:

- Time Tracker entries now render as mobile cards.
- Shared `DataTable` rows now render as labelled mobile cards below 640px.
- Remaining recommendation: add a Schedule agenda/list mode for mobile and keep Gantt planning for larger screens.

### 7. Accessibility risk: utility panel semantics are ambiguous

Status: Amended.

Evidence: `04-settings-panel-desktop.png`

Original issue: the settings panel was visually a popover anchored to the header, but used `role="dialog"` with `aria-modal="false"`.

Amendment: the utility panel now uses `role="region"` with `aria-labelledby`, matching its non-modal popover behavior.

Code reference: `src/components/organisms/UtilityPanel.jsx` lines 31-35.

### 8. Accessibility risk: low-contrast secondary text in planning surfaces

Status: Amended for visible drop-zone text.

Evidence: `03-schedule-desktop-viewport.png`

Original issue: the "Drop here" placeholders used very light secondary text. Approximate contrast for Tailwind `slate-400` on white is 2.56:1, below WCAG AA for normal text.

Amendment: the drop-zone text now uses `text-slate-600`, and the schedule assignment controls/menu rows use larger target sizes.

Code reference: `src/pages/AppPages.jsx` lines 1688-1690 and the Gantt assignment controls.

## Priority Recommendations

1. Rework Schedule as two modes: desktop Gantt for planning, mobile agenda/list for execution.
2. Reduce visual ambiguity by separating actions, filters, statuses, and metadata into distinct component styles.
3. Consider progressive disclosure for Reports filters after the first few high-frequency filters.
4. Verify the new mobile navigation selector, card tables, and utility panel with keyboard and screen reader testing.
5. Keep target sizes at 44px or larger for any new interactive controls.

## Amendments Applied

- Replaced mobile horizontal navigation with a grouped section selector.
- Hid the mobile Quick Clock panel outside Time Tracker.
- Added mobile cards for Time Tracker entries.
- Added labelled mobile-card behavior to the shared `DataTable`.
- Increased common interactive target sizes to a 44px floor.
- Changed the utility panel from non-modal dialog semantics to labelled region semantics.
- Raised Schedule drop-zone text contrast and enlarged assignment-card controls.
