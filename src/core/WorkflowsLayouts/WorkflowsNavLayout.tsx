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
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import RecidivizLogo from "../RecidivizLogo";

const Wrapper = styled.div`
  background-color: ${palette.marble1};
  display: grid;
  grid-template-columns: ${rem(230)} minmax(0, ${rem(1268 + spacing.md)});
  min-height: 100vh;
  width: 100%;
`;

const Sidebar = styled.nav`
  grid-column: 1;
  padding: ${rem(spacing.md)};
`;

const Main = styled.main`
  grid-column: 2;
  padding-right: ${rem(spacing.md)};
  padding-top: ${rem(spacing.sm)};
`;

export const WorkflowsNavLayout: React.FC = ({ children }) => {
  return (
    <Wrapper>
      <Sidebar>
        <RecidivizLogo />
      </Sidebar>
      <Main>{children}</Main>
    </Wrapper>
  );
};
