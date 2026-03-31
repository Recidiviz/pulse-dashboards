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

import { Loading } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components";

import { publicPathwaysPalette } from "../styles/publicPathwaysPalette";

const indigo1 = publicPathwaysPalette.data.indigo1;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: inherit;

  /* Override Loading component colors */
  div div {
    border-top-color: ${indigo1} !important;
  }
`;

const PublicPathwaysLoading: React.FC = () => (
  <Wrapper>
    <Loading />
  </Wrapper>
);

export default PublicPathwaysLoading;
