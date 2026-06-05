// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { TenantId } from "../../../../../RootStore/types";
import { PartialRecord } from "../../../../../utils/typeUtils";
import { IApiOpportunityConfiguration } from "../../interfaces";
import {
  usTnBiannualOtherReclassificationConfiguration,
  usTnBiannualOtherReclassificationV2Configuration,
} from "./UsTn/raw/UsTnBiannualOtherReclassificationConfiguration";
import {
  usTnSeriousMisconductUpgradeConfiguration,
  usTnSeriousMisconductUpgradeV2Configuration,
} from "./UsTn/raw/UsTnSeriousMisconductUpgradeConfiguration";
import {
  usTnTrusteeTransferConfiguration,
  usTnTrusteeTransferV2Configuration,
} from "./UsTn/raw/UsTnTrusteeTransferConfiguration";

type LocalConfigMapping = PartialRecord<
  OpportunityType,
  IApiOpportunityConfiguration
>;

export const localOpportunityConfigParams: PartialRecord<
  TenantId,
  LocalConfigMapping
> = {
  US_TN: {
    usTnTrusteeTransfer: usTnTrusteeTransferConfiguration,
    usTnBiannualOther: usTnBiannualOtherReclassificationConfiguration,
    usTnSeriousMisconductUpgrade: usTnSeriousMisconductUpgradeConfiguration,
    usTnTrusteeTransferV2: usTnTrusteeTransferV2Configuration,
    usTnBiannualOtherV2: usTnBiannualOtherReclassificationV2Configuration,
    usTnSeriousMisconductUpgradeV2: usTnSeriousMisconductUpgradeV2Configuration,
  },
};

export function getLocalOpportunityRawConfigs(
  tenantId: TenantId,
): LocalConfigMapping | undefined {
  if (!(tenantId in localOpportunityConfigParams)) return undefined;

  return localOpportunityConfigParams[tenantId];
}
