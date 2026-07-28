#!/usr/bin/env bash
# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

set -euo pipefail

if ! command -v adb &>/dev/null; then
  echo "adb not found on PATH. Install Android platform-tools (e.g. via Android Studio) first." >&2
  exit 1
fi

adb start-server >/dev/null 2>&1 || true

if adb devices | awk 'NR>1 && NF>=2 && $2=="device" {found=1} END{exit !found}'; then
  echo "A device is already connected via adb — skipping reconnect (avoids disrupting an active session)."
  exit 0
fi

if ! adb mdns check 2>&1 | grep -qi "mdns daemon version"; then
  echo "adb mDNS discovery isn't available (needs a recent platform-tools version)." >&2
  echo "Connect manually instead: adb connect <ip>:<port>, using the address shown under" >&2
  echo "Settings > Developer options > Wireless debugging on your device." >&2
  exit 1
fi

services="$(adb mdns services 2>/dev/null | grep '_adb-tls-connect\._tcp' || true)"

if [ -z "$services" ]; then
  cat >&2 <<'EOF'
No paired wireless-debugging device was found via mDNS.

First-time setup (per device):
  1. On your Android device: Settings > System > Developer options > Wireless debugging > enable it
  2. Tap "Pair device with pairing code" - a 6-digit code and an IP:port will be shown
  3. Run: adb pair <ip>:<port>   (enter the code when prompted)
  4. Re-run this script to connect

Make sure your computer and device are on the same Wi-Fi network.
EOF
  exit 1
fi

addresses=$(echo "$services" | grep -oE '[0-9]{1,3}(\.[0-9]{1,3}){3}:[0-9]+' | sort -u)
count=$(echo "$addresses" | grep -c . || true)

if [ "$count" -eq 0 ]; then
  echo "Found a wireless-debugging service but couldn't parse an address from it:" >&2
  echo "$services" >&2
  echo "Connect manually with: adb connect <ip>:<port>" >&2
  exit 1
fi

if [ "$count" -gt 1 ]; then
  echo "Multiple wireless-debugging devices found:" >&2
  echo "$addresses" >&2
  echo "Connect manually with: adb connect <address>" >&2
  exit 1
fi

echo "Connecting to $addresses..."
adb connect "$addresses"
