// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { autorun } from "mobx";
import { useEffect } from "react";

import { useRootStore } from "../components/StoreProvider";
import { JusticeInvolvedPerson } from "../WorkflowsStore";

const useHydrateOpportunities = (person: JusticeInvolvedPerson): void => {
  const {
    workflowsStore: { opportunityTypes },
  } = useRootStore();
  // We don't use a full hydrator with an intermediate loading state since we
  // do not want to prevent the rendering of the children components while we
  // fetch opportunity information for use in part of the tooltip. The user
  // will not see any jitter unless they are currently displaying the tooltip
  // for a person with opportunities to load.
  useEffect(
    () =>
      autorun(() => {
        const { potentialOpportunities } = person;
        opportunityTypes.forEach((opportunityType) => {
          potentialOpportunities[opportunityType]?.hydrate();
        });
      }),
    [person, opportunityTypes],
  );
};

export default useHydrateOpportunities;
