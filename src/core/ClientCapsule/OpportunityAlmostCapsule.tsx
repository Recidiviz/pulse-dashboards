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
import { differenceInCalendarDays } from "date-fns";
import { keys } from "mobx";
import { observer } from "mobx-react-lite";

import { OpportunityType } from "../../firestore";
import type { Client } from "../../PracticesStore/Client";
import ClientCapsule, { ClientCapsuleProps } from "./ClientCapsule";

type Props = Omit<ClientCapsuleProps, "status"> & {
  opportunity: OpportunityType;
};

function getStatusMessage(client: Client, opportunity: OpportunityType) {
  switch (opportunity) {
    case "compliantReporting": {
      const compliantReportingCriteria =
        client.opportunitiesAlmostEligible.compliantReporting;
      const { almostEligibleCriteria } = compliantReportingCriteria ?? {};

      // the first implies the second but Typescript cannot seem to infer that
      if (
        !compliantReportingCriteria ||
        !almostEligibleCriteria ||
        keys(almostEligibleCriteria).length === 0
      ) {
        // in practice we do not expect this to ever happen
        // because we will catch these cases upstream
        return "Status unknown";
      }

      const criteria = keys(
        almostEligibleCriteria
      ) as (keyof typeof almostEligibleCriteria)[];

      if (criteria.length > 1) {
        return `Needs ${criteria.length} updates`;
      }

      // from here on we know there is only one valid criterion
      // so we can stop as soon as we find it
      const criterion = criteria[0];
      switch (criterion) {
        case "passedDrugScreenNeeded":
          return "Needs one more passed drug screen";
        case "paymentNeeded":
          return "Needs one more payment";
        case "currentLevelEligibilityDate":
          return `Needs ${differenceInCalendarDays(
            almostEligibleCriteria.currentLevelEligibilityDate as Date,
            new Date()
          )} more days on ${client.supervisionLevel}`;
        case "seriousSanctionsEligibilityDate":
          return `Needs ${differenceInCalendarDays(
            almostEligibleCriteria.seriousSanctionsEligibilityDate as Date,
            new Date()
          )} more days without sanction higher than level 1`;
        case "recentRejectionCodes":
          return `Double check ${almostEligibleCriteria.recentRejectionCodes?.join(
            "/"
          )} contact note`;
        default:
          return assertNever(criterion);
      }
    }
    default:
      return assertNever(opportunity);
  }
}

export const OpportunityAlmostCapsule = observer(
  ({ client, opportunity, ...otherProps }: Props) => {
    return (
      <ClientCapsule
        client={client}
        status={getStatusMessage(client, opportunity)}
        {...otherProps}
      />
    );
  }
);
