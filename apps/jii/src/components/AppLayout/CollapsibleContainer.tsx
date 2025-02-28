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

import { Button, Icon, palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode, useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components/macro";
import useOnClickOutside from "use-onclickoutside";

import { COLLAPSIBLE_MENU_BREAKPOINT, STICKY_HEADER_ZINDEX } from "./constants";

const ContentWrapper = styled.div<{ isOpen: boolean }>`
  display: none;

  @media (max-width: ${COLLAPSIBLE_MENU_BREAKPOINT - 1}px) {
    ${(props) => (props.isOpen ? "display: flex;" : "")}

    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: ${rem(spacing.md)};
    background: ${palette.white};
    border-bottom: 1px solid ${palette.slate20};
    flex-direction: column;
    align-items: flex-end;
    z-index: ${STICKY_HEADER_ZINDEX};
  }

  @media (min-width: ${COLLAPSIBLE_MENU_BREAKPOINT}px) {
    display: contents;
  }
`;

const Wrapper = styled.div`
  justify-self: flex-end;

  & > button {
    min-width: 0;
  }

  @media (min-width: ${COLLAPSIBLE_MENU_BREAKPOINT}px) {
    display: contents;

    & > button {
      display: none;
    }
  }
`;

/**
 * Below a certain breakpoint, collapses menu contents behind a reveal button
 */
export const CollapsibleContainer: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  // click out of menu to close
  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    setIsOpen(false);
  });

  // close when navigating to a new page
  const location = useLocation();
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <Wrapper ref={ref}>
      <Button
        kind="secondary"
        shape="block"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        <Icon kind="Hamburger" size={16} aria-label="Menu" />
      </Button>
      <ContentWrapper id={menuId} isOpen={isOpen} role="menu">
        {children}
      </ContentWrapper>
    </Wrapper>
  );
};
