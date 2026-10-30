// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { useCallback } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { type TrackReentryEvent, useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

/**
 * Returns a function that sends a Reentry Segment event for the resident in
 * the current route. Memoized, so effects that depend on it don't re-run
 * every render.
 */
export function useReentryAnalytics() {
  const {
    userStore: { segmentClient },
  } = useRootStore();
  const { personPseudoId } = useTypedParams(State.Resident);

  return useCallback<TrackReentryEvent>(
    (name, properties) =>
      segmentClient.trackReentryEvent(name, {
        ...properties,
        justiceInvolvedPersonPseudoId: personPseudoId,
      }),
    [segmentClient, personPseudoId],
  );
}
