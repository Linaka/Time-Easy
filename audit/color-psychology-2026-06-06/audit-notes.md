# Colour Psychology Audit

Date: 2026-06-06

Scope: Soft Studio theme, semantic status colours, project/category colours, raw Tailwind utility colour use, and live UI hierarchy across Time Tracker, Timesheet, Schedule, Expenses, Time Off, Kiosks, Reports, Projects, Team, Overview, Activity, and Approvals.

## Method

- Reviewed theme tokens in `src/components/templates/AppLayout.module.css`.
- Searched source for hard-coded and Tailwind colour utilities that bypass theme semantics.
- Sampled computed styles in the in-app browser at `http://127.0.0.1:5175/`.
- Calculated contrast for the main Soft Studio foreground/background pairs.

## Executive Readout

The Soft Studio theme is now directionally right: the base environment is warm neutral, primary actions are teal, approval/success is green, pending/caution is amber, danger is red, and secondary surfaces are muted sage-grey. The previous "red start button" problem is resolved in the live UI.

The remaining issue is not contrast. The main hierarchy problem is meaning drift: green currently means both terminal success and revenue classification, teal means both primary action and informational status, and project colours sometimes sit too close to semantic colours. This can make the user read category, status, and action with the same emotional weight.

## Current Psychology Map

| Role | Current Soft Studio colour | Intended psychology | Audit judgement |
| --- | --- | --- | --- |
| Page environment | `#f7f5ef` | Warm, quiet, low stress | Good. It no longer competes with success green. |
| Surface | `#fffdfa` | Clean workspace, focus | Good. Keeps cards calm without feeling stark. |
| Muted surface | `#ebece4` / `#f0f1ea` | Secondary grouping | Good. Distinct from success green when paired with borders/text. |
| Body text | `#20312f` | Stable, grounded, work-focused | Good. High readability. |
| Primary action / active nav | `#2e6970` | Agency, calm confidence, "do this" | Good for Start, Clock in, Save, Export, active nav. |
| Focus | `#0f766e` | Interaction affordance | Good, visible and on-theme. |
| Success | `#dff3e5`, `#175f35`, `#237a43` | Approved, safe, complete, paid | Good, but overused for Billable. |
| Warning | `#fff3d8`, `#7a5010`, `#a96c16` | Pending, caution, not final | Good for Pending and Clock out. |
| Danger | `#fff0ed`, `#973a2f`, `#b94f3f` | Reject, delete, urgent action | Good, but some screens still use raw Tailwind red. |
| Info | `#e5f3f4`, `#2e6970`, `#397b80` | Active, published, informational | Usable, but too close to primary action. |
| Project/category colours | Teal, violet, orange, slate | Identity/categorisation | Useful, but several collide with action/status meanings. |

## Live UI Evidence

Computed colour samples from the running app:

- Primary actions: `Start`, `Start quick clock`, `START`, `Clock in`, `Preview import`, `Submit request`, and active navigation render in teal `rgb(46, 105, 112)`.
- Approval actions: `Approve` and `Mark paid` render as success green `rgb(35, 122, 67)`.
- Positive statuses: `Approved`, `Paid`, `Completed`, and high percentages render with success background `rgb(223, 243, 229)` and text `rgb(23, 95, 53)`.
- Warning states: `Pending` and `Clock out` render with amber background `rgb(255, 243, 216)` and text `rgb(122, 80, 16)`.
- Danger states: `Reject` renders with danger background `rgb(255, 240, 237)` and text `rgb(151, 58, 47)`. The notification count renders as red `rgb(185, 79, 63)`.
- Informational statuses: `Published` and `Active` render with info background `rgb(229, 243, 244)` and teal text `rgb(46, 105, 112)`.
- Project markers use categorical colours including teal `rgb(46, 105, 112)`, violet `rgb(124, 58, 237)`, orange `rgb(249, 115, 22)`, and slate `rgb(100, 116, 139)`.

## Contrast Check

All sampled Soft Studio token pairs passed normal-text contrast thresholds:

| Pair | Contrast |
| --- | ---: |
| Primary teal on off-white | 6.01 |
| Primary hover teal on off-white | 7.69 |
| Body text on page | 12.49 |
| Muted text on surface | 4.91 |
| Text on muted surface | 11.45 |
| Success badge | 6.64 |
| Success button | 5.27 |
| Warning badge | 6.39 |
| Danger badge | 6.39 |
| Danger button / notification | 4.76 |
| Info badge | 5.48 |

## Findings

### 1. Green Has Too Many Jobs

Severity: High

`Approved`, `Paid`, `Completed`, and `Billable` currently share the same success treatment. Psychologically, this makes green mean both "this has passed a judgement" and "this entry has a revenue classification." In Time Tracker rows, `Billable` and `Approved` often appear side by side with identical green badges, which flattens hierarchy.

Recommendation: reserve success green for terminal positive outcomes: `Approved`, `Paid`, `Completed`, and high margin/target achievement. Move `Billable` to an info/revenue treatment or neutral treatment with a currency icon. Suggested role: `revenue` with a blue-teal or neutral-sage badge, not success green.

### 2. Teal Is Carrying Primary, Active, Info, And Some Projects

Severity: High

The same teal family appears on primary buttons, active navigation, focus, info statuses, and ACME/project markers. It reads calm and professional, but the hierarchy can blur because "click this", "you are here", "this is published/active", and "this project category" can look emotionally similar.

Recommendation: keep `#2e6970` for primary action and active navigation. Shift info statuses slightly cooler or softer, for example a steel-blue info family, and avoid mapping project markers to the primary accent.

### 3. Project Colours Collide With Semantic Colours

Severity: High

Project markers are categorical, not psychological status. Orange project markers can read like warning. Teal project markers can read like primary action or active state. Violet is safely categorical. Slate is neutral and safe.

Recommendation: keep project colours small and categorical only. Use them as dots, strips, or progress fills, not as status badges. Keep project names in neutral text where possible. Consider a Soft Studio project palette that deliberately avoids the semantic success/warning/danger colours.

### 4. Broad Theme Overrides Hide Implementation Debt

Severity: Medium

Soft Studio remaps utilities such as `.bg-black`, `.bg-brand-600`, `.bg-brand-800`, and `.bg-slate-900` to the theme accent. This is why old black buttons now look teal, which is useful, but it is brittle: new components can still introduce raw `bg-emerald-*`, `bg-red-*`, `bg-orange-*`, `text-emerald-*`, or `bg-slate-950` with unreviewed psychology.

Observed source hotspots:

- `src/pages/TimeTrackerPage.jsx`: raw black/slate action utilities and slate tooltips.
- `src/pages/CalendarPage.jsx`: black save buttons.
- `src/pages/ProjectsPage.jsx`: black add/save controls and slate overlay.
- `src/pages/TeamPage.jsx`: black save controls, raw emerald comparison text, raw red delete button.
- `src/pages/TimesheetPage.jsx`: raw black file button, raw emerald ready text, raw red error text.
- `src/components/organisms/UtilityPanel.module.css`: raw red danger zone utilities.
- `tailwind.config.js`: `brand` remains monochrome, so the semantic theme mostly lives outside Tailwind.

Recommendation: move page-level actions and statuses onto reusable intent components/classes (`primary`, `success`, `warning`, `danger`, `info`, `neutral`, optionally `revenue`). Update Tailwind colour config to reference CSS variables or stop using raw colour utilities for semantic UI.

### 5. Danger Is Correct But Not Fully Tokenised

Severity: Medium

Reject and the notification count use the Soft Studio danger palette. Team delete and UtilityPanel danger zone still use Tailwind red (`red-50`, `red-700`, etc.). The meaning is correct, but the exact red differs from the theme red, so it feels less integrated.

Recommendation: replace raw danger utilities with `--semantic-danger-*` variables or a shared danger action component.

### 6. Notification Red Should Mean Action Required

Severity: Medium

The notification badge is red. This is psychologically appropriate if the count represents pending approvals or tasks needing intervention. If it includes general messages, red may overstate urgency.

Recommendation: keep red only for required-action counts. Use amber for waiting/pending and info teal/blue for general announcements.

### 7. Tooltips Still Feel Stark

Severity: Low

Time Tracker tooltips render as near-black slate `rgb(2, 6, 23)`. There are theme tooltip tokens, but these raw tooltip utilities bypass them.

Recommendation: route tooltips through `--theme-tooltip` and `--theme-tooltip-text`, or add a Soft Studio override for `bg-slate-950` if those utilities remain.

### 8. Team Grade Comparison Uses Success Green For A Non-State

Severity: Low

Team grade helper text uses `text-emerald-700` for "Higher than Grade..." messages. Green can imply "good" or "approved", but a higher rate may be a cost signal depending on context.

Recommendation: use neutral or info text unless the message is explicitly celebratory or validated.

## Recommended Next Fix Pass

1. Create a `revenue` or `classification` badge intent and move `Billable` off success green.
2. Split `info` away from primary teal so `Published`/`Active` do not compete with primary actions.
3. Define a Soft Studio categorical project palette and keep project colours out of status language.
4. Replace raw Tailwind red/emerald/black/slate semantic usages with shared intent components or CSS variables.
5. Update `tailwind.config.js` so `brand` and semantic colours point at theme variables, reducing the need for broad CSS overrides.

## Suggested Target Semantics

| Meaning | Colour family | Examples |
| --- | --- | --- |
| Primary action | Teal | Start, Save, Submit, Export, active nav |
| Success / approval | Green | Approved, Paid, Completed, passed target |
| Waiting / caution | Amber | Pending, Clock out, needs review |
| Danger / destructive | Red | Reject, Delete, urgent required action |
| Information / published / active | Cool blue or steel teal | Published, Active, Open reports |
| Revenue/classification | Muted blue-teal or neutral sage | Billable, Internal, Non-billable |
| Project/category | Categorical palette only | Project dots, strips, progress fills |

