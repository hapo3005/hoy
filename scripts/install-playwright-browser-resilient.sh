#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -lt 1 ]]; then
  echo "usage: $0 <browser> [browser...]" >&2
  exit 64
fi

attempts="${PLAYWRIGHT_INSTALL_ATTEMPTS:-2}"
timeout_window="${PLAYWRIGHT_INSTALL_TIMEOUT:-6m}"

if ! [[ "$attempts" =~ ^[1-9][0-9]*$ ]]; then
  echo "invalid PLAYWRIGHT_INSTALL_ATTEMPTS: $attempts" >&2
  exit 64
fi

# GitHub-hosted Ubuntu runners can occasionally stall on the Azure Ubuntu
# archive mirror while Playwright installs system dependencies. Keep APT
# network operations bounded and prefer the canonical Ubuntu archive when the
# runner exposes an azure.archive.ubuntu.com mirror entry.
sudo tee /etc/apt/apt.conf.d/99-hoy-ci-network >/dev/null <<'EOF'
Acquire::Retries "3";
Acquire::http::Timeout "20";
Acquire::https::Timeout "20";
Acquire::ForceIPv4 "true";
EOF

if [[ -f /etc/apt/apt-mirrors.txt ]]; then
  sudo sed -Ei 's#https?://azure\.archive\.ubuntu\.com/ubuntu#https://archive.ubuntu.com/ubuntu#g' /etc/apt/apt-mirrors.txt
fi

for ((attempt=1; attempt<=attempts; attempt++)); do
  echo "Playwright install attempt ${attempt}/${attempts}: $*"
  if timeout --kill-after=30s "$timeout_window" npx playwright install --with-deps "$@"; then
    exit 0
  fi

  if (( attempt < attempts )); then
    echo "::warning::Playwright install attempt ${attempt} failed or timed out; retrying"
    sleep $((attempt * 10))
  fi
done

echo "::error::Playwright browser installation failed after ${attempts} bounded attempts"
exit 1
