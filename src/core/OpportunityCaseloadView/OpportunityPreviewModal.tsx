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

import React from "react";

import { Opportunity, OpportunityType } from "../../WorkflowsStore";
import { CompliantReportingClientProfile } from "../WorkflowsClientProfile";
import { EarlyTerminationClientProfile } from "../WorkflowsClientProfile/EarlyTerminationClientProfile";
import { EarnedDischargeClientProfile } from "../WorkflowsClientProfile/EarnedDischargeClientProfile";
import { LSUClientProfile } from "../WorkflowsClientProfile/LSUClientProfile";
import { PastFTRDClientProfile } from "../WorkflowsClientProfile/PastFTRDClientProfile";
import { SupervisionLevelDowngradeClientProfile } from "../WorkflowsClientProfile/SupervisionLevelDowngradeClientProfile";
import { UsIdSupervisionLevelDowngradeClientProfile } from "../WorkflowsClientProfile/UsIdSupervisionLevelDowngradeClientProfile";
import { UsMeSCCPResidentProfile } from "../WorkflowsClientProfile/UsMeSCCPResidentProfile";
import { UsMoRestrictiveHousingStatusHearingResidentProfile } from "../WorkflowsClientProfile/UsMoRestrictiveHousingStatusHearingResidentProfile";
import { UsTnExpirationClientProfile } from "../WorkflowsClientProfile/UsTnExpirationClientProfile";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";

const PAGE_CONTENT: Record<OpportunityType, any> = {
  compliantReporting: {
    previewContents: (
      <CompliantReportingClientProfile
        formDownloadButton={false}
        formLinkButton
      />
    ),
  },
  earlyTermination: {
    previewContents: (
      <EarlyTerminationClientProfile
        formDownloadButton={false}
        formLinkButton
      />
    ),
  },
  earnedDischarge: {
    previewContents: <EarnedDischargeClientProfile formLinkButton />,
  },
  LSU: {
    previewContents: <LSUClientProfile formLinkButton />,
  },
  pastFTRD: {
    previewContents: <PastFTRDClientProfile />,
  },
  supervisionLevelDowngrade: {
    previewContents: <SupervisionLevelDowngradeClientProfile />,
  },
  usIdSupervisionLevelDowngrade: {
    previewContents: <UsIdSupervisionLevelDowngradeClientProfile />,
  },
  usMeSCCP: {
    previewContents: <UsMeSCCPResidentProfile formLinkButton />,
  },
  usTnExpiration: {
    previewContents: <UsTnExpirationClientProfile formLinkButton />,
  },
  usMoRestrictiveHousingStatusHearing: {
    previewContents: <UsMoRestrictiveHousingStatusHearingResidentProfile />,
  },
};

type OpportunityCaseloadProps = {
  opportunity?: Opportunity;
};

export function OpportunityPreviewModal({
  opportunity,
}: OpportunityCaseloadProps): JSX.Element {
  return (
    <WorkflowsPreviewModal
      isOpen={!!opportunity}
      onAfterOpen={() => opportunity?.trackPreviewed()}
      pageContent={
        opportunity && PAGE_CONTENT[opportunity.type].previewContents
      }
    />
  );
}
