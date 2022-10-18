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

import {
  Icon,
  IconSVG,
  Sans14,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Opportunity } from "../../WorkflowsStore";
import { WORKFLOWS_POLICY_OR_METHODOLOGY_URL } from "../utils/constants";
import { InfoButton, InfoTooltipWrapper, useStatusColors } from "./common";
import { OpportunityRecommendedLanguageModal } from "./OpportunityRecommendedLanguageModal";

const Wrapper = styled.ul<{ alert?: boolean }>`
  ${typography.Sans14}
  list-style: none;
  margin: ${(props) =>
    props.alert ? `${rem(spacing.xs)} 0` : `${rem(spacing.md)} 0`};
  padding: 0;
`;

const KeepTogether = styled.span`
  white-space: nowrap;
`;

const CriterionIcon = styled(Icon)`
  grid-column: 1;
  /* slight vertical offset to approximate baseline alignment */
  margin-top: ${rem(1)};
`;

const CriterionContentWrapper = styled(Sans14)`
  grid-column: 2;
`;

const CriterionWrapper = styled.li<{ alert?: boolean }>`
  display: grid;
  grid-template-columns: ${rem(spacing.lg)} 1fr;
  margin: ${(props) => (props.alert ? "0" : "0 0 8px")};
  line-height: 1.3;
`;

export const CriteriaList = observer(
  ({ opportunity }: { opportunity: Opportunity }): React.ReactElement => {
    const colors = useStatusColors(opportunity);

    // TODO: do this more generically once the "alert" flavor of opportunity stabilizes
    const alert = opportunity.type === "pastFTRD";

    return (
      <Wrapper style={{ color: colors.text }} alert={alert}>
        {opportunity.requirementsAlmostMet.map(({ text, tooltip }) => {
          return (
            <CriterionWrapper key={text} alert={alert}>
              <CriterionIcon
                kind={IconSVG.Error}
                color={colors.iconAlmost}
                size={16}
              />
              <CriterionContentWrapper>
                <OpportunityRecommendedLanguageModal opportunity={opportunity}>
                  {text}
                </OpportunityRecommendedLanguageModal>
                {tooltip && (
                  <>
                    {" "}
                    <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                      <InfoButton
                        infoUrl={
                          WORKFLOWS_POLICY_OR_METHODOLOGY_URL[opportunity.type]
                        }
                      />
                    </InfoTooltipWrapper>
                  </>
                )}
              </CriterionContentWrapper>
            </CriterionWrapper>
          );
        })}
        {opportunity.requirementsMet.map(({ text, tooltip }) => {
          // split text so we can prevent orphaned tooltips
          const textTokens = text.split(" ");
          return (
            <CriterionWrapper key={text}>
              <CriterionIcon
                kind={alert ? IconSVG.Error : IconSVG.Success}
                color={colors.icon}
                size={16}
              />
              <CriterionContentWrapper>
                {textTokens.slice(0, -1).join(" ")}{" "}
                <KeepTogether>
                  {textTokens.slice(-1)}{" "}
                  {tooltip && (
                    <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                      <InfoButton
                        infoUrl={
                          WORKFLOWS_POLICY_OR_METHODOLOGY_URL[opportunity.type]
                        }
                      />
                    </InfoTooltipWrapper>
                  )}
                </KeepTogether>
              </CriterionContentWrapper>
            </CriterionWrapper>
          );
        })}
      </Wrapper>
    );
  }
);
