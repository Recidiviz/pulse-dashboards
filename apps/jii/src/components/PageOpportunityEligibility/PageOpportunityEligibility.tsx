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

import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useParams } from "react-router-dom";

import { OpportunityEligibility } from "../OpportunityEligibility/OpportunityEligibility";
import { useRootStore } from "../StoreProvider/useRootStore";

export const PageOpportunityEligibility: FC = observer(
  function PageOpportunityEligibility() {
    const { opportunityUrl } = useParams();

    const { residentsStore } = useRootStore();
    if (!residentsStore) return null;

    const { externalId } = residentsStore.userStore;
    const opportunityId = residentsStore.opportunityIdsByUrl.get(
      opportunityUrl ?? "",
    );

    if (externalId && opportunityId) {
      return (
        <OpportunityEligibility
          residentExternalId={externalId}
          opportunityId={opportunityId}
        />
      );
    }

    return null;
  },
);
