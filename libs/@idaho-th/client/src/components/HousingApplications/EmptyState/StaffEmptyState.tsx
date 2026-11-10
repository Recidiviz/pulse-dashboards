// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import React from "react";

import UsersIcon from "../../assets/users.svg?react";
import * as Styled from "./EmptyState.styles";

export const StaffEmptyState = () => {
  return (
    <Styled.Container>
      <Styled.Wrapper>
        <Styled.Icon aria-hidden="true">
          <UsersIcon />
        </Styled.Icon>
        <Styled.TextGroup>
          <Styled.Title>No applications uploaded yet</Styled.Title>
          <Styled.Subtitle>
            Upload a PDF of a client’s IDOC Housing Application. We’ll scan it
            to find eligible providers.
          </Styled.Subtitle>
        </Styled.TextGroup>
      </Styled.Wrapper>
    </Styled.Container>
  );
};
