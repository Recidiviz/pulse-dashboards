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
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

const CriterionIcon = styled(Icon)`
  grid-column: 1;
  /* slight vertical offset to approximate baseline alignment */
  margin-top: ${rem(1)};
`;

const CriterionContent = styled.div`
  grid-column: 2;
`;

const List = styled.ul`
  color: ${palette.pine4};
  list-style: none;
  font-size: ${rem(14)};
  margin: ${rem(spacing.md)} 0;
  padding: 0;
`;

const Criterion = styled.li`
  display: grid;
  grid-template-columns: ${rem(spacing.lg)} 1fr;
  margin: 0 0 8px;
  line-height: 1.3;
`;

export type EligibilityCriterion = { text: string; tooltip?: string };

type CriteriaListProps = {
  criteria: EligibilityCriterion[];
};

export const CriteriaList: React.FC<CriteriaListProps> = ({ criteria }) => {
  return (
    <List>
      {criteria.map(({ text, tooltip }) => (
        <TooltipTrigger contents={tooltip} key={text}>
          <Criterion>
            <CriterionIcon
              kind={IconSVG.Success}
              color={palette.signal.highlight}
              size={16}
            />
            <CriterionContent>{text}</CriterionContent>
          </Criterion>
        </TooltipTrigger>
      ))}
    </List>
  );
};
