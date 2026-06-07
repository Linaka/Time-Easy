# Playbook Compliance

This project follows the Future Software Development Playbook as the working standard for planning, implementation, review, and release readiness.

## Definition Of Done

Before a change is complete:

- User need and acceptance criteria are clear.
- UI states include useful default, empty, error, success, and disabled behaviour where relevant.
- Keyboard-only use is possible for changed flows.
- Accessible names, labels, headings, landmarks, focus order, and live regions are checked.
- Layout works at narrow widths and 200% zoom.
- Business rules live in `src/domain`, shared hooks live in `src/hooks`, reusable UI lives in `src/components`, and infrastructure-style code lives in `src/services`.
- Inputs are validated at save/import/export boundaries.
- Security and privacy risks are reviewed, especially local storage, CSV import/export, and user-entered text.
- Tests are added or updated for changed business rules and regressions.
- `npm run quality` passes.
- Documentation or manual QA notes are updated when behaviour changes.

## Architecture Alignment

| Playbook area | Current project approach |
|---|---|
| SOLID and separation of concerns | Domain calculations, validation, date formatting, persistence-backed workspace state, timer control, desktop import/export actions, app orchestration, page contracts, page views, and shared UI are separated into focused modules. |
| React standards | The app uses functional components and hooks. The only class component is `ErrorBoundary`, which is the React 18-compatible boundary API. |
| Atomic design | Shared UI is split into atoms, molecules, organisms, and templates. Feature-specific page components live in `src/pages`, page prop contracts live in `src/pages/pagePropsBySection.js`, while `src/App.jsx` remains the shell and section registry. |
| Styling | Shared components use sibling CSS Modules with BEM-style block, element, and modifier class names; Tailwind utilities are applied inside those modules. |
| Accessibility | Landmarks, semantic tables/forms, icon button names, `aria-current`, focus rings, route focus management, live status messages, and reduced-motion CSS are implemented. |
| Security | React text rendering is used, script-like input is blocked, CSV output is escaped, and client logs redact sensitive context. |
| Reliability | An error boundary prevents render failures from blanking the whole browser without recovery. |
| Performance | The app avoids additional runtime dependencies, keeps pure calculations testable, and uses Vite production builds as the bundle check. |
| Authorization | Role and permission rules live in `src/domain/auth.js`; navigation and settings access use that shared contract. |
| Observability | Client render/global errors and key workspace events flow through `src/services/clientLogger.js` with sensitive fields redacted and optional same-origin telemetry delivery. |
| Release gates | GitHub Actions runs install, tests, build, and production dependency audit on pushes and pull requests. |
| Deployment hardening | Static hosting headers define CSP, frame blocking, sniffing protection, referrer policy, and browser permissions policy. |
| Documentation | README, production readiness notes, this compliance note, ADRs, and PR checklist document the project contract and quality gates. |

## Known Constraints

- The prototype is JavaScript rather than TypeScript. Public contracts are kept small and covered by focused tests; a TypeScript migration should be treated as a separate architecture decision if the prototype becomes a long-lived product.
- Feature pages are isolated from the app shell through explicit page contracts. Extract a feature into `src/features/*` when a page gains independent tests, services, or reuse.
- Static accessibility/security regression tests are included. Add full browser a11y tooling such as axe or Playwright before treating the app as a regulated production system.

## Manual QA Gate

Use this focused gate for changed UI:

- Tab through the changed flow without a mouse.
- Confirm the visible focus indicator is never hidden.
- Confirm page title and `h1` match after navigation.
- Confirm icon-only controls have accessible names.
- Confirm validation errors are visible and announced through status text where relevant.
- Confirm the flow remains usable at mobile width and 200% zoom.
- Confirm any destructive action has a clear label and recovery path.

## Security And Privacy Gate

- Do not add secrets, tokens, or personal data to source, logs, URLs, or sample data.
- Validate user text before saving.
- Never render user input with `dangerouslySetInnerHTML`.
- Escape exported CSV cells and protect against spreadsheet formula injection.
- Redact sensitive fields from diagnostics.
- Keep dependencies justified and covered by `package-lock.json`.
