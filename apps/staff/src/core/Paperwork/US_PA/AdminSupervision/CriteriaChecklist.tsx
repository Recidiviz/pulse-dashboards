/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { CRITERIA_LABELS, GRAY_BACKGROUND, strings } from "./constants";
import { BlueCell, GreyCell, WhiteCell } from "./CriteriaChecklistCells";
import CriteriaChecklistCheckbox from "./CriteriaChecklistCheckbox";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(5, 1fr) / 31% 4% 14% 3% 30% 4% 14%;
  height: 60px;
  font-size: ${rem(8)};
`;

const SeparatorColumn = styled.div`
  grid-area: 4 / 4 / end / span 1;
  background-color: ${GRAY_BACKGROUND};
`;

const CriteriaChecklist: React.FC = () => {
  return (
    <ContentContainer>
      <GreyCell>{strings.continueHeader}</GreyCell>
      <BlueCell>{strings.dispositionHeader}</BlueCell>
      <CriteriaChecklistCheckbox row={2} column={6} span={2} />
      {CRITERIA_LABELS.map((label, index) => {
        const row = index < 2 ? 4 : 5;
        const column = index % 2 === 0 ? 1 : 5;
        return (
          <React.Fragment key={label}>
            <WhiteCell key={`cell ${label}`} row={row} column={column}>
              {label}
            </WhiteCell>
            <CriteriaChecklistCheckbox
              key={`checkbox ${label}`}
              row={row}
              column={column + 2}
            />
          </React.Fragment>
        );
      })}
      <SeparatorColumn />
    </ContentContainer>
  );
};

export default CriteriaChecklist;
