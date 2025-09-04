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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "~@jii/data";

import { PAGE_LAYOUT_HEADER_GAP } from "../constants";

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  row-gap: ${rem(spacing.xxl)};
`;

/**
 * Ensures the provided contents fill at least the vertical height of the screen,
 * pushing the provided contents to the top and bottom of the screen when applicable.
 * Contents taller than one screen should see no effect. Takes sticky header into account.
 */
export const ScreenFillingWrapper: FC<{
  top: ReactNode;
  bottom: ReactNode;
}> = observer(function ScreenFillingWrapper({ top, bottom }) {
  return (
    <Wrapper
      style={{
        minHeight: `calc(100vh - ${useRootStore().uiStore.stickyHeaderHeight}px - ${rem(PAGE_LAYOUT_HEADER_GAP)})`,
      }}
    >
      <div>{top}</div>
      <div>{bottom}</div>
    </Wrapper>
  );
});
