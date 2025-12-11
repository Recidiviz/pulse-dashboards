// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import styled from "styled-components";

export const RadioButton = styled.input.attrs({
  type: "radio",
})`
  display: inline-block;
  vertical-align: top;
  margin-right: 0.5em;
`;

const LeaderContainer = styled.div`
  overflow: hidden;
  flex-grow: 1;

  &:after {
    float: left;
    width: 0;
    white-space: nowrap;
    content: "${".".repeat(200)}";
  }
  span {
    background: white;
    padding-right: 0.2em;
  }
`;

export const TextWithLeader: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <LeaderContainer>
    <span>{children}</span>
  </LeaderContainer>
);
