# Production Readiness

This project now includes the deploy-time guardrails that can be implemented while keeping browser local storage as the persistence layer.

## Implemented Gates

- `npm run quality` runs deterministic tests and a Vite production build.
- GitHub Actions runs install, tests, build, and `npm audit --omit=dev` on pushes and pull requests.
- Static hosting security headers are defined in `public/_headers`.
- Access roles and permissions are centralized in `src/domain/auth.js` and applied to navigation.
- Client errors and key workspace events flow through `src/services/clientLogger.js` with sensitive context redacted.
- Redacted diagnostics can be sent to a same-origin production endpoint by setting `VITE_TELEMETRY_ENDPOINT`.
- Static regression tests check for CSP headers, accessible shell affordances, reduced-motion support, and no `dangerouslySetInnerHTML`.

## Remaining Backend-Dependent Work

- Server-backed identity, session management, and server-side authorization enforcement.
- Durable backups, cross-device sync, conflict resolution, and multi-user concurrency.
- Hosted alerting, data retention, export, deletion, and audit policies backed by a server.

Those items require replacing local-only persistence with a backend or managed platform. Until then, this app is suitable as a polished front-end prototype or single-browser pilot, not as a multi-user production system of record.
