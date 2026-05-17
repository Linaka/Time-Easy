# ADR 0001: Frontend Architecture For Creative Operations

## Status

Accepted

## Context

Creative Operations is a browser-based SaaS dashboard prototype for time tracking, reporting, scheduling, approvals, projects, and team management. The attached Future Software Development Playbook requires maintainable React code, separation of concerns, accessibility, security, observability, and documented quality gates.

## Decision

Use a Vite React application with:

- Functional React components and hooks for app state and workflows.
- Tailwind CSS and local design tokens for presentation.
- Atomic design folders under `src/components`.
- Domain modules under `src/domain` plus focused utility modules for reusable calculations.
- `src/hooks/useCreativeOperationsApp.js` as the main application orchestration hook.
- `src/services` for infrastructure-style concerns such as client logging.
- Local storage persistence only; no external APIs or analytics in the prototype.
- Node test runner for pure domain, utility, and security regression tests.

## Consequences

- The app stays quick to run and easy to inspect locally.
- Business rules can be tested without rendering the UI.
- Shared UI can be promoted through atoms, molecules, organisms, and templates.
- The current prototype avoids extra dependencies, but automated component and accessibility tests should be added before production use.
- A future TypeScript migration remains open if the prototype becomes a maintained product with external API contracts.
