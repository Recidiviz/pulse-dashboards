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

type EligibilityStatusProps = {
  opportunity: Opportunity;
  includeReasons?: boolean;
};
export const EligibilityStatus: React.FC<EligibilityStatusProps> = observer(
  function EligibilityStatus({ opportunity, includeReasons }) {
    const {
      almostEligible,
      almostEligibleStatusMessage,
      eligibleStatusMessage,
      defaultEligibility,
      denial,
      config: { isAlert, deniedTabTitle },
    } = opportunity;

    if (!isHydrated(opportunity)) return null;

    if (denial?.reasons.length) {
      let statusText;
      // TODO(#6224): Move this logic to OpportunityBase and individual opportunities
      if (deniedTabTitle === "Assessment Complete") {
        statusText = "Assessment completed";
        includeReasons = false; // Don't show "(ASSESSED)"
      } else {
        statusText = isAlert ? "Override" : "Currently ineligible";
      }

      return (
        <>
          {statusText}
          {includeReasons && ` (${denial.reasons.join(", ")})`}
        </>
      );
    }

    if (almostEligible) {
      return includeReasons && almostEligibleStatusMessage ? (
        <>{almostEligibleStatusMessage}</>
      ) : (
        <>Almost eligible</>
      );
    }

    if (defaultEligibility === "MAYBE") return <>May be eligible</>;

    return eligibleStatusMessage ? <>{eligibleStatusMessage}</> : <>Eligible</>;
  },
);
