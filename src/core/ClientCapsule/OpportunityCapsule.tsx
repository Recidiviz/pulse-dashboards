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
import React, { useEffect } from "react";

import { OpportunityType } from "../../firestore";
import type { Client } from "../../PracticesStore/Client";
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
          {!client.eligibilityStatus.compliantReporting &&
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
    // track when clients are displayed in the list
    useEffect(
      () => {
        client.trackListViewed(opportunity);
      },
      // Client instance references are not stable across subscription updates,
      // but the underlying data will be. This prevents logging clients twice when, e.g.,
      // the entire list is refreshed due to more clients being added to it
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [client.pseudonymizedId]
    );

    return (
      <ClientCapsule
        client={client}
        status={getStatusMessage(client, opportunity)}
        {...otherProps}
      />
    );
  }
);
