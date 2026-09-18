# Launch validation — 16 September 2026

## Completed locally

- Type checking for all workspace applications/libraries.
- Production frontend and API builds.
- 12 automated business/API tests plus one legacy-database migration test, all passing.
- Separate local PostgreSQL 16 test database; no production database was used.
- Concurrent overlapping confirmations and confirmation-vs-blocking tests: only one succeeds.
- Overnight conflicts, adjacent bookings, blocked days, cancellation conflict clearing.
- Server-authoritative package pricing; outdated pricing-version rejection; selected add-ons retained.
- Notification retry/success tests using a fake sender, without sending real email.
- Legacy prices/deposits retained during migration; overnight timestamps backfilled; migration safely reruns.
- Browser walkthrough: wedding package, three hours, keepsakes/custom backdrop, full review and successful request at RWF 450,000 plus quoted add-ons.
- Mobile confirmation at 390px and mobile package layout: no horizontal overflow.
- New nine-image gallery and desktop layout visually inspected.
- Docker API/web image builds; container API startup and database health check; packaged migration executable present.
- Caddy configuration validation and Compose configuration validation with dummy values.

## Not established by these tests

- Actual owner login and denial of a different authenticated account in the production Clerk instance.
- Live Gmail/SMTP acceptance, delivery to owner/customer inboxes, quotas or spam placement.
- Domain DNS, public HTTPS issuance, AWS networking, available disk, backups outside the instance.
- Production import/restore of any existing Replit data.
- Actual gallery hosting/retention, guest image consent process, payment terms or owner approval of provisional pricing.

No AWS deployment, Git commit or push was performed. Container tests were local; the deployment guide builds native images on the x86_64 EC2 instance. No live customer records or real email credentials were used.

Before announcing launch, complete the acceptance checklist in [deploy-aws.md](deploy-aws.md).
