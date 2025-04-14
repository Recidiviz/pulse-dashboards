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

import { OpportunityType } from "~datatypes";

import UserStore from "../../../../../RootStore/UserStore";
import { IApiOpportunityConfiguration, OpportunityConfiguration } from "../..";
import { ApiOpportunityConfiguration } from "../ApiOpportunityConfigurationImpl";
import { UsAzReleaseToDTPConfiguration } from "./UsAz/UsAzReleaseToDTPConfiguration";
import { UsAzReleaseToTPRConfiguration } from "./UsAz/UsAzReleaseToTPRConfiguration";
import { LSUConfiguration } from "./UsId/LSUConfiguration";
import { UsIdFacilitiesConfiguration } from "./UsId/UsIdFacilitiesConfiguration";
import { UsMeEarlyTerminationConfiguration } from "./UsMe/UsMeEarlyTerminationConfiguration";
import { UsMeSCCPConfiguration } from "./UsMe/UsMeSCCPConfiguration";
import { UsMoOverdueRestrictiveHousingConfiguration } from "./UsMo/UsMoOverdueRestrictiveHousingConfiguration";
import { UsNdTransferToMinFacility } from "./UsNd/UsNdTransferToMinFacility";
import { UsOrEarnedDischargeSentenceConfiguration } from "./UsOr/UsOrEarnedDischargeSentenceConfiguration";
import { CompliantReportingConfiguration } from "./UsTn/CompliantReportingConfiguration";

const customOpportunityConfigurations: Partial<
  Record<OpportunityType, typeof ApiOpportunityConfiguration>
> = {
  usMoOverdueRestrictiveHousingInitialHearing:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoOverdueRestrictiveHousingRelease:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoOverdueRestrictiveHousingReviewHearing:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMeSCCP: UsMeSCCPConfiguration,
  usMeEarlyTermination: UsMeEarlyTerminationConfiguration,
  usAzReleaseToTPR: UsAzReleaseToTPRConfiguration,
  usAzReleaseToDTP: UsAzReleaseToDTPConfiguration,
  usIdCRCResidentWorker: UsIdFacilitiesConfiguration,
  usIdCRCWorkRelease: UsIdFacilitiesConfiguration,
  usIdExpandedCRC: UsIdFacilitiesConfiguration,
  compliantReporting: CompliantReportingConfiguration,
  LSU: LSUConfiguration,
  usOrEarnedDischargeSentence: UsOrEarnedDischargeSentenceConfiguration,
  // This is a non-constructed opportunity that is being customized
  ["usNdTransferToMinFacility" as OpportunityType]: UsNdTransferToMinFacility,
};

export function apiOpportunityConfigurationFactory(
  opportunityType: OpportunityType,
  configurationObject: IApiOpportunityConfiguration,
  userStore: UserStore,
): OpportunityConfiguration {
  const ConfigClass =
    customOpportunityConfigurations[opportunityType] ??
    ApiOpportunityConfiguration;
  return new ConfigClass(configurationObject, userStore);
}
