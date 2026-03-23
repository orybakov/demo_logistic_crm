# Rollback Checklist

## Trigger conditions

- Elevated 5xx errors after release.
- Authentication or RBAC regressions.
- Migration incompatibility or data corruption.
- Document upload/download failures at scale.

## Application rollback

- [ ] Revert API and web deployments to the previous release artifact.
- [ ] Restore previous environment variables if they changed.
- [ ] Re-run health and smoke checks.

## Database rollback

- [ ] Prefer forward-fix migrations when possible.
- [ ] If rollback requires restore, recover from the latest verified backup.
- [ ] Verify schema and seed state after recovery.

## After rollback

- [ ] Capture incident timeline.
- [ ] Identify the breaking change.
- [ ] Create a hotfix branch or migration.
- [ ] Inform the team that rollback is complete.
