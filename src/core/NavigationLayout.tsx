// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  Button,
  Dropdown,
  DropdownMenu,
  DropdownToggle,
  Icon,
  IconSVG,
  palette,
  spacing,
  typography,
  zindex,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import styled from "styled-components/macro";

import Drawer from "../components/Drawer/Drawer";
import { useRootStore } from "../components/StoreProvider";
import useIsMobile from "../hooks/useIsMobile";
import useLogout from "../hooks/useLogout";
import { isOfflineMode } from "../utils/isOfflineMode";
import { UserAvatar } from "./Avatar";
import { useCoreStore } from "./CoreStoreProvider";
import { TenantId } from "./models/types";
import RecidivizLogo from "./RecidivizLogo/RecidivizLogo";
import { WORKFLOWS_METHODOLOGY_URL } from "./utils/constants";
import { PATHWAYS_VIEWS, workflowsUrl } from "./views";

const Wrapper = styled.div``;

const Banner = styled.div`
  height: 4rem;
`;

const BackButton = styled(Link)<{ $notFixed?: boolean }>`
  position: ${({ $notFixed }) => ($notFixed ? "initial" : "fixed")};
  ${typography.Sans14};
  display: block;
  min-width: 0;
  min-height: 0;
  top: 4rem;
  text-decoration: none !important;
  color: ${palette.slate85};
  padding: ${rem(spacing.lg)};
  padding-bottom: 0;
  z-index: ${zindex.tooltip - 2};
  transition: color ease 500ms;

  &:hover,
  &:focus {
    color: ${palette.pine2};
  }

  & i {
    font-size: 1rem;
    margin-right: ${rem(spacing.md)};
  }
`;

const NavContainer = styled.nav<{
  isFixed?: boolean;
  alignBottom?: boolean;
  backgroundColor?: string;
}>`
  padding: 0 ${rem(spacing.md)};
  display: flex;
  height: 4rem;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background: ${({ backgroundColor }) => backgroundColor ?? palette.marble1};
  z-index: ${zindex.tooltip - 1};
  ${({ isFixed }) => isFixed && `position: fixed;`}
  ${({ alignBottom }) =>
    alignBottom
      ? `bottom: 0; 
          border-top: 1px solid ${palette.slate20};`
      : `border-bottom: 1px solid ${palette.slate20};`}
`;

const NavMenu = styled.div<{ alignBottom?: boolean }>`
  display: flex;
  align-items: center;

  ${({ alignBottom }) =>
    alignBottom &&
    `width: 100%;
      justify-content: space-between;`}
`;

const NavLinks = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: inherit;
  height: 4rem;

  a[class*="BrandedNavLink"],
  a[class*="PageNavigation"] {
    color: ${palette.slate85};
    text-decoration: none !important;
    margin-right: 20px;
    padding: 0 4px;
    height: 100%;
    display: flex;
    align-items: center;
    border-top: 4px solid transparent;
    font-weight: 500;
    transition: color ease 500ms;

    &:hover,
    &:focus {
      color: ${palette.pine2};
    }

    &.active {
      color: ${palette.pine2};
      border-top: 4px solid ${palette.signal.highlight};
    }
  }
`;

const DropdownProfile = styled(Dropdown)`
  margin-top: 5px;
`;

const DropdownProfileMenu = styled(DropdownMenu)`
  background: #ffffff;
  box-shadow: 0px 0px 1px rgba(43, 84, 105, 0.1),
    0px 4px 8px rgba(43, 84, 105, 0.06), 0px 8px 56px rgba(43, 84, 105, 0.12);
  border-radius: 8px;
  padding: 12px 0;

  & a {
    ${typography.Sans14}

    color: ${palette.slate80};
    margin: 4px 16px;
    display: flex;
    justify-content: space-between;
    transition: color ease 500ms;

    &:hover,
    &:focus {
      color: ${palette.pine2};
    }
  }
`;

const DrawerBodyStyles = {
  background: palette.marble1,
  borderRadius: "8px 8px 0 0",
  padding: `${rem(spacing.sm)} ${rem(spacing.md)} ${rem(spacing.xl)}`,
};

const DrawerOverlayStyles = {
  background: "rgba(1, 35, 34, 0.7)",
  backdropFilter: "blur(1px)",
};

const DrawerProfileMenu = styled.div`
  & a {
    ${typography.Sans14}

    color: ${palette.pine1};
    padding: ${rem(spacing.md)} 0;
    display: grid;
    grid-template-columns: 1fr 5fr 1fr;
    align-items: center;
    transition: color ease 500ms;
    border-bottom: 0.5px solid ${palette.slate10};

    & svg {
      color: ${palette.slate60};
    }

    & > * {
      &:first-child,
      :last-child {
        justify-self: center;
      }
    }
`;

type OptionalLinkProps = { enabled: boolean };

function MethodologyLink({
  currentTenantId,
  view,
  external = false,
}: {
  currentTenantId: TenantId;
  view: string;
  external?: boolean;
}) {
  const { isMobile } = useIsMobile(true);

  const linkContents = (
    <>
      {isMobile && <Icon kind={IconSVG.NeedsRiskAssessment} width={20} />}
      Methodology
      {external && <Icon kind={IconSVG.Open} width={15} />}
    </>
  );

  if (view === PATHWAYS_VIEWS.workflows) {
    return (
      <a
        href={WORKFLOWS_METHODOLOGY_URL[currentTenantId]}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkContents}
      </a>
    );
  }

  const methodologyView =
    view === PATHWAYS_VIEWS.profile || view === PATHWAYS_VIEWS.methodology
      ? PATHWAYS_VIEWS.system
      : view;

  return (
    <NavLink
      to={{
        pathname: `/${PATHWAYS_VIEWS.methodology}/${methodologyView}`,
        search: `?stateCode=${currentTenantId}`,
      }}
    >
      {linkContents}
    </NavLink>
  );
}

function WorkflowsLink({ enabled }: OptionalLinkProps) {
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <NavLink to={`/${PATHWAYS_VIEWS.workflows}`}>
      {isMobile && <Icon kind={IconSVG.NeedsContact} width={20} />}
      Go to Workflows
    </NavLink>
  );
}

function OperationsLink({ enabled }: OptionalLinkProps) {
  const { vitalsStore } = useCoreStore();
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <NavLink
      to={`/${PATHWAYS_VIEWS.operations}`}
      onClick={() => vitalsStore.resetCurrentEntityId()}
    >
      {isMobile && <Icon kind={IconSVG.StarCircled} width={20} />}
      Go to Operations
    </NavLink>
  );
}

function PathwaysLink({ enabled }: OptionalLinkProps) {
  const { filtersStore } = useCoreStore();
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <NavLink
      to={`/${PATHWAYS_VIEWS.system}`}
      onClick={() => filtersStore.resetFilters()}
    >
      {isMobile && <Icon kind={IconSVG.Journey} width={20} />}
      Go to Pathways
    </NavLink>
  );
}

function LogoutLink({ enabled }: OptionalLinkProps) {
  const logout = useLogout();
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <NavLink to="/" onClick={logout}>
      {isMobile && <Icon kind={IconSVG.Return} width={20} />}
      Log Out
    </NavLink>
  );
}

function AccountLink({ enabled }: OptionalLinkProps) {
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <NavLink to={`/${PATHWAYS_VIEWS.profile}`}>
      {isMobile && <UserAvatar />}
      Account
    </NavLink>
  );
}

type NavigationLayoutProps = {
  backgroundColor?: string;
  isFixed?: boolean;
  isMethodologyExternal?: boolean;
  children?: React.ReactNode;
};

export const NavigationLayout: React.FC<NavigationLayoutProps> = observer(
  function NavigationLayout({
    backgroundColor,
    isMethodologyExternal,
    children,
    isFixed = true,
  }) {
    const { pathname } = useLocation();
    const { isLaptop, isMobile } = useIsMobile(true);
    const [drawerIsOpen, setDrawerIsOpen] = React.useState(false);

    const view = pathname.split("/")[1];
    const page = pathname.split("/")[2];
    const { currentTenantId, userStore } = useRootStore();
    const userAllowedNavigation = userStore?.userAllowedNavigation;

    if (!userAllowedNavigation || !currentTenantId) return null;

    const enabledPathwaysPages =
      (userAllowedNavigation.system || []).length > 0;
    const enableWorkflows = (userAllowedNavigation.workflows || []).length > 0;
    const enableOperations = !!userAllowedNavigation.operations;

    const displayBackButton =
      view === PATHWAYS_VIEWS.workflows && page !== "home";

    const quickLinks = (
      <>
        <AccountLink enabled />
        <MethodologyLink
          currentTenantId={currentTenantId}
          view={view}
          external={isMethodologyExternal}
        />
        <PathwaysLink enabled={enabledPathwaysPages} />
        <OperationsLink enabled={enableOperations} />
        <WorkflowsLink enabled={enableWorkflows} />
        <LogoutLink enabled={!isOfflineMode()} />
      </>
    );

    return (
      <Wrapper>
        <NavContainer
          alignBottom={isMobile && isFixed}
          isFixed={isFixed}
          backgroundColor={backgroundColor}
        >
          {(!isMobile || !isFixed) && (
            <Link to="/">
              <RecidivizLogo />
            </Link>
          )}
          <NavMenu alignBottom={isMobile && isFixed}>
            <NavLinks>{children}</NavLinks>
            {isMobile ? (
              <>
                <Button onClick={() => setDrawerIsOpen(true)} kind="link">
                  <UserAvatar />
                </Button>
                <Drawer
                  bodyStyles={DrawerBodyStyles}
                  overlayStyles={DrawerOverlayStyles}
                  position="bottom"
                  closeButton={false}
                  isShowing={drawerIsOpen}
                  hide={() => setDrawerIsOpen(false)}
                >
                  <DrawerProfileMenu>{quickLinks}</DrawerProfileMenu>
                </Drawer>
              </>
            ) : (
              <DropdownProfile>
                <DropdownToggle kind="link">
                  <UserAvatar />
                </DropdownToggle>
                <DropdownProfileMenu alignment="right">
                  {quickLinks}
                </DropdownProfileMenu>
              </DropdownProfile>
            )}
          </NavMenu>
        </NavContainer>
        {!isMobile && isFixed && <Banner />}
        {displayBackButton && (
          <BackButton
            $notFixed={isLaptop || !isFixed}
            to={workflowsUrl("home")}
          >
            <i className="fa fa-angle-left" />
            Back
          </BackButton>
        )}
      </Wrapper>
    );
  }
);
