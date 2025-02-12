// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { palette, zindex } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, memo, ReactNode } from "react";
import styled from "styled-components/macro";

import { useSkipNav } from "../SkipNav/SkipNav";
import { HEADER_PORTAL_ID, PAGE_LAYOUT_HEADER_GAP } from "./constants";

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  row-gap: ${rem(PAGE_LAYOUT_HEADER_GAP)};
`;

const Header = styled.header`
  background: ${palette.white};
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${zindex.modal.backdrop - 20};
`;

export const AppLayout: FC<{ header?: ReactNode; main: ReactNode }> = memo(
  function AppLayout({ main, header }) {
    const { MainContent, SkipNav, SkipNavController } = useSkipNav();
    return (
      <SkipNavController>
        <SkipNav />
        <Wrapper>
          <Header>
            {header}
            {/* This is a placeholder for components that may be rendered by ./HeaderPortal.
            This component should not give it any children or otherwise interfere with it */}
            <div id={HEADER_PORTAL_ID} />
          </Header>
          <MainContent>{main}</MainContent>
        </Wrapper>
      </SkipNavController>
    );
  },
);
