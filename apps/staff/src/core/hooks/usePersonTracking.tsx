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

import type { JusticeInvolvedPerson } from "../../WorkflowsStore";

/**
 * Ensures the given tracking function is called only once per person,
 * de-duplicating across possible re-renders of the same person.
 * @param trackingFn will be called even if `person` is undefined! Be sure it handles this case.
 */
export function usePersonTracking(
  person: JusticeInvolvedPerson | undefined,
  trackingFn: () => void,
): void {
  useEffect(
    () => {
      trackingFn();
    },
    // Using the ID prevents logging redundant events if the object reference itself is not stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [person?.pseudonymizedId],
  );
}
