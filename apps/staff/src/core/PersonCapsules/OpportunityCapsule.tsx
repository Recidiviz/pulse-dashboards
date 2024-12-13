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

import { isHydrated } from "~hydration-utils";

import { Opportunity } from "../../WorkflowsStore";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { EligibilityStatus, WorkflowProgress } from "../OpportunityStatus";
import {
  JusticeInvolvedPersonCapsule,
  JusticeInvolvedPersonCapsuleProps,
} from "./JusticeInvolvedPersonCapsule";

type Props = Omit<JusticeInvolvedPersonCapsuleProps, "status" | "person"> & {
  opportunity: Opportunity;
};

export const OpportunityCapsule = observer(function OpportunityCapsule({
  opportunity,
  ...otherProps
}: Props) {
  const { person } = opportunity;
  usePersonTracking(person, () => {
    opportunity.trackListViewed();
  });

  let status: React.ReactNode = null;

  if (isHydrated(opportunity)) {
    // Hide "Needs review" in Arizona, where it is misleading because most surfaced
    // people in Arizona have been reviewed by a separate team besides tool users
    const showProgress =
      opportunity.lastViewed || opportunity.config.stateCode !== "US_AZ";

    status = (
      <>
        {opportunity.showEligibilityStatus("OpportunityCapsule") && (
          <>
            <EligibilityStatus opportunity={opportunity} includeReasons />
            {showProgress && " • "}
          </>
        )}
        {showProgress && <WorkflowProgress opportunity={opportunity} />}
      </>
    );
  }

  return (
    <JusticeInvolvedPersonCapsule
      person={person}
      status={status}
      additionalDetails={opportunity.instanceDetails}
      {...otherProps}
    />
  );
});
