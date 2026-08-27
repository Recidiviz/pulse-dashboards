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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

export function useCreAnalytics() {
  const {
    userStore: { segmentClient },
  } = useRootStore();
  const { personPseudoId } = useTypedParams(State.Resident);

  return {
    trackCategorySelected: (category: string) =>
      segmentClient.trackCreCategorySelected({
        justiceInvolvedPersonPseudoId: personPseudoId,
        category,
      }),

    trackSubcategorySelected: (
      category: string,
      subcategory: string,
      isOpen: boolean,
    ) =>
      segmentClient.trackCreSubcategorySelected({
        justiceInvolvedPersonPseudoId: personPseudoId,
        category,
        subcategory,
        isOpen,
      }),

    trackFiltersUpdated: (
      category: string,
      subcategories: string[],
      tags: string[],
    ) =>
      segmentClient.trackCreFiltersUpdated({
        justiceInvolvedPersonPseudoId: personPseudoId,
        category,
        subcategories,
        tags,
      }),

    trackFilterCleared: (category: string) =>
      segmentClient.trackCreFilterCleared({
        justiceInvolvedPersonPseudoId: personPseudoId,
        category,
      }),

    trackResourceViewed: (resourceId: number, resourceName: string) =>
      segmentClient.trackCreResourceViewed({
        justiceInvolvedPersonPseudoId: personPseudoId,
        resourceId,
        resourceName,
      }),

    trackDescriptionToggled: (
      resourceId: number,
      resourceName: string,
      isExpanded: boolean,
    ) =>
      segmentClient.trackCreDescriptionToggled({
        justiceInvolvedPersonPseudoId: personPseudoId,
        resourceId,
        resourceName,
        isExpanded,
      }),
  };
}
