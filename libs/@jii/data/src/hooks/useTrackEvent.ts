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

import type { JiiEvents } from "../apis/Segment/SegmentClient";
import type { SegmentEventName } from "../apis/Segment/types";
import { useRootStore } from "../components/StoreProvider/useRootStore";
import { useSingleResidentContextOptional } from "../contexts/SingleResidentContext";

/**
 * Returns a function that sends a JII Segment event, adding the viewed
 * resident's pseudo ID when there is one. Memoized, so effects that depend on
 * it don't re-run every render.
 */
export function useTrackEvent() {
  const {
    userStore: { segmentClient },
  } = useRootStore();
  const pseudoId = useSingleResidentContextOptional()?.resident.pseudonymizedId;

  return useCallback(
    <Name extends keyof JiiEvents & SegmentEventName>(
      name: Name,
      properties: JiiEvents[Name],
    ) =>
      segmentClient.track(name, {
        ...properties,
        justiceInvolvedPersonPseudoId: pseudoId,
      }),
    [segmentClient, pseudoId],
  );
}
