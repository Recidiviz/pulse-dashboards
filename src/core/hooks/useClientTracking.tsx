// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { useEffect } from "react";

import type { Client } from "../../WorkflowsStore";

/**
 * Ensures the given tracking function is called only once per client,
 * de-duplicating across possible re-renders of the same client.
 * @param trackingFn will be called even if `client` is undefined! Be sure it handles this case.
 */
export function useClientTracking(
  client: Client | undefined,
  trackingFn: () => void
): void {
  // track when clients are displayed in the list
  useEffect(
    () => {
      trackingFn();
    },
    // Client instance references are not stable across subscription updates,
    // but the underlying data will be. This prevents logging clients twice when
    // subscription data is refreshed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client?.pseudonymizedId]
  );
}
