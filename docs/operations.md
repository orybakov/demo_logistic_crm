# Operations Guide

## Endpoints

- Health: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/ready`
- Liveness: `GET /api/v1/health/live`
- Metrics: `GET /api/v1/health/metrics`
- Swagger: `GET /api/v1/docs` when enabled

## Logging

- Logs are emitted as JSON to stdout.
- Every request receives `X-Request-ID`.
- Mutating requests can be written to the audit table when `AUDIT_HTTP_REQUESTS=true`.

## Error Tracking

- Configure `ERROR_TRACKING_ENABLED=true` and `ERROR_TRACKING_WEBHOOK_URL` to forward unexpected errors.
- Without configuration, errors are logged locally only.

## Metrics

- Prometheus metrics are exposed at `/api/v1/health/metrics`.
- Important metrics:
  - `http_requests_total`
  - `http_request_duration_seconds`
  - `database_ready`

## Safe Defaults

- Swagger is disabled in production unless `ENABLE_SWAGGER=true`.
- Error tracking is disabled by default.
- HTTP audit logging is disabled by default.
- Metrics endpoint is public but read-only.

## Recommended Environment Variables

```env
STRUCTURED_LOGS=true
REQUEST_LOGGING=true
METRICS_ENABLED=true
AUDIT_HTTP_REQUESTS=false
ENABLE_SWAGGER=false
ERROR_TRACKING_ENABLED=false
ERROR_TRACKING_WEBHOOK_URL=
```
