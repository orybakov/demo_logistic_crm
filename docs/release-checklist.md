# Release Checklist

## Before release

- [ ] All tests pass: unit, integration, e2e.
- [ ] `pnpm build` succeeds.
- [ ] Database migration plan is approved.
- [ ] Production env files are populated.
- [ ] Secrets are stored outside the repository.
- [ ] Monitoring and alert contacts are confirmed.

## Functional checks

- [ ] Authentication works for admin and standard users.
- [ ] RBAC blocks forbidden admin operations.
- [ ] Documents upload, list, download, and delete work.
- [ ] KPI and reports pages load.
- [ ] Health and metrics endpoints return OK.

## Operational checks

- [ ] Swagger remains disabled in production unless explicitly enabled.
- [ ] HTTP audit logging is disabled unless required.
- [ ] Error tracking endpoint is configured only if approved.
- [ ] Backup before deployment is available.
- [ ] Rollback plan is validated.
