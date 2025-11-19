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

import {
  autoUpdate,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, useEffect, useId, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";

import { PAGE_PADDING, STICKY_HEADER_ZINDEX } from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { Icon } from "~design-system";
import { Button, palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { MenuLinks, NavMenuPresenter } from "./NavMenuPresenter";

const NAV_ACTIVE_BORDER = 2;
const NAV_ACTIVE_PADDING = 4;

const Menu = styled.div`
  align-items: flex-end;
  background: ${palette.white};
  box-shadow: 0 ${rem(5)} ${rem(7)} 0 ${palette.slate30};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  max-width: calc(100vw - (${PAGE_PADDING} * 2));
  padding: ${rem(spacing.md)};
  text-align: right;
  z-index: ${STICKY_HEADER_ZINDEX};

  a,
  button {
    align-items: center;
    color: ${palette.slate85};
    display: flex;
    min-height: ${rem(24)};
    min-width: none;
    text-decoration: none;

    &.active {
      color: ${palette.pine1};
      border-right: ${rem(NAV_ACTIVE_BORDER)} solid ${palette.pine4};
      margin-right: -${rem(NAV_ACTIVE_BORDER + NAV_ACTIVE_PADDING)};
      padding-right: ${rem(NAV_ACTIVE_PADDING)};
    }
  }
`;

const MenuButton = styled(Button).attrs({ kind: "borderless", shape: "block" })`
  &,
  &:focus,
  &:active {
    color: ${palette.slate85};
  }

  svg {
    margin-right: 0.5em;
  }
`;

/**
 * returns a mix of react state and floating-ui api for controlling menu behavior
 */
function useMenuProps() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  const { refs, floatingStyles, context } = useFloating({
    middleware: [offset(spacing.xxs)],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: "bottom-end",
    whileElementsMounted: autoUpdate,
  });
  const { getFloatingProps, getReferenceProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  // close when navigating to a new page
  const location = useLocation();
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return {
    isOpen,
    menuId,
    refs,
    floatingStyles,
    getFloatingProps,
    getReferenceProps,
  };
}

/**
 * Disclosure menu for navigation elements. Will also include a logout link when applicable
 */
const ManagedComponent: FC<{ presenter: NavMenuPresenter }> = observer(
  function NavMenu({ presenter }) {
    const {
      floatingStyles,
      getFloatingProps,
      getReferenceProps,
      isOpen,
      menuId,
      refs,
    } = useMenuProps();

    const {
      showLogout,
      showTranslationMode,
      links,
      logOut,
      toggleTranslationMode,
      isTranslationMode,
      toggleActiveLanguage,
    } = presenter;

    // don't show a useless empty menu
    if (!showLogout && links.length === 0) return null;

    return (
      <>
        <MenuButton
          // we are implementing the ARIA "disclosure navigation" pattern here,
          // which is why there is no menu role used anywhere.
          // see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation
          aria-expanded={isOpen}
          aria-controls={menuId}
          ref={refs.setReference}
          {...getReferenceProps()}
        >
          <Icon kind="Hamburger" size={16} /> Menu
        </MenuButton>
        {isOpen && (
          <Menu
            ref={refs.setFloating}
            id={menuId}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {links.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
            {showTranslationMode && (
              <>
                <Button kind="link" onClick={() => toggleTranslationMode()}>
                  {isTranslationMode ? "Exit" : "Enter"} Translator Mode
                </Button>
                <Button
                  kind="link"
                  disabled={isTranslationMode}
                  onClick={() => toggleActiveLanguage()}
                >
                  Toggle Eng/Esp
                </Button>
              </>
            )}
            {showLogout && (
              <Button kind="link" onClick={() => logOut()}>
                Log out
              </Button>
            )}
          </Menu>
        )}
      </>
    );
  },
);

function usePresenter({ links = [] }: { links?: MenuLinks }) {
  return new NavMenuPresenter(links, useRootStore());
}

export const NavMenu = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
