#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
backup_file="backups/memento-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T db pg_dump -U memento -d memento -Fc > "$backup_file"
docker compose exec -T db pg_restore --list < "$backup_file" >/dev/null
printf 'Backup created and readable: %s\nCopy it to encrypted storage outside this server.\n' "$backup_file"
