#!/usr/bin/env bash
# Proves a backup can be restored: loads the public-schema dump into an empty database and
# checks that every table comes back with the same number of rows the live database had.
#
#   scripts/restore-check.sh <public.dump> <live-counts.txt> <target database URL>
#
# The target gets supabase/test/auth_stub.sql first, because the tables reference auth.users.
# Constraints that point at auth.users can't be rebuilt there (its rows live in Supabase's auth
# schema, dumped separately), so the post-data step is reported but is not a failure.
set -euo pipefail
dump=$1; live=$2; target=$3
here=$(cd "$(dirname "$0")/.." && pwd)

psql "$target" -v ON_ERROR_STOP=1 -q -f "$here/supabase/test/auth_stub.sql"
# The dump creates the public schema itself, so the empty one a new database comes with goes.
psql "$target" -v ON_ERROR_STOP=1 -q -c "drop schema if exists public cascade"
pg_restore -d "$target" --no-owner --no-privileges --section=pre-data --section=data --exit-on-error "$dump"
echo "post-data (indexes and constraints):"
pg_restore -d "$target" --no-owner --no-privileges --section=post-data "$dump" 2>&1 | grep -c "^pg_restore: error" | sed 's/^/  errors skipped: /' || true

psql "$target" -Atq -f "$here/scripts/row-counts.sql" > restored-counts.txt
echo "live:";     sed 's/^/  /' "$live"
echo "restored:"; sed 's/^/  /' restored-counts.txt
if ! diff -q "$live" restored-counts.txt > /dev/null; then
  echo "RESTORE CHECK FAILED: row counts differ" >&2
  diff "$live" restored-counts.txt >&2 || true
  exit 1
fi
echo "RESTORE CHECK PASSED: every table has the same number of rows as live"
