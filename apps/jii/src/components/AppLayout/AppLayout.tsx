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

import { palette } from "@recidiviz/design-system";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, ReactNode, useLayoutEffect } from "react";
import useMeasure from "react-use-measure";
import styled from "styled-components/macro";

import { useSkipNav } from "../SkipNav/SkipNav";
import { useRootStore } from "../StoreProvider/useRootStore";
import {
  HEADER_PORTAL_ID,
  PAGE_LAYOUT_HEADER_GAP,
  STICKY_HEADER_ZINDEX,
} from "./constants";

const Wrapper = styled.div<{ scrollMargin: number }>`
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  row-gap: ${rem(PAGE_LAYOUT_HEADER_GAP)};

  /* main content and any potential scroll anchors it contains
   should be offset from the header so that skip links don't overshoot */
  main,
  main [id] {
    scroll-margin-top: ${(props) => props.scrollMargin}px;
  }
`;

const Header = styled.header`
  background: ${palette.white};
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${STICKY_HEADER_ZINDEX};

  @media (max-height: 599px) {
    position: static;
  }
`;

function useHeaderMeasurement() {
  // we will use the observed header height to offset the scroll,
  // so that the skip link doesn't result in content hidden behind the header
  const [measureRef, { height: headerHeightMeasurement }] = useMeasure();
  // we'll read it from the datastore, for consistency with the rest of the application
  const {
    uiStore,
    uiStore: { stickyHeaderHeight },
  } = useRootStore();
  // layout effect to make sure this is available to children before they paint,
  // to avoid possible layout shifts or other jankiness
  useLayoutEffect(
    () =>
      action("update sticky header height", () => {
        uiStore.stickyHeaderHeight = headerHeightMeasurement;
      })(),
    [headerHeightMeasurement, uiStore],
  );

  return { measureRef, stickyHeaderHeight };
}

export const AppLayout: FC<{ header?: ReactNode; main: ReactNode }> = observer(
  function AppLayout({ main, header }) {
    const { MainContent, SkipNav, SkipNavController } = useSkipNav();

    const { measureRef, stickyHeaderHeight } = useHeaderMeasurement();

    return (
      <SkipNavController>
        <SkipNav />
        <Wrapper scrollMargin={stickyHeaderHeight + PAGE_LAYOUT_HEADER_GAP}>
          <Header ref={measureRef}>
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
