// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { FeatureVariant, TenantId } from "../../RootStore/types";
import { Opportunity, OpportunityType } from "./types";
import { usCaSupervisionLevelDowngradeConfig as usCaSupervisionLevelDowngrade } from "./UsCa/UsCaSupervisionLevelDowngradeOpportunity/config";
import { usIdEarnedDischargeConfig as earnedDischarge } from "./UsId/EarnedDischargeOpportunity/config";
import { usIdLSUConfig as LSU } from "./UsId/LSUOpportunity/config";
import { usIdCRCResidentWorkerConfig as usIdCRCResidentWorker } from "./UsId/UsIdCRCResidentWorkerOpportunity/config";
import { usIdCRCWorkReleaseConfig as usIdCRCWorkRelease } from "./UsId/UsIdCRCWorkReleaseOpportunity/config";
import { usIdExpandedCRCConfig as usIdExpandedCRC } from "./UsId/UsIdExpandedCRCOpportunity/config";
import { usIdPastFTRDConfig as pastFTRD } from "./UsId/UsIdPastFTRDOpportunity/config";
import { usIdSupervisionLevelDowngradeConfig as usIdSupervisionLevelDowngrade } from "./UsId/UsIdSupervisionLevelDowngradeOpportunity/config";
import { usMeEarlyTerminationConfig as usMeEarlyTermination } from "./UsMe/UsMeEarlyTerminationOpportunity/config";
import { usMeFurloughReleaseConfig as usMeFurloughRelease } from "./UsMe/UsMeFurloughReleaseOpportunity/config";
import { usMeSCCPConfig as usMeSCCP } from "./UsMe/UsMeSCCPOpportunity/config";
import { usMeWorkReleaseConfig as usMeWorkRelease } from "./UsMe/UsMeWorkReleaseOpportunity/config";
import { usMiClassificationReviewConfig as usMiClassificationReview } from "./UsMi/UsMiClassificationReviewOpportunity/config";
import { usMiEarlyDischargeConfig as usMiEarlyDischarge } from "./UsMi/UsMiEarlyDischargeOpportunity/config";
import { usMiMinimumTelephoneReportingConfig as usMiMinimumTelephoneReporting } from "./UsMi/UsMiMinimumTelephoneReportingOpportunity/config";
import { usMiPastFTRDConfig as usMiPastFTRD } from "./UsMi/UsMiPastFTRDOpportunity/config";
import { usMiSupervisionLevelDowngradeConfig as usMiSupervisionLevelDowngrade } from "./UsMi/UsMiSupervisionLevelDowngradeOpportunity/config";
import { usMoRestrictiveHousingStatusHearingConfig as usMoRestrictiveHousingStatusHearing } from "./UsMo/UsMoRestrictiveHousingStatusHearingOpportunity/config";
import { usNdEarlyTerminationConfig as earlyTermination } from "./UsNd/UsNdEarlyTerminationOpportunity/config";
import { usTnCompliantReportingConfig as compliantReporting } from "./UsTn/CompliantReportingOpportunity/config";
import { usTnCustodyLevelDowngradeConfig as usTnCustodyLevelDowngrade } from "./UsTn/UsTnCustodyLevelDowngradeOpportunity/config";
import { usTnExpirationConfig as usTnExpiration } from "./UsTn/UsTnExpirationOpportunity/config";
import { usTnSupervisionLevelDowngradeConfig as supervisionLevelDowngrade } from "./UsTn/UsTnSupervisionLevelDowngradeOpportunity/config";

export type OpportunityConfig = {
  stateCode: TenantId;
  urlSection: string;
  featureVariant?: FeatureVariant;
  label: string;
  snooze?: {
    defaultSnoozeUntilFn: (snoozedOn: Date, opportunity?: Opportunity) => Date;
  };
};

type OpportunityConfigMap = Record<OpportunityType, OpportunityConfig>;

export const OPPORTUNITY_CONFIGS: OpportunityConfigMap = {
  /* US_CA */
  usCaSupervisionLevelDowngrade,

  /* US_ID */
  earnedDischarge,
  LSU,
  pastFTRD,
  usIdExpandedCRC,
  usIdCRCResidentWorker,
  usIdCRCWorkRelease,
  usIdSupervisionLevelDowngrade,

  /* US_ME */
  usMeEarlyTermination,
  usMeFurloughRelease,
  usMeSCCP,
  usMeWorkRelease,

  /* US_MI */
  usMiClassificationReview,
  usMiEarlyDischarge,
  usMiMinimumTelephoneReporting,
  usMiPastFTRD,
  usMiSupervisionLevelDowngrade,

  /* US_MO */
  usMoRestrictiveHousingStatusHearing,

  /* US_ND */
  earlyTermination,

  /* US_TN */
  compliantReporting,
  usTnCustodyLevelDowngrade,
  usTnExpiration,
  supervisionLevelDowngrade,
};
