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
import { UsIaEarlyDischargeConfiguration } from "./UsIa/UsIaEarlyDischargeConfiguration";
import { UsIaSupervisionLevelDowngradeConfiguration } from "./UsIa/UsIaSupervisionLevelDischargeConfiguration";
import { LSUConfiguration } from "./UsId/LSUConfiguration";
import { UsIdEarnedDischargeConfiguration } from "./UsId/UsIdEarnedDischargeConfiguration";
import { UsIdFacilitiesConfiguration } from "./UsId/UsIdFacilitiesConfiguration";
import { UsMeEarlyTerminationConfiguration } from "./UsMe/UsMeEarlyTerminationConfiguration";
import { UsMeSCCPConfiguration } from "./UsMe/UsMeSCCPConfiguration";
import { UsMiCustodyLevelDowngradeConfiguration } from "./UsMi/UsMiCustodyLevelDowngradeConfiguration";
import { UsMoOverdueRestrictiveHousingConfiguration } from "./UsMo/UsMoOverdueRestrictiveHousingConfiguration";
import { UsMoWorkReleaseConfiguration } from "./UsMo/UsMoWorkReleaseConfiguration";
import { UsNdTransferToMinFacility } from "./UsNd/UsNdTransferToMinFacility";
import { UsOrEarnedDischargeSentenceConfiguration } from "./UsOr/UsOrEarnedDischargeSentenceConfiguration";
import { CompliantReportingConfiguration } from "./UsTn/CompliantReportingConfiguration";
import { UsTnCompliantReporting2025PolicyConfiguration } from "./UsTn/UsTnCompliantReporting2025PolicyConfiguration";
import { UsTnSuspensionofDirectSupervisionConfiguration } from "./UsTn/UsTnSuspensionofDirectSupervisionConfiguration";
import { UsUtEarlyTerminationConfiguration } from "./UsUt/UsUtEarlyTerminationConfiguration";

const customOpportunityConfigurations: Partial<
  Record<OpportunityType, typeof ApiOpportunityConfiguration>
> = {
  // Arizona
  usAzReleaseToDTP: UsAzReleaseToDTPConfiguration,
  usAzReleaseToTPR: UsAzReleaseToTPRConfiguration,

  // Iowa
  usIaCompleteSupervisionLevelDowngrade:
    UsIaSupervisionLevelDowngradeConfiguration,
  usIaEarlyDischarge: UsIaEarlyDischargeConfiguration,

  // Idaho
  earnedDischarge: UsIdEarnedDischargeConfiguration,
  LSU: LSUConfiguration,
  usIdCRCResidentWorker: UsIdFacilitiesConfiguration,
  usIdCRCWorkRelease: UsIdFacilitiesConfiguration,
  usIdExpandedCRC: UsIdFacilitiesConfiguration,

  // Maine
  usMeSCCP: UsMeSCCPConfiguration,
  usMeEarlyTermination: UsMeEarlyTerminationConfiguration,

  // Michigan
  usMiCustodyLevelDowngrade: UsMiCustodyLevelDowngradeConfiguration,

  // Missouri
  usMoOutsideClearance: UsMoWorkReleaseConfiguration,
  usMoOverdueRestrictiveHousingInitialHearing:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoOverdueRestrictiveHousingRelease:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoOverdueRestrictiveHousingReviewHearing:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoWorkRelease: UsMoWorkReleaseConfiguration,

  // North Dakota
  // This is a non-constructed opportunity that is being customized
  ["usNdTransferToMinFacility" as OpportunityType]: UsNdTransferToMinFacility,

  // Oregon
  usOrEarnedDischargeSentence: UsOrEarnedDischargeSentenceConfiguration,

  // Tennessee
  compliantReporting: CompliantReportingConfiguration,
  usTnCompliantReporting2025Policy:
    UsTnCompliantReporting2025PolicyConfiguration,
  usTnSuspensionOfDirectSupervision:
    UsTnSuspensionofDirectSupervisionConfiguration,

  // Utah
  usUtEarlyTermination: UsUtEarlyTerminationConfiguration,
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
