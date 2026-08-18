#!/bin/sh
# Container entrypoint: apply pending migrations, then start the server.
#
# Migrations run here rather than in fly.toml's `release_command` on purpose:
# the release-command machine's logs are frequently unretrievable ("timeout
# waiting for release command logs"), which makes a failed migration look like
# a bare "exit code 1" with no cause. Running them here puts the real Prisma
# error in the app machine's logs, where `fly logs` and the dashboard show it.
set -e

# Echo the target host (never the password) so a misconfigured DATABASE_URL is
# obvious from the logs alone.
node -e '
const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("[start] FATAL: DATABASE_URL is not set. Set it with `fly secrets set DATABASE_URL=...`.");
  process.exit(1);
}
try {
  const u = new URL(raw);
  console.log(`[start] Database target: ${u.hostname}:${u.port || "5432"} user=${u.username} db=${u.pathname.slice(1)}`);
} catch {
  console.error("[start] FATAL: DATABASE_URL is not a valid URL. Special characters in the password must be percent-encoded.");
  process.exit(1);
}
'

# Retry rather than die on the first failure: a managed database can be briefly
# unreachable while it restarts (a Supabase password reset does exactly this) or
# while a scaled-to-zero instance wakes up. Without this, that transient window
# crashloops the machine until Fly gives up, turning a 60-second blip into a
# permanently down app. Roughly 2 minutes of retries total.
retry() {
  label="$1"
  shift
  delay=5
  attempt=1
  max_attempts=7
  while :; do
    if "$@"; then
      return 0
    else
      # Must read $? inside the else branch: after `fi`, POSIX resets the
      # status of a failed condition with no else-branch to 0.
      status=$?
    fi
    if [ "${attempt}" -ge "${max_attempts}" ]; then
      echo "[start] FATAL: ${label} failed after ${attempt} attempts (exit ${status})." >&2
      return "${status}"
    fi
    echo "[start] ${label} failed (exit ${status}); retrying in ${delay}s (attempt ${attempt}/${max_attempts})..." >&2
    sleep "${delay}"
    attempt=$((attempt + 1))
    delay=$((delay * 2))
    if [ "${delay}" -gt 30 ]; then
      delay=30
    fi
  done
}

echo "[start] Applying database migrations..."
retry "prisma migrate deploy" node_modules/.bin/prisma migrate deploy
echo "[start] Migrations up to date."

# Idempotent: ensures the category/question framework exists and that there is
# an admin account to log in with. Without this a freshly-migrated database has
# no users at all, which locks everyone out of an otherwise healthy deploy.
echo "[start] Bootstrapping framework data and admin user..."
retry "bootstrap" node_modules/.bin/tsx prisma/bootstrap.ts
echo "[start] Bootstrap complete."

echo "[start] Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
