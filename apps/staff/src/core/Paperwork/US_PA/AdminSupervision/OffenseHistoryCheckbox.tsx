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
import * as React from "react";
import styled from "styled-components/macro";

const ContentContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const Checkbox = styled.div`
  border: 0.5px solid black;
  width: 7px;
  height: 7px;
  margin-top: 1px;
  margin-right: 4px;
`;

const OffenseHistoryCheckbox: React.FC = () => {
  return (
    <ContentContainer>
      <Checkbox />
      YES
    </ContentContainer>
  );
};

export default OffenseHistoryCheckbox;
