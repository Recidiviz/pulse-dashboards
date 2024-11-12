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

import {
  Icon,
  IconSVG,
  palette,
  Sans14,
  Sans16,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { ReactElement } from "react";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Opportunity, OpportunityRequirement } from "../../WorkflowsStore";
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

const CriteriaSectionHeading = styled(Sans14)<{ isFirst?: boolean }>`
  margin-top: ${(props) => (props.isFirst ? "0" : rem(spacing.md))};
  color: ${palette.slate80};
  margin-bottom: ${rem(spacing.sm)};
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
  margin: 0 0 ${rem(spacing.sm)};
  line-height: 1.3;
`;

export const CriteriaList = observer(function CriteriaList({
  opportunity,
}: {
  opportunity: Opportunity;
}): React.ReactElement {
  const colors = useStatusColors(opportunity);

  const featureVariants = useFeatureVariants();

  const alert = opportunity.config.isAlert;
  const methodologyUrl = opportunity.config.methodologyUrl;

  const reqToCriterion = (
    { isHeading, text, tooltip, key }: OpportunityRequirement,
    i: number,
    iconType: ReactElement,
    useRecommendedLanguage?: boolean,
  ) => {
    const tooltipElem = (
      <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
        <InfoButton infoUrl={methodologyUrl} />
      </InfoTooltipWrapper>
    );

    const recommendedLanguageElem = (
      <>
        <OpportunityRecommendedLanguageModal opportunity={opportunity}>
          {text}
        </OpportunityRecommendedLanguageModal>
        {tooltip && <> {tooltipElem}</>}
      </>
    );

    // if text doesn't need to be wrapped, split it so we can prevent orphaned tooltips
    const textTokens = text.split(" ");
    const splitTextElem = (
      <>
        {textTokens.slice(0, -1).join(" ")}{" "}
        <KeepTogether>
          {textTokens.slice(-1)}
          {tooltip && <> {tooltipElem}</>}
        </KeepTogether>
      </>
    );

    return (
      <CriterionWrapper key={key ?? text} alert={alert}>
        {isHeading ? (
          <CriterionHeading isFirst={i === 0}>{text}</CriterionHeading>
        ) : (
          <>
            {iconType}
            <CriterionContentWrapper>
              {useRecommendedLanguage ? recommendedLanguageElem : splitTextElem}
            </CriterionContentWrapper>
          </>
        )}
      </CriterionWrapper>
    );
  };

  const almostMetReqToCriterion = (req: OpportunityRequirement, i: number) => {
    const icon = (
      <CriterionIcon kind={IconSVG.Error} color={colors.iconAlmost} size={16} />
    );
    return reqToCriterion(req, i, icon, true);
  };

  const metReqToCriterion = (req: OpportunityRequirement, i: number) => {
    const icon = (
      <CriterionIcon
        kind={alert ? IconSVG.Error : IconSVG.Success}
        color={colors.icon}
        size={16}
      />
    );
    return reqToCriterion(req, i, icon);
  };

  const nonOMSReqToCriterion = (req: OpportunityRequirement, i: number) => {
    const icon = (
      <CriterionIcon kind={IconSVG.Check} color={palette.slate30} size={14} />
    );
    return reqToCriterion(req, i, icon);
  };

  return (
    <Wrapper
      style={{ color: colors.text }}
      alert={alert}
      className="CriteraList"
    >
      {opportunity.requirementsAlmostMet.length +
        opportunity.requirementsMet.length >
        0 &&
        featureVariants.nonOMSCriteria && (
          <CriteriaSectionHeading isFirst={true}>
            {opportunity.config.omsCriteriaHeader}
          </CriteriaSectionHeading>
        )}

      {opportunity.requirementsAlmostMet.map(almostMetReqToCriterion)}
      {opportunity.requirementsMet.map(metReqToCriterion)}

      {featureVariants.nonOMSCriteria &&
        opportunity.nonOMSRequirements.length > 0 && (
          <>
            <CriteriaSectionHeading>
              {opportunity.config.nonOMSCriteriaHeader}
            </CriteriaSectionHeading>
            {opportunity.nonOMSRequirements.map(nonOMSReqToCriterion)}
          </>
        )}
    </Wrapper>
  );
});
