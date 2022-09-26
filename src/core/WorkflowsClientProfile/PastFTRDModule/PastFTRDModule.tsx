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

import { IconSVG, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import {
  CriterionContentWrapper,
  CriterionIcon,
  CriterionWrapper,
  STATUS_COLORS,
  TitleText,
  Wrapper,
} from "../common";
import { ClientProfileProps } from "../types";

const CriterionList = styled.ul`
  ${typography.Sans14}
  list-style: none;
  margin: ${rem(spacing.sm)} 0 0;
  padding: 0;
`;

export const PastFTRDModule = observer(({ client }: ClientProfileProps) => {
  if (!client.opportunities.pastFTRD) return null;

  const colors = STATUS_COLORS.alert;

  return (
    <Wrapper {...colors}>
      <TitleText>Past full-term release date</TitleText>
      <CriterionList>
        {client.opportunities.pastFTRD.requirementsMet.map(
          ({ text, tooltip }) => {
            return (
              <CriterionWrapper key={text} style={{ color: colors.text }}>
                <CriterionIcon
                  kind={IconSVG.Error}
                  color={colors.icon}
                  size={16}
                />
                <CriterionContentWrapper>{text}</CriterionContentWrapper>
              </CriterionWrapper>
            );
          }
        )}
      </CriterionList>
    </Wrapper>
  );
});
