# Creative Operations

Creative Operations is a browser-based time tracking dashboard prototype with a clean SaaS interface, working timer, sample weekly entries, keyboard-accessible controls, automatic totals, shared server persistence when hosted, local fallback persistence, and functional workspace modules.

## Modules

- Time Tracker: timer, manual entries, tags, billable toggle, restart previous work.
- Timesheet: weekly project grid, manual row entry, and CSV import with row preview.
- Week ahead and Schedule: weekly work blocks, WYSIWYG-style inline time editing, shift creation, publish/complete workflow, Gantt-style project lanes, week/month/year planning horizons, in-chart assignment planning, drag-and-drop assignment moves, and dependency links.
- Expenses: expense submission, filters, approval/reimbursement states.
- Time Off: request form, balances, approval states.
- Dashboard and Reports: project performance metrics, budget, scheduled time, actual time, actual cost, margin percentage, clear active filters, date range filtering, and CSV export.
- Activity: audit feed, filters, notes, and clearing.
- Kiosks: shared-device clock-in/out sessions.
- Approvals: approve/reject pending time, expenses, and time off.
- Projects and Team: create/archive projects, filter by client/custom tags, add/delete members, manage capacity/status, and four editable GBP employment grades with increasing hourly rates.
- Top bar utilities: settings, notifications, help, and profile open accessible action panels.
- Quick clock: persistent quick start/stop tracking is available from the header on wide screens and a compact panel on narrower screens.
- Production guardrails: role-based navigation, redacted client diagnostics, optional same-origin telemetry delivery, deploy security headers, static accessibility/security checks, and CI quality gates.

## Run

```bash
npm install
npm run dev
```

When the app is served by the Vite dev or preview server, browsers on that same server share workspace changes through `/api/workspace`. The shared server copy is stored in `.workspace-data/workspace.sqlite` on the machine running the server. For LAN testing, run `npm run dev -- --host 0.0.0.0` and have everyone use that same server URL. If the endpoint is unavailable, the app falls back to browser localStorage.

## Team Webserver

For a team webserver, the frontend and shared workspace API must come from the same origin. The bundled Node server owns `/api/workspace` and writes shared changes to SQLite:

```bash
npm run build
HOST=0.0.0.0 PORT=4173 npm run serve
```

All team members should open the same server URL, for example `http://your-server:4173`. Changes are saved through `/api/workspace` into the server-side SQLite database at `.workspace-data/workspace.sqlite`, so updates made by one browser are picked up by the rest of the team. Set `TIMETRACKR_WORKSPACE_DB=/absolute/path/workspace.sqlite` to choose a persistent database location for production backups. The bundled webserver uses Node's built-in SQLite support.

### Nginx

Nginx can be the public webserver, but it should not serve only static files. If `/api/workspace` is missing, browsers fall back to localStorage and team changes will not be shared.

Recommended nginx setup:

- Run the Node server on localhost, for example `HOST=127.0.0.1 PORT=4173 TIMETRACKR_WORKSPACE_DB=/var/lib/timeeasy/workspace.sqlite npm run serve`.
- Let nginx serve the built `dist` files.
- Proxy `/api/` from nginx to `http://127.0.0.1:4173`.
- Keep the Node process alive with systemd, PM2, or another process manager.

Example deployment files:

- [deploy/nginx/timeeasy.conf](deploy/nginx/timeeasy.conf)
- [deploy/systemd/timeeasy.service](deploy/systemd/timeeasy.service)

## Desktop App

Creative Operations ships through a Tauri desktop shell.

```bash
npm run desktop:dev
```

Build the macOS app bundle from macOS:

```bash
npm run desktop:build:mac
```

Build the Windows MSI and NSIS installers from Windows:

```bash
npm run desktop:build:windows
```

The Windows artifacts are written under `src-tauri/target/release/bundle/msi/` and `src-tauri/target/release/bundle/nsis/`. The `Windows Desktop Build` GitHub Actions workflow can also package those installers from a `v*` tag or a manual workflow dispatch.

## Test

```bash
npm test
npm run build
npm run quality
```

## Playbook Alignment

This project follows the Future Software Development Playbook for SOLID React structure, separation of concerns, atomic design, accessibility, security, observability, and release readiness.

- Compliance notes: [docs/playbook-compliance.md](docs/playbook-compliance.md)
- Production readiness: [docs/production-readiness.md](docs/production-readiness.md)
- Architecture decision record: [docs/adr/0001-frontend-architecture.md](docs/adr/0001-frontend-architecture.md)
- Pull request checklist: [.github/pull_request_template.md](.github/pull_request_template.md)

Core boundaries:

- `src/components`: shared atomic design components and layout shells.
- `src/hooks`: shared stateful orchestration.
- `src/domain`: pure business rules, formatting, validation, and transformations.
- `src/services`: infrastructure-style concerns such as safe client logging.
- `.github/workflows/quality.yml`: CI gate for tests, build, and dependency audit.
- `tests`: deterministic regression tests for domain, utility, and security rules.

## Accessibility Checklist

- Semantic landmarks are used for `header`, `nav`, `main`, `section`, `form`, and tables.
- Active sidebar navigation uses `aria-current="page"`.
- Icon-only controls include accessible labels; decorative icons are hidden from assistive technology.
- Timer and save/error status messages use polite live regions.
- Form inputs have labels, helper text, validation, and visible focus states.
- Text and controls use contrast-aware black, grey, and white surfaces.
- The layout remains usable at narrow desktop widths and high zoom.
- Motion is minimal and respects `prefers-reduced-motion`.
- Workspace changes announce status updates through a polite live region.
- Tables include headers and row actions use explicit accessible names.
- Gantt assignments support drag-and-drop plus labelled icon buttons that open keyboard-accessible project and planning-period menus.
- Route changes update document title and keyboard focus for screen-reader orientation.

## Security Checklist

- User task text is rendered by React as text content, not injected as HTML.
- The entry form rejects script-like input such as `<script>alert("xss")</script>`.
- User-provided names, notes, tags, and descriptions reject script-like text before saving.
- CSV export escapes cells and prefixes spreadsheet-formula-like values.
- Dependency notes and schedule/project edits reject script-like text before saving.
- Client error logs redact sensitive context fields before writing diagnostics or optional same-origin telemetry.
- Static security headers define CSP, frame blocking, content sniffing protection, referrer policy, and browser permissions policy.
- Role-based access rules gate navigation and utility settings in the browser; server-side enforcement remains a backend requirement.
- App state uses same-origin shared workspace storage when served by the Vite dev/preview server or bundled Node webserver, with browser localStorage as the static/desktop fallback. No secrets, tokens, analytics scripts, or external API calls are used by default.
- Set `VITE_TELEMETRY_ENDPOINT` to a same-origin endpoint such as `/telemetry` to receive redacted client diagnostics in production.
- No third-party assets or proprietary branding are embedded.

## Manual QA Notes

- Keyboard-only navigation: tab through top utility controls, sidebar links, entry form controls, row actions, and the start/save buttons; confirm visible focus rings and logical order.
- Screen reader labels: verify icon-only controls announce names such as Settings, Notifications, Help, Play entry, and More options.
- Colour contrast: check body text, muted text, active navigation, tags, borders, and the blue START button against WCAG 2.1 AA.
- Timer behaviour: press START, confirm it counts upward from `00:00:00`, then press STOP to save the elapsed time into Today.
- Adding entries: enter a description, choose a project, toggle billable if needed, start and stop the timer, then confirm Today and This week totals update.
- Cross-module flow: create a project, start/stop a timer, confirm the entry appears as Pending under Approvals, approve it, then filter it in Reports.
- Module forms: add a timesheet row, schedule block, expense, time off request, team member, project, activity note, and kiosk session.
- Team deletion: add a temporary member, delete them from the Team directory, and confirm historical records remain available as `Unassigned`.
- Timesheet import: upload or paste CSV with `Date, Task, Project, Member, Duration, Billable, Tags`, preview row errors, and import valid rows.
- Top utilities: open Settings, Notifications, Help, and User profile; confirm each panel has working actions.
- Employment grades: confirm Team shows exactly Grade 1, Grade 2, Grade 3, and Grade 4 in GBP, edit a grade rate, and confirm rates must stay increasing.
- Reports: confirm each project shows budget, scheduled time, actual time spent, actual cost, and margin percentage; filter by project, client, custom project tag, person, status, billing, and date range; confirm the active filter chips and CSV export match the visible report.
- Projects: add and save custom project tags, then filter the portfolio by client and tag.
- Week ahead: click Edit on time or schedule cards, update visible fields inline, save, and confirm the card updates in place.
- Gantt chart: open Schedule, switch between Week, Month ahead, and Year ahead, add an assignment through the in-chart planning form, drag a person assignment across project lanes and periods, then use the project and period icon menus as keyboard-accessible fallbacks.
- Dependencies: add a dependency between two different projects, confirm duplicate/self-dependencies are blocked, then delete the dependency.
- Quick clock: start and stop the quick clock and confirm it saves a new time entry.
- Validation: submit without a description and confirm the inline error is announced and the entry is not saved.
- XSS prevention: enter `<script>alert("xss")</script>` and confirm validation blocks the save instead of rendering executable content.
