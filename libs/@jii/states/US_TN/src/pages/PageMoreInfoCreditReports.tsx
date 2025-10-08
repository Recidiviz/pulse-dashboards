// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { usePageTitle } from "~@jii/common-ui";
import { State } from "~@jii/paths";

import { DefinitionView } from "../components/DefinitionView";
import { usTnCopy } from "../configs/copy";

// TODO(#10015): [US_TN][P2] Parameterize "more info" pages and generate footers
export function PageMoreInfoCreditReports() {
  const { moreInfo } = usTnCopy.monthlyCreditReportSummary;

  usePageTitle(moreInfo.heading);

  const pathParams = useTypedParams(State.Resident.UsTnMoreInformation);

  return (
    <DefinitionView
      {...moreInfo}
      moreInfoPageLinks={[
        {
          text: "Important Dates",
          url: State.Resident.UsTnMoreInformation.ImportantDates.buildPath(
            pathParams,
          ),
        },
      ]}
    />
  );
}
