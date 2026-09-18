# Memento website & booking requests

A React/Vite public website, Express API and PostgreSQL booking desk.

## Start here

- [AWS deployment guide](docs/deploy-aws.md): transfer, configuration, HTTPS, backups, updates and rollback.
- [Business configuration & owner decisions](docs/business-configuration.md): one place for prices, inclusions, contact details, add-ons and opening date.
- [AI imagery & prompts](docs/imagery.md): nine new Quiet Archive images and retained masters.

## Development

Use Node 24 and pnpm 10.33.0. Run `pnpm install --frozen-lockfile`.
Set `DATABASE_URL` for a dedicated development PostgreSQL database, then run `pnpm --filter @workspace/db migrate`. Never use `push-force` in production.
Start API: `DATABASE_URL=... pnpm --filter @workspace/api-server dev` (port 8080).
Start website: `pnpm --filter @workspace/memento dev` (port 5173).
The public site works without Clerk in development; the admin API fails closed until configured.
For admin development configure both Clerk backend keys and the Vite publishable key, and a verified `ADMIN_EMAIL`. See .env.example; Vite loads the root .env, while the API needs exported environment variables (or Node's --env-file option).
Regenerate contracts after OpenAPI changes: `pnpm --filter @workspace/api-spec codegen`.

## Tests

`pnpm typecheck`; `pnpm --filter @workspace/memento build`; `pnpm --filter @workspace/api-server build`.

Integration tests use only an isolated local database named `memento_test`, port 55439. They erase that test database's booking tables; never point them at real data.

```sh
docker run -d --name memento-launch-test-db -e POSTGRES_USER=memento_test -e POSTGRES_PASSWORD=local-test-only -e POSTGRES_DB=memento_test -p 127.0.0.1:55439:5432 postgres:16-alpine
DATABASE_URL=postgresql://memento_test:local-test-only@127.0.0.1:55439/memento_test pnpm --filter @workspace/db migrate
pnpm test
docker stop memento-launch-test-db
```

If the container exists, use `docker start memento-launch-test-db` instead of creating another. Tests cover package pricing, strict validation, timezone/overnight scheduling, concurrent confirmations and blocks, conflict clearing, email retries and HTTP contracts. Email delivery is simulated; no real messages are sent by tests.

## Workflow and limitations

Customers submit **requests**, not instant confirmed reservations. Estimates exclude quoted add-ons. No payment processing or deposit promise is implemented. Owner reviews and confirms at /admin using the allowlisted verified Clerk account. One shared booth capacity is enforced, with no travel/setup buffer yet; owner should block preparation and travel time manually.

Requests and notification jobs save in one database transaction. Email retries automatically, and the admin detail shows notification status. Delivery is at-least-once; an exceptional crash after mail acceptance can result in a duplicate email with the same reference. SMTP acceptance is not a guarantee of inbox placement. Real delivery and owner sign-in must be tested before launch.

Old Replit deployment metadata exists for both the API and the website. This repository now also has an independent AWS deployment path; do not mix Replit's managed database publication with the AWS migration instructions.

This is a functional launch implementation, not a legal/privacy compliance certification. Agree retention, image permissions, provider arrangements and owner operations before collecting live customer data.
