#!/usr/bin/env bash
# Runs the end-to-end tests, then stops the Odoo containers, even on Ctrl+C or a closed terminal.
set -euo pipefail

compose=(docker compose -f e2e/odoo/docker-compose.yml)
stop_odoo() {
  local status=$?
  # The containers and their logs go away: show why Odoo failed, unless the run was interrupted.
  if ((status != 0 && status != 130)); then
    "${compose[@]}" logs --no-color --tail=100 2>/dev/null || true
  fi
  "${compose[@]}" down >/dev/null 2>&1 || true
}
trap stop_odoo EXIT
trap 'exit 130' INT TERM HUP

wxt build
if [[ "${1:-}" == "--ui" ]]; then
  # UI mode does not run project dependencies: start and warm up Odoo first.
  playwright test --project=odoo-setup
  playwright test --ui-host=127.0.0.1 --ui-port=9323
else
  playwright test "$@"
fi
