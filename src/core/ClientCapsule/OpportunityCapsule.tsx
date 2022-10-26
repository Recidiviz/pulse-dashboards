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
import { useClientTracking } from "../hooks/useClientTracking";
import { EligibilityStatus, WorkflowProgress } from "../OpportunityStatus";
import { useShowEligibilityStatus } from "../utils/workflowsUtils";
import ClientCapsule, { ClientCapsuleProps } from "./ClientCapsule";

type Props = Omit<ClientCapsuleProps, "status" | "client"> & {
  opportunity: Opportunity;
};

export const OpportunityCapsule = observer(
  ({ opportunity, ...otherProps }: Props) => {
    const { client, isHydrated } = opportunity;
    useClientTracking(client, () => {
      client.trackListViewed(opportunity.type);
    });
    const showEligibilityStatus = useShowEligibilityStatus(opportunity);

    let status: React.ReactNode = null;

    if (isHydrated) {
      status = (
        <>
          {showEligibilityStatus && (
            <>
              <EligibilityStatus opportunity={opportunity} includeReasons /> •{" "}
            </>
          )}
          <WorkflowProgress opportunity={opportunity} />
        </>
      );
    }

    return (
      <ClientCapsule
        client={client}
        status={status}
        hideTooltip
        {...otherProps}
      />
    );
  }
);
