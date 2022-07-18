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

import { assertNever } from "assert-never";
import { observer } from "mobx-react-lite";
import React from "react";

import { OpportunityType } from "../../firestore";
import type { Client } from "../../PracticesStore/Client";
import { useClientTracking } from "../hooks/useClientTracking";
import ClientCapsule, { ClientCapsuleProps } from "./ClientCapsule";

type Props = Omit<ClientCapsuleProps, "status"> & {
  opportunity: OpportunityType;
};

function getStatusMessage(client: Client, opportunity: OpportunityType) {
  switch (opportunity) {
    case "compliantReporting":
      return (
        <>
          {client.reviewStatusMessages.compliantReporting}
          {client.reviewStatus.compliantReporting === "DENIED" &&
            client.updates?.compliantReporting?.denial &&
            ` (${client.updates.compliantReporting.denial.reasons.join(", ")})`}
        </>
      );
    default:
      return assertNever(opportunity);
  }
}

export const OpportunityCapsule = observer(
  ({ client, opportunity, ...otherProps }: Props) => {
    useClientTracking(client, () => {
      client.trackListViewed(opportunity);
    });

    return (
      <ClientCapsule
        client={client}
        status={getStatusMessage(client, opportunity)}
        {...otherProps}
      />
    );
  }
);
