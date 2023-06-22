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

import { observer } from "mobx-react-lite";

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
  const { person, isHydrated } = opportunity;
  usePersonTracking(person, () => {
    opportunity.trackListViewed();
  });

  let status: React.ReactNode = null;

  if (isHydrated) {
    status = (
      <>
        {opportunity.showEligibilityStatus("OpportunityCapsule") && (
          <>
            <EligibilityStatus opportunity={opportunity} includeReasons /> •{" "}
          </>
        )}
        <WorkflowProgress opportunity={opportunity} />
      </>
    );
  }

  return (
    <JusticeInvolvedPersonCapsule
      person={person}
      status={status}
      hideTooltip
      {...otherProps}
    />
  );
});
