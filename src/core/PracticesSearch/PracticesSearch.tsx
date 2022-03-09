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

import { palette, spacing } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components/macro";

const BAR_HEIGHT = 80;

const SearchBar = styled.div`
  align-items: center;
  background-color: ${palette.slate10};
  border-radius: ${BAR_HEIGHT / 2}px;
  color: ${palette.pine2};
  display: flex;
  height: ${BAR_HEIGHT}px;
  padding: ${spacing.md}px ${BAR_HEIGHT / 2}px;
  width: 100%;
`;

const SearchInput = styled.input`
  align-self: stretch;
  border: none;
  background: transparent;
  color: ${palette.pine2};
  flex: 1 1 auto;

  &::placeholder {
    color: ${palette.slate70};
  }
`;

const PracticesSearch: React.FC = () => {
  return (
    <SearchBar>
      <SearchInput placeholder="Search name, ID, or tag …" />
    </SearchBar>
  );
};

export default PracticesSearch;
