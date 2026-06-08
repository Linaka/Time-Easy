# ADR 0001: Frontend Architecture For Creative Operations

## Status

Accepted

## Context

Creative Operations is a browser-based SaaS dashboard prototype for time tracking, reporting, scheduling, approvals, projects, and team management. The attached Future Software Development Playbook requires maintainable React code, separation of concerns, accessibility, security, observability, and documented quality gates.

## Decision

Use a Vite React application with:

- Functional React components and hooks for app state and workflows.
- CSS Modules per shared component, using Tailwind CSS and local design tokens inside module-scoped BEM-style classes.
- Atomic design folders under `src/components`, with page-level views isolated under `src/pages`.
- Domain modules under `src/domain` plus focused utility modules for reusable calculations.
- `src/hooks/useWorkspaceState.js` for persistence-backed state sources, `src/hooks/useTimeTrackingController.js` for timer/manual-entry state, `src/hooks/useDesktopWorkspaceActions.js` for native import/export integration, and `src/hooks/useCreativeOperationsApp.js` for application workflow orchestration.
- `src/pages/pagePropsBySection.js` for explicit page-facing prop contracts so feature pages receive only the data and actions they use.
- `src/services` for infrastructure-style concerns such as client logging.
- Local storage persistence only; no external APIs or analytics in the prototype.
- Node test runner for pure domain, utility, and security regression tests.

## Consequences

- The app stays quick to run and easy to inspect locally.
- Business rules can be tested without rendering the UI.
- Shared UI can be promoted through atoms, molecules, organisms, and templates while keeping component styles locally scoped.
- Page contracts stay visible and narrow, supporting interface segregation as additional sections are added.
- The current prototype avoids extra dependencies, but automated component and accessibility tests should be added before production use.
- A future TypeScript migration remains open if the prototype becomes a maintained product with external API contracts.
