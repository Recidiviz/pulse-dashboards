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
  Sans16,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Opportunity } from "../../WorkflowsStore";
import { useStatusColors } from "../utils/workflowsUtils";
import { InfoButton } from "./InfoButton";
import OpportunityRecommendedLanguageModal from "./OpportunityRecommendedLanguageModal";
import { InfoTooltipWrapper } from "./styles";

const Wrapper = styled.ul<{ alert?: boolean }>`
  ${typography.Sans14}
  list-style: none;
  margin: ${(props) =>
    props.alert ? `${rem(spacing.sm)} 0` : `${rem(spacing.md)} 0`};
  padding: 0;
`;

const KeepTogether = styled.span`
  white-space: nowrap;
`;

const CriterionHeading = styled(Sans16)<{ isFirst?: boolean }>`
  margin-top: ${(props) => (props.isFirst ? "0" : rem(spacing.md))};
  grid-column: 1 / 3;
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

export const CriteriaList = observer(function CriteriaList({
  opportunity,
}: {
  opportunity: Opportunity;
}): React.ReactElement {
  const colors = useStatusColors(opportunity);

  const alert = opportunity.config.isAlert;

  return (
    <Wrapper
      style={{ color: colors.text }}
      alert={alert}
      className="CriteraList"
    >
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
                    <InfoButton infoUrl={opportunity.config.methodologyUrl} />
                  </InfoTooltipWrapper>
                </>
              )}
            </CriterionContentWrapper>
          </CriterionWrapper>
        );
      })}
      {opportunity.requirementsMet.map(
        ({ text, tooltip, isHeading, key }, i) => {
          // split text so we can prevent orphaned tooltips
          const textTokens = text.split(" ");
          return (
            <CriterionWrapper key={key ?? text}>
              {isHeading ? (
                <CriterionHeading isFirst={i === 0}>{text}</CriterionHeading>
              ) : (
                <>
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
                            infoUrl={opportunity.config.methodologyUrl}
                          />
                        </InfoTooltipWrapper>
                      )}
                    </KeepTogether>
                  </CriterionContentWrapper>
                </>
              )}
            </CriterionWrapper>
          );
        },
      )}
    </Wrapper>
  );
});
