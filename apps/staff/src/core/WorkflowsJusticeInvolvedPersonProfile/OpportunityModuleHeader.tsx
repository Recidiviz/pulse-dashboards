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

import { Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useMatch } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";

import { Opportunity } from "../../WorkflowsStore";
import { WorkflowsBadgePill } from "../BadgePill/BadgePill";
import { useStatusColors } from "../utils/workflowsUtils";
import { WORKFLOWS_PATHS } from "../views";

const TitleText = styled(Sans16)`
  color: ${palette.pine1};
  line-height: 1.5;
  display: inline-block;
`;

const OpportunityLabelWithPill = styled.span`
  margin-right: ${rem(spacing.md)};
  line-height: 2;
`;

type OpportunityModuleHeaderProps = {
  opportunity: Opportunity;
};

export const EligibilityStatusPill = observer(function EligibilityStatusPill({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const { palette } = useStatusColors(opportunity);
  const text = opportunity.eligibilityStatusLabel();

  if (text !== null) {
    return <WorkflowsBadgePill text={text} palette={palette} />;
  }
});

export const OpportunityModuleHeader: React.FC<OpportunityModuleHeaderProps> =
  observer(function OpportunityModuleHeader({ opportunity }) {
    const isClientProfile = useMatch(WORKFLOWS_PATHS.clientProfile);
    const isResidentProfile = useMatch(WORKFLOWS_PATHS.residentProfile);
    const isFullProfilePage = isClientProfile || isResidentProfile;

    const showStatusPill =
      isFullProfilePage || opportunity.isSubmitted || !opportunity.isIneligible;
    return (
      <TitleText>
        <OpportunityLabelWithPill>
          {opportunity.config.label}
          {opportunity.labelAddendum}
        </OpportunityLabelWithPill>
        {showStatusPill && <EligibilityStatusPill opportunity={opportunity} />}
      </TitleText>
    );
  });
