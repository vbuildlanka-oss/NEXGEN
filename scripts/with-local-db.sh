#!/usr/bin/env bash
# Starts a local Postgres (if one is not already listening) and then runs the
# command passed to it. Used for verification inside the build sandbox, where
# background processes do not survive between shell invocations.
#
#   ./scripts/with-local-db.sh pnpm build
set -euo pipefail

PGDATA="${PGDATA:-/var/lib/pgsql/data}"
PGLOG="${PGLOG:-/var/lib/pgsql/pg.log}"
PGPORT="${PGPORT:-5432}"

if ! (exec 3<>/dev/tcp/127.0.0.1/"$PGPORT") 2>/dev/null; then
  chmod 1777 /tmp 2>/dev/null || true
  # A stale postmaster.pid from a previous sandbox shell blocks a clean start.
  rm -f "$PGDATA/postmaster.pid"
  rm -f /var/run/postgresql/.s.PGSQL."$PGPORT".lock /var/run/postgresql/.s.PGSQL."$PGPORT"
  rm -f /tmp/.s.PGSQL."$PGPORT".lock /tmp/.s.PGSQL."$PGPORT"
  mkdir -p /var/run/postgresql
  chown postgres:postgres /var/run/postgresql
  su postgres -c "pg_ctl -D $PGDATA -l $PGLOG -o '-p $PGPORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=/var/run/postgresql' -w start"
  su postgres -c "psql -h 127.0.0.1 -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='nexgen'\"" \
    | grep -q 1 || su postgres -c "psql -h 127.0.0.1 -U postgres -c 'CREATE DATABASE nexgen'"
fi

exec "$@"
