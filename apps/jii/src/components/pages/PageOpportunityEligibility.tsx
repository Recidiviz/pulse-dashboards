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

import { withErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useParams } from "react-router-dom";

import { ErrorPage } from "../ErrorPage/ErrorPage";
import { OpportunityEligibility } from "../OpportunityEligibility/OpportunityEligibility";
import { useRootStore } from "../StoreProvider/useRootStore";
import { opportunityIdFromUrl } from "../utils/opportunityIdFromUrl";

export const PageOpportunityEligibility: FC = withErrorBoundary(
  observer(function PageOpportunityEligibility() {
    const { opportunityUrl } = useParams();

    const { residentsStore } = useRootStore();
    if (!residentsStore) return null;

    const { externalId } = residentsStore.userStore;
    if (!externalId) {
      throw new Error("missing Resident ID");
    }

    const opportunityId = opportunityIdFromUrl(
      opportunityUrl ?? "",
      residentsStore,
    );

    return (
      <OpportunityEligibility
        residentExternalId={externalId}
        opportunityId={opportunityId}
      />
    );
  }),
  { fallback: ErrorPage },
);