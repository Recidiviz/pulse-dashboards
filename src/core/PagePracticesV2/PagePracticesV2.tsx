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

import cssVars from "../CoreConstants.scss";
import PracticesSearch from "../PracticesSearch";
import PracticesTopBar from "../PracticesTopBar";

const Wrapper = styled.div`
  display: flex;
  font: ${cssVars.fontUiSans16};
  justify-content: center;
  padding: 0 ${spacing.md}px;
  position: relative;
  width: 100%;

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    padding-left: 4rem;
    padding-right: 0;
  }
`;

const Contents = styled.div`
  padding-top: ${spacing.xxl}px;
  flex: 0 1 872px;
`;

const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${spacing.lg}px 0;
  width: 100%;
`;

const PagePracticesV2: React.FC = () => {
  return (
    <Wrapper>
      <PracticesTopBar />
      <Contents>
        <PracticesSearch />
        <Divider />
      </Contents>
    </Wrapper>
  );
};

export default PagePracticesV2;
