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

import { spacing } from "@recidiviz/design-system";
import cn from "classnames";
import { throttle } from "lodash";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useMeasure from "react-use-measure";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useSkipNav } from "../SkipNav/SkipNav";
import { useRootStore } from "../StoreProvider/useRootStore";
import { Wordmark } from "../Wordmark/Wordmark";
import {
  HEADER_ANIMATION_OPTIONS,
  HEADER_HEIGHT,
  HEADER_PORTAL_ID,
  HIDDEN_HEADER_OFFSET,
  PAGE_LAYOUT_HEADER_GAP,
  STICKY_HEADER_ZINDEX,
} from "./constants";
import { HeaderBarContainer } from "./HeaderBarContainer";

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
  transition: transform ${HEADER_ANIMATION_OPTIONS};

  &.hideHeaderBar {
    transform: translateY(-${rem(HIDDEN_HEADER_OFFSET)});
  }
`;

const LogoLink = styled(Link)``;

const HeaderBar = styled.div`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.md)};
  justify-content: stretch;
  height: ${rem(HEADER_HEIGHT)};

  ${LogoLink} {
    margin-right: auto;
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

function useScrollHide() {
  const lastScrollPosition = useRef(0);
  const { uiStore } = useRootStore();

  useEffect(() => {
    const updateScroll = throttle(
      action("onscroll header updates", () => {
        const { scrollY, innerHeight } = window;
        // bar does not disappear until you've scrolled a certain amount
        if (scrollY < innerHeight / 3) {
          uiStore.hideHeaderBar = false;
        } else if (scrollY > lastScrollPosition.current) {
          // if scrolling down: hide
          uiStore.hideHeaderBar = true;
        } else if (scrollY < lastScrollPosition.current) {
          // if scrolling up: show
          uiStore.hideHeaderBar = false;
        }

        lastScrollPosition.current = scrollY;
      }),
      100,
    );

    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, [uiStore]);
}

export const AppLayout: FC<{ header?: ReactNode; main: ReactNode }> = observer(
  function AppLayout({ main, header }) {
    const { MainContent, SkipNav, SkipNavController } = useSkipNav();

    const { measureRef, stickyHeaderHeight } = useHeaderMeasurement();
    const {
      uiStore: { hideHeaderBar },
    } = useRootStore();

    useScrollHide();

    return (
      <SkipNavController>
        <SkipNav />
        <Wrapper scrollMargin={stickyHeaderHeight + PAGE_LAYOUT_HEADER_GAP}>
          <Header
            ref={measureRef}
            className={cn({
              hideHeaderBar,
            })}
          >
            <HeaderBarContainer>
              <HeaderBar>
                <LogoLink to="/">
                  <Wordmark />
                </LogoLink>
                {header}
              </HeaderBar>
            </HeaderBarContainer>
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
