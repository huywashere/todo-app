# Production deployment guide

FocusFlow now separates development conveniences from production settings. It is still a portfolio project: do not enable `prod` until the environment below is configured by an operator.

## Required runtime configuration

- Run the API with `SPRING_PROFILES_ACTIVE=prod`.
- Use managed PostgreSQL with automatic backups and point-in-time recovery. The role must not be a database superuser.
- Store `JWT_SECRET`, database password, SMTP password, and storage credentials in a secrets manager, never in Git or image layers.
- Set `CORS_ALLOWED_ORIGINS` to exact trusted frontend origins. Do not use wildcard origins with credentials.
- Set `COOKIE_SECURE=true`. Keep `COOKIE_SAME_SITE=Lax` if the UI and API share the same site. For genuinely cross-site deployments, set it to `None` only with HTTPS and add CSRF protection at the edge.
- Configure SMTP and set `EMAIL_ENABLED=true`; tokens are never returned by production responses.
- Use S3 (or compatible object storage), a private bucket, lifecycle rules, server-side encryption, and least-privilege IAM limited to the configured bucket prefix.

## Local staging parity

The default Compose stack stores attachments on the backend container volume. To exercise the S3 code path locally with MinIO:

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.storage.yml up --build
```

MinIO console is available at `http://localhost:9001`. It is intentionally for local development only.

## Backups and recovery drills

Create a PostgreSQL dump from the running Compose stack:

```powershell
.\scripts\backup-postgres.ps1
```

The restore helper requires the explicit `-ConfirmRestore` switch and should only be used for a disposable local database. Production restoration belongs to the managed database recovery procedure and should be practised against staging first.

## Public edge and operations

- Terminate TLS at a reverse proxy/load balancer; redirect HTTP to HTTPS and enable HSTS after validating the domain.
- Put the API behind a WAF and distributed rate limiter. The in-process login limiter is a local safety net, not a multi-instance DDoS control.
- Keep `/actuator/prometheus`, Swagger, the database, MinIO, and Grafana off the public internet. `/actuator/health/**` is the only unauthenticated health endpoint.
- Use centralized logs, alerting on error rate/latency/auth failures, and synthetic probes for UI/API/SMTP/storage.
- Run at least two stateless API replicas behind a load balancer. The current SSE broker is in-process, so production multi-replica realtime needs a shared broker (Redis Pub/Sub, RabbitMQ, or managed equivalent) before relying on instant cross-node events.

## Release checklist

1. Run `npm run lint`, `npm run test:run`, `npm run build`, and `backend\\mvnw.cmd verify`.
2. Apply Flyway migrations to staging and verify rollback/recovery procedures.
3. Validate registration, verification email, reset email, refresh-cookie rotation, workspace roles, attachment upload/download, offline sync, and recurring reminders.
4. Scan containers, rotate credentials, verify least-privilege IAM, and obtain an independent security review before accepting real user data.
