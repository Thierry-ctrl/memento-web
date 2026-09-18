# Put Memento on your AWS server

Target: Amazon Linux 2023, ec2-user at **34.202.163.247**. These instructions do not mean the server has been deployed. Run them only when the owner settings below are ready. No credentials belong in Git or in chat.

## 1. Before starting

- Choose the final domain. Point its A record at the server's stable public IP. Confirm the IP has not changed; an ordinary EC2 public address may change after stop/start. Do not leave a broken AAAA record.
- Allow inbound **80/443** publicly in its AWS security group; allow **22 only from your own IP**. Do not expose 5432 (database) or 8080 (API).
- The previously inspected disk was only 8 GB. Allow at least 20 GB for builds, data, logs and updates, or build images elsewhere. Increasing storage can incur costs; agree this first and follow AWS's volume/filesystem expansion instructions. Take a snapshot first.
- Agree the provisional package details in [business-configuration.md](business-configuration.md).
- Decide whether real Replit booking records already exist. **Copying code does not copy a database.** If they exist, pause public bookings and back up/export that database securely before switching. Import into an empty AWS database, then run the migration. Do not simply abandon real requests.

## 2. Prepare authentication and email

**Clerk:** create/use a production instance for the final domain, finish its DNS setup and add the owner's account. Set ADMIN_EMAIL to the exact **verified** email on that account. Keep sign-up restricted/invite-only in Clerk. Copy its production publishable key into VITE_CLERK_PUBLISHABLE_KEY and its secret key into CLERK_SECRET_KEY on the server. Do not use Replit's host-derived keys. No Clerk proxy is needed for this deployment.

**Email:** the business owns mementokigali@gmail.com. If that account supports app passwords, enable two-step verification and create a dedicated app password for the site. Put it in SMTP_PASS, **not the normal Gmail password**. SMTP_HOST is smtp.gmail.com, port 465, SMTP_USER is the business email, SMTP_FROM is `Memento <mementokigali@gmail.com>`. The owner should enter the credential privately. If app passwords are unavailable, use an approved transactional provider and its verified sender instead. Do not disable account security.

The site will refuse to start in production if essential authentication/email settings are blank. Filled settings still require real delivery and sign-in tests. Local tests never send email.

References: [Clerk production setup](https://clerk.com/docs/guides/development/deployment/production), [Google app passwords](https://support.google.com/accounts/answer/185833), [Gmail SMTP settings](https://support.google.com/mail/answer/7104828).

## 3. Connect and install the server tools

On your Mac:

```sh
ssh -i /Users/uwonkundathierryrugira/.ssh/aws_rsa ec2-user@34.202.163.247
```

On the server:

```sh
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
exit
```

Reconnect with the same SSH command. The following installs the **x86_64** Compose release and verifies its published checksum, following the official [Docker Linux installation instructions](https://docs.docker.com/compose/install/linux/). Manual installations need manual updates.

```sh
compose_tmp=$(mktemp -d)
cd "$compose_tmp"
curl -fSL https://github.com/docker/compose/releases/download/v5.5.0/docker-compose-linux-x86_64 -o docker-compose-linux-x86_64
curl -fSL https://github.com/docker/compose/releases/download/v5.5.0/docker-compose-linux-x86_64.sha256 -o docker-compose-linux-x86_64.sha256
sha256sum -c docker-compose-linux-x86_64.sha256
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo install -m 0755 docker-compose-linux-x86_64 /usr/local/lib/docker/cli-plugins/docker-compose
```

Only run the install command if checksum verification says **OK**. Check `docker buildx version` too; if the Amazon Linux Docker package does not include Buildx, install it using [Docker's official Buildx instructions](https://github.com/docker/buildx#manual-download). Do not substitute scripts from unofficial sites.

Verify:

```sh
docker version
docker compose version
df -h
```

These steps follow [AWS's Docker setup for Amazon Linux 2023](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-container-image.html). Docker-group access is effectively administrator access; only trusted maintainers should have it.

## 4. Transfer the finished code

This path transfers the current local source, including changes not yet pushed to GitHub. It excludes dependencies, build output and environment secrets.

On your Mac, from the project:

```sh
cd /Users/uwonkundathierryrugira/Downloads/Memento-Booking-Website
pnpm typecheck
tar --exclude=node_modules --exclude=dist --Shexclude='*.tsbuildinfo' --exclude='.env*' --exclude='*.pem' --exclude='*.key' --exclude=originals -cf /tmp/memento-launch-source.tar package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json artifacts lib scripts attached_assets Dockerfile compose.yaml deploy docs README.md .dockerignore .gitignore .npmrc
tar -rf /tmp/memento-launch-source.tar .env.example
gzip -f /tmp/memento-launch-source.tar
scp -i /Users/uwonkundathierryrugira/.ssh/aws_rsa /tmp/memento-launch-source.tar.gz ec2-user@34.202.163.247:/home/ec2-user/
```

On the server, use a new directory so nothing existing gets overwritten:

```sh
mkdir /home/ec2-user/memento-launch-1
cd /home/ec2-user/memento-launch-1
tar -xzf /home/ec2-user/memento-launch-source.tar.gz
cp .env.example .env
chmod 600 .env
nano .env
```

Fill DOMAIN (hostname only), ACME_EMAIL, POSTGRES_PASSWORD, Clerk keys, ADMIN_EMAIL, SMTP settings and RELEASE_TAG. Generate a URL-safe database password with `openssl rand -hex 32`; enter the result privately in .env. Keep a secure copy. Use `RELEASE_TAG=launch-1`. Compose creates DATABASE_URL and PUBLIC_ORIGIN; the corresponding local-development fields can stay blank. Do not change POSTGRES_PASSWORD later without rotating the actual database user's password too.

Alternative for later: commit/review/push the finished code to your repository, then clone/pull a pinned release on the server. GitHub still needs your normal authentication if the repository is private. This task did not commit or push for you.

## 5. Build, migrate and start

From the server project directory:

```sh
docker compose config --quiet
docker compose build
docker compose up -d db
docker compose run --rm migrate
docker compose up -d
docker compose ps
docker compose logs --tail=80 api web
```

The migration supports both a fresh database and the original schema, preserving historical prices. Never run schema `push-force` in production. The API and database have **no host ports**; Caddy is the public entrance. Caddy obtains and renews HTTPS certificates when DNS and ports are ready. Database/certificate volumes persist across ordinary restarts.

If importing a Replit backup, do so before the first migration, into an empty database, with a verified backup and a rollback plan. Ask for a tailored migration command once you know the export format; do not overwrite a populated destination.

## 6. Launch acceptance checks — do not skip

1. Open `https://YOUR-DOMAIN` and its /experiences, /gallery and /book pages on a phone and desktop. Check every image and package price.
2. Check `https://YOUR-DOMAIN/api/healthz`: it should return status ok. This checks database reachability, not email delivery.
3. Submit one clearly labelled TEST request using an inbox you control. Confirm the reference, package, extra hours and all selected add-ons. It must say **request**, not confirmed reservation.
4. Verify the owner notification arrives at mementokigali@gmail.com and the customer receipt arrives. Check spam. In /admin, inspect Email delivery. Stop launch if delivery remains pending/retrying.
5. Sign in at /sign-in using the owner's allowlisted verified account; open /admin. A different signed-in account must be denied. Customer data must not be accessible while signed out.
6. Confirm the TEST request, verify that its slot is unavailable, and verify an overlapping request cannot be confirmed. Then cancel the test and verify the time becomes available again.
7. Add and remove a test blocked time; verify it is respected. Test an overnight case. Allow travel/setup time manually.
8. Verify privacy wording, retention arrangements, email, Instagram, telephone and absence of WhatsApp until the new number is verified.
9. Run a backup and restore rehearsal below. Check AWS billing alerts and disk monitoring. Only then announce the site.

The software tests SMTP retries with a fake sender. They cannot establish that Gmail accepts your live credentials or that mail reaches an inbox. Likewise, production Clerk access needs the actual owner account.

## 7. Backups and operations

```sh
bash deploy/backup.sh
```

This produces a restricted-permission PostgreSQL dump under backups/ and verifies it is readable. **A backup on the same server is not enough.** Copy each dump to encrypted off-server storage, agree retention, and keep encryption/access credentials with the owner. A failed backup command must be investigated.

For a daily schedule, have a maintainer configure a systemd timer or cron for this script using the actual deployment directory, with failure alerts. This guide does not silently configure a recurring job or paid storage. Treat off-server backup scheduling as a launch requirement.

Restore rehearsal (a new, isolated database, never the live database):

```sh
docker compose exec db createdb -U memento memento_restore_check
docker compose exec -T db pg_restore -U memento -d memento_restore_check --exit-on-error < backups/EXACT-BACKUP-FILENAME.dump
docker compose exec db psql -U memento -d memento_restore_check -c 'SELECT count(*) FROM booking_requests;'
```

Compare row counts and a sample request against production. Use a new rehearsal database name if it already exists. Do not delete or overwrite production data to test a restore.

Daily: review pending bookings and failed/retrying emails; check disk space and backup success. Monthly: apply reviewed OS/container/dependency updates. SMTP has provider quotas; monitor failures rather than assuming unlimited email. The in-memory public request limiter is suitable for this one-instance launch, not a distributed abuse-control system.

## 8. Updating and rolling back

Before every update, run and copy a verified backup. Keep the previous release directory, .env and Docker images. Build the new source with a new RELEASE_TAG (e.g. launch-2), retaining the same DOMAIN and database password; Compose's fixed project name preserves the volumes. Run migrations, then `docker compose up -d`. Re-run the acceptance checks. There can be a short service interruption on this single server.

For a code-only rollback, return to the previous release directory and its previous RELEASE_TAG, then run `docker compose up -d --no-build`. Do not roll back across an incompatible database migration without a reviewed recovery plan. Avoid `docker compose down -v`: it deletes stored database/certificate volumes. Never clean up database volumes to solve a build error.

Troubleshooting: API won't start → inspect required environment settings; 502 → check API health/logs; missing email → check SMTP credentials, outbox status and provider limits; missing HTTPS → verify DNS/public 80/443; login denied → verify production Clerk instance and exact verified ADMIN_EMAIL.
