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
  palette,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Opportunity } from "../../../PracticesStore";
import { StatusPalette } from "./common";

const CriterionIcon = styled(Icon)`
  grid-column: 1;
  /* slight vertical offset to approximate baseline alignment */
  margin-top: ${rem(1)};
`;

const CriterionContent = styled.div`
  grid-column: 2;
`;

const Wrapper = styled.ul`
  ${typography.Sans14}
  list-style: none;
  margin: ${rem(spacing.md)} 0;
  padding: 0;
`;

const Criterion = styled.li`
  display: grid;
  grid-template-columns: ${rem(spacing.lg)} 1fr;
  margin: 0 0 8px;
  line-height: 1.3;
`;

const KeepTogether = styled.span`
  white-space: nowrap;
`;

const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

const InfoLink = styled.a`
  color: ${palette.slate30};

  &:hover,
  &:focus {
    color: ${palette.slate60};
  }
`;

const InfoButton = () => (
  <InfoLink
    href="https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view?usp=sharing"
    target="_blank"
    rel="noreferrer"
  >
    <Icon kind="Info" size={12} />
  </InfoLink>
);

export const CriteriaList = ({
  opportunity,
  colors,
}: {
  opportunity: Opportunity;
  colors: StatusPalette;
}): React.ReactElement => {
  return (
    <Wrapper style={{ color: colors.text }}>
      {opportunity.requirementsMet.map(({ text, tooltip }) => {
        // split text so we can prevent orphaned tooltips
        const textTokens = text.split(" ");
        return (
          <Criterion key={text}>
            <CriterionIcon
              kind={IconSVG.Success}
              color={colors.icon}
              size={16}
            />
            <CriterionContent>
              {textTokens.slice(0, -1).join(" ")}{" "}
              <KeepTogether>
                {textTokens.slice(-1)}{" "}
                {tooltip && (
                  <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                    <InfoButton />
                  </InfoTooltipWrapper>
                )}
              </KeepTogether>
            </CriterionContent>
          </Criterion>
        );
      })}
    </Wrapper>
  );
};
