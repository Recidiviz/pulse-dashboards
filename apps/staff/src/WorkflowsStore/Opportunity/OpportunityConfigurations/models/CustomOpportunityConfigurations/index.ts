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

import UserStore from "../../../../../RootStore/UserStore";
import { OpportunityType } from "../../..";
import { IApiOpportunityConfiguration, OpportunityConfiguration } from "../..";
import { ApiOpportunityConfiguration } from "../ApiOpportunityConfigurationImpl";
import { UsAzTransitionOverdueConfiguration } from "./UsAz/UsAzTransitionOverdueConfiguration";
import { UsIdPastFTRD } from "./UsId/UsIdPastFTRDConfiguration";
import { UsMeEarlyTerminationConfiguration } from "./UsMe/UsMeEarlyTerminationConfiguration";
import { UsMeFurloughReleaseConfiguration } from "./UsMe/UsMeFurloughReleaseConfiguration";
import { UsMeMediumTrusteeConfiguration } from "./UsMe/UsMeMediumTrusteeConfiguration";
import { UsMeSCCPConfiguration } from "./UsMe/UsMeSCCPConfiguration";
import { UsMeWorkReleaseConfiguration } from "./UsMe/UsMeWorkReleaseConfiguration";
import { UsMiEarlyDischargeConfiguration } from "./UsMi/UsMiEarlyDischargeConfiguration";
import { UsMoOverdueRestrictiveHousingConfiguration } from "./UsMo/UsMoOverdueRestrictiveHousingConfiguration";
import { UsNdMinimumCustodyConfiguration } from "./UsNd/UsNdMinimumCustodyConfiguration";
import { UsOrEarnedDischargeSentenceConfiguration } from "./UsOr/UsOrEarnedDischargeSentenceConfiguration";

const localCustomOpportunityConfigurations: Partial<
  Record<OpportunityType, typeof ApiOpportunityConfiguration>
> = {
  usMoOverdueRestrictiveHousingInitialHearing:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoOverdueRestrictiveHousingRelease:
    UsMoOverdueRestrictiveHousingConfiguration,
  usMoOverdueRestrictiveHousingReviewHearing:
    UsMoOverdueRestrictiveHousingConfiguration,
  pastFTRD: UsIdPastFTRD,
  usMeSCCP: UsMeSCCPConfiguration,
  usMeEarlyTermination: UsMeEarlyTerminationConfiguration,
  usMeWorkRelease: UsMeWorkReleaseConfiguration,
  usMeFurloughRelease: UsMeFurloughReleaseConfiguration,
  usMeMediumTrustee: UsMeMediumTrusteeConfiguration,
  usMiEarlyDischarge: UsMiEarlyDischargeConfiguration,
};

const adminPanelOnlyCustomOpportunityConfigurations: Partial<
  Record<string, typeof ApiOpportunityConfiguration>
> = {
  usAzOverdueForACISDTP: UsAzTransitionOverdueConfiguration,
  usAzOverdueForACISTPR: UsAzTransitionOverdueConfiguration,
  usNdATP: UsNdMinimumCustodyConfiguration,
  usNdTransferToMinFacility: UsNdMinimumCustodyConfiguration,
  usOrEarnedDischargeSentence: UsOrEarnedDischargeSentenceConfiguration,
};

const customOpportunityConfigurations: Partial<
  Record<string, typeof ApiOpportunityConfiguration>
> = {
  ...localCustomOpportunityConfigurations,
  ...adminPanelOnlyCustomOpportunityConfigurations,
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
