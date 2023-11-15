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

import { palette, Sans16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import { EligibilityStatus } from "../OpportunityStatus";
import { useStatusColors } from "../utils/workflowsUtils";
import { Separator } from "./styles";

const TitleText = styled(Sans16)`
  color: ${palette.pine1};
  display: inline-block;
`;

const OpportunityLabel = styled.span``;

type OpportunityModuleHeaderProps = {
  opportunity: Opportunity;
};

export const OpportunityModuleHeader: React.FC<OpportunityModuleHeaderProps> =
  observer(function OpportunityModuleHeader({ opportunity }) {
    const {
      workflowsStore: { featureVariants },
    } = useRootStore();
    const colors = useStatusColors(opportunity);
    const opportunityLabel = OPPORTUNITY_CONFIGS[opportunity.type].label;

    return (
      <TitleText>
        <OpportunityLabel>{opportunityLabel}</OpportunityLabel>
        {opportunity.showEligibilityStatus("OpportunityModuleHeader") && (
          <>
            <Separator> • </Separator>
            <span
              className="EligibilityStatus"
              style={{
                color: featureVariants.responsiveRevamp
                  ? palette.pine1
                  : colors.link,
              }}
            >
              <EligibilityStatus opportunity={opportunity} />
            </span>
          </>
        )}
      </TitleText>
    );
  });
