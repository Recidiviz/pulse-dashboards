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

type EligibilityStatusProps = {
  opportunity: Opportunity;
  includeReasons?: boolean;
};
export const EligibilityStatus: React.FC<EligibilityStatusProps> = observer(
  ({ opportunity, includeReasons }) => {
    const {
      almostEligible,
      almostEligibleStatusMessage,
      defaultEligibility,
      denial,
      isHydrated,
      isAlert,
    } = opportunity;

    if (!isHydrated) return null;

    if (denial?.reasons.length) {
      const statusText = isAlert ? "Override" : "Currently ineligible";

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

    return <>Eligible</>;
  }
);
