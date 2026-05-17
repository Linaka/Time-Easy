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
| SOLID and separation of concerns | Domain calculations, validation, date formatting, storage hooks, app orchestration, and shared UI are separated into focused modules. |
| React standards | The app uses functional components and hooks. The only class component is `ErrorBoundary`, which is the React 18-compatible boundary API. |
| Atomic design | Shared UI is split into atoms, molecules, organisms, and templates. Feature-specific page components stay in `src/App.jsx` until reuse justifies promotion. |
| Accessibility | Landmarks, semantic tables/forms, icon button names, `aria-current`, focus rings, route focus management, live status messages, and reduced-motion CSS are implemented. |
| Security | React text rendering is used, script-like input is blocked, CSV output is escaped, and client logs redact sensitive context. |
| Reliability | An error boundary prevents render failures from blanking the whole browser without recovery. |
| Performance | The app avoids additional runtime dependencies, keeps pure calculations testable, and uses Vite production builds as the bundle check. |
| Observability | Client render errors are logged through `src/services/clientLogger.js` with sensitive fields redacted. |
| Documentation | README, this compliance note, ADRs, and PR checklist document the project contract and quality gates. |

## Known Constraints

- The prototype is JavaScript rather than TypeScript. Public contracts are kept small and covered by focused tests; a TypeScript migration should be treated as a separate architecture decision if the prototype becomes a long-lived product.
- Some feature page components remain in `src/App.jsx` because the app is still a single-route prototype. Extract a feature into `src/features/*` when a page gains independent tests, services, or reuse.
- Automated accessibility tooling is not installed. Manual accessibility checks are documented in `README.md`; add axe, Playwright, or equivalent checks when CI is introduced.

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
