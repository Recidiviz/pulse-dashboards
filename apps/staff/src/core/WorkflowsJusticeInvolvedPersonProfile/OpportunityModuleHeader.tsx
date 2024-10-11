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

import { palette, Pill, Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { EligibilityStatus } from "../OpportunityStatus";
import { useStatusColors } from "../utils/workflowsUtils";
import { Separator } from "./styles";

const TitleText = styled(Sans16)`
  color: ${palette.pine1};
  line-height: 1.5;
  display: inline-block;
`;

const EligibilityStatusPill = styled(Pill)<{ $borderColor: string }>`
  border-radius: ${rem(4)};
  border: 1px solid ${(props) => props.$borderColor};
  font-size: ${rem(12)};
  font-weight: 600;
  height: ${rem(20)};
  padding: 0 ${rem(6)};
  vertical-align: text-top;
`;

const OpportunityLabelWithPill = styled.span`
  margin-right: ${rem(spacing.md)};
  line-height: 2;
`;

const OpportunityLabelWithoutPill = styled.span``;

type OpportunityModuleHeaderProps = {
  opportunity: Opportunity;
};

export const OpportunityModuleHeader: React.FC<OpportunityModuleHeaderProps> =
  observer(function OpportunityModuleHeader({ opportunity }) {
    const colors = useStatusColors(opportunity);
    const { submittedOpportunityStatus } = useFeatureVariants();

    if (submittedOpportunityStatus) {
      return (
        <TitleText>
          <OpportunityLabelWithPill>
            {opportunity.config.label}
          </OpportunityLabelWithPill>
          <EligibilityStatusPill
            className="EligibilityStatus"
            filled
            color={colors.badgeBackground}
            textColor={colors.badgeText}
            $borderColor={colors.badgeBorder}
          >
            <EligibilityStatus opportunity={opportunity} />
          </EligibilityStatusPill>
        </TitleText>
      );
    }

    return (
      <TitleText>
        {opportunity.showEligibilityStatus("OpportunityModuleHeader") && (
          <>
            <OpportunityLabelWithoutPill>
              {opportunity.config.label}
            </OpportunityLabelWithoutPill>
            <Separator> • </Separator>
            <span
              className="EligibilityStatus"
              style={{
                color: palette.pine1,
              }}
            >
              <EligibilityStatus opportunity={opportunity} />
            </span>
          </>
        )}
      </TitleText>
    );
  });
