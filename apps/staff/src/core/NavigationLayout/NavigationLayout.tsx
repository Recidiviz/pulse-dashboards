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

import { Pill, spacing, typography, zindex } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";

import { isOfflineMode } from "~client-env-utils";
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  Icon,
  IconSVG,
  Menubar,
  palette,
} from "~design-system";
import { psiUrl } from "~sentencing-client";

import Drawer from "../../components/Drawer/Drawer";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import useLogout from "../../hooks/useLogout";
import { TenantId } from "../../RootStore/types";
import { toTitleCase } from "../../utils";
import { getJusticeInvolvedPersonTitle } from "../../WorkflowsStore/utils";
import { UserAvatar } from "../Avatar";
import { useCoreStore } from "../CoreStoreProvider";
import LanternLogo from "../LanternLogo";
import RecidivizLogo from "../RecidivizLogo";
import { DASHBOARD_VIEWS, WorkflowsPage, workflowsUrl } from "../views";
import { Separator } from "../WorkflowsJusticeInvolvedPersonProfile/styles";
import { SYSTEM_ID_TO_PATH } from "./OverviewNavLinks";

export const NAV_BAR_HEIGHT = 64;

const Wrapper = styled.div``;

const Banner = styled.div<{ topOffset?: number }>`
  height: ${({ topOffset }) => rem(NAV_BAR_HEIGHT + (topOffset || 0))};
`;

const NavContainer = styled.div<{
  isFixed?: boolean;
  alignBottom?: boolean;
  backgroundColor?: string;
  hasBorder?: boolean;
  topOffset?: number;
}>`
  padding: 0 ${rem(spacing.md)};
  display: flex;
  height: ${rem(NAV_BAR_HEIGHT)};
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background: ${({ backgroundColor }) => backgroundColor ?? palette.marble1};
  z-index: ${zindex.tooltip - 1};
  ${({ isFixed, topOffset }) =>
    isFixed && `position: fixed; top: ${topOffset || 0}px;`}
  ${({ alignBottom }) =>
    alignBottom
      ? `bottom: 0;
          border-top: 1px solid ${palette.slate20};`
      : `border-bottom: 1px solid ${palette.slate20};`}

  ${({ hasBorder }) => !hasBorder && `border: 0 !important;`}
`;

const NavMenu = styled.div<{ alignBottom?: boolean }>`
  display: flex;
  align-items: center;

  ${({ alignBottom }) =>
    alignBottom &&
    `width: 100%;
    gap: ${rem(spacing.md)};`}
`;

const NavLinks = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: inherit;
  height: 4rem;

  a {
    color: ${palette.slate85};
    text-decoration: none !important;
    margin-right: 20px;
    padding: 0 4px;
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
  box-shadow:
    0px 0px 1px ${palette.slate10},
    0px 4px 8px ${palette.slate05},
    0px 8px 56px ${palette.slate15};
  border-radius: 8px;
  width: max-content;

  & a {
    ${typography.Sans14}

    color: ${palette.slate80};
    display: flex;
    justify-content: space-between;
    transition: color ease 500ms;
    height: 1rem;

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
  // TODO(#8709): Add color to design system or change to design system color
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
  }
`;

const ProfileButtonMobile = styled(Button).attrs({ kind: "link" })<{
  order?: number;
}>`
  ${({ order }) => order && `order: ${order};`}
`;

const MainLogoNavLink = styled(Link)`
  display: flex;
  align-items: end;
  padding: 5px;

  ${Separator} {
    padding: 0 0.75rem;
  }
`;

type OptionalLinkProps = { enabled: boolean };

function MethodologyLink({
  currentTenantId,
  view,
  externalMethodologyUrl,
}: {
  currentTenantId: TenantId;
  view: string;
  externalMethodologyUrl?: string;
}) {
  const { isMobile } = useIsMobile(true);
  const { analyticsStore } = useRootStore();

  const linkContents = (
    <>
      {isMobile && <Icon kind={IconSVG.NeedsRiskAssessment} width={20} />}
      How it works
      {externalMethodologyUrl && <Icon kind={IconSVG.Open} width={15} />}
    </>
  );

  const handleMethodologyLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    analyticsStore.trackMethodologyLinkClicked({
      path: location.pathname,
      methodologyLink: e.currentTarget.href,
    });
  };

  if (externalMethodologyUrl) {
    return (
      <DropdownMenuItem>
        <a
          href={externalMethodologyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleMethodologyLinkClick}
          role="menuitem"
        >
          {linkContents}
        </a>
      </DropdownMenuItem>
    );
  }

  const methodologyView =
    view === DASHBOARD_VIEWS.profile || view === DASHBOARD_VIEWS.methodology
      ? DASHBOARD_VIEWS.system
      : view;

  return (
    <DropdownMenuItem>
      <NavLink
        to={{
          pathname: `/${DASHBOARD_VIEWS.methodology}/${methodologyView}`,
          search: `?stateCode=${currentTenantId}`,
        }}
        onClick={handleMethodologyLinkClick}
        role="menuitem"
      >
        {linkContents}
      </NavLink>
    </DropdownMenuItem>
  );
}

function MainLogo({
  enabled,
  enabledLanternLogo,
}: OptionalLinkProps & { enabledLanternLogo: boolean }) {
  if (!enabled) return null;

  return (
    <MainLogoNavLink
      to="/"
      role="menuitem"
      aria-label="Go to Recidiviz Home"
      className="MainLogoLink"
    >
      <RecidivizLogo aria-hidden="true" />
      {enabledLanternLogo && (
        <>
          <Separator>|</Separator>
          <LanternLogo />
        </>
      )}
    </MainLogoNavLink>
  );
}

function WorkflowsLink({
  enabled,
  homepage,
}: OptionalLinkProps & { homepage: WorkflowsPage }) {
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <DropdownMenuItem>
      <NavLink
        className="WorkflowsLink"
        to={workflowsUrl(homepage)}
        role="menuitem"
      >
        {isMobile && <Icon kind={IconSVG.Workflows} width={20} />}
        Go to Workflows
      </NavLink>
    </DropdownMenuItem>
  );
}

function OperationsLink({ enabled }: OptionalLinkProps) {
  const { vitalsStore } = useCoreStore();
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <DropdownMenuItem>
      <NavLink
        to={`/${DASHBOARD_VIEWS.operations}`}
        onClick={() => vitalsStore.resetCurrentEntityId()}
        role="menuitem"
      >
        {isMobile && <Icon kind={IconSVG.Operations} width={20} />}
        Go to Operations
      </NavLink>
    </DropdownMenuItem>
  );
}

const PathwaysLink = observer(function PathwaysLink({
  enabled,
}: OptionalLinkProps) {
  const { filtersStore, tenantStore } = useCoreStore();
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <DropdownMenuItem>
      <NavLink
        to={`/${DASHBOARD_VIEWS.system}`}
        onClick={() => filtersStore.resetFilters()}
        role="menuitem"
      >
        {isMobile && <Icon kind={IconSVG.Pathways} width={20} />}
        Go to {tenantStore.pathwaysName}
      </NavLink>
    </DropdownMenuItem>
  );
});

function InsightsLink({ enabled }: OptionalLinkProps) {
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;
  return (
    <DropdownMenuItem>
      <NavLink to={`/${DASHBOARD_VIEWS.insights}`} role="menuitem">
        {isMobile && <Icon kind={IconSVG.Operations} width={20} />}
        Go to Insights
      </NavLink>
    </DropdownMenuItem>
  );
}

function PSIStaffLink({
  enabled,
  staffPseudoId,
}: {
  enabled: boolean;
  staffPseudoId?: string;
}) {
  const { isMobile } = useIsMobile(true);

  if (!enabled || !staffPseudoId) return null;
  return (
    <DropdownMenuItem>
      <NavLink to={psiUrl("staffDashboard", { staffPseudoId })} role="menuitem">
        {isMobile && <Icon kind={IconSVG.Operations} width={20} />}
        Go to PSI Case Dashboard
      </NavLink>
    </DropdownMenuItem>
  );
}

function PSISupervisorLink({
  enabled,
  staffPseudoId,
}: {
  enabled: boolean;
  staffPseudoId?: string;
}) {
  const { isMobile } = useIsMobile(true);

  if (!enabled || !staffPseudoId) return null;
  return (
    <DropdownMenuItem>
      <NavLink
        to={psiUrl("supervisorDashboard", { staffPseudoId })}
        role="menuitem"
      >
        {isMobile && <Icon kind={IconSVG.Operations} width={20} />}
        Go to PSI Supervisor Dashboard
      </NavLink>
    </DropdownMenuItem>
  );
}

const BetaPill = styled(Pill)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  height: 18px;
  margin-left: ${rem(spacing.sm)};
  margin-right: ${rem(spacing.md)};
  background-color: rgba(207, 245, 246, 1);
  border: 1px solid rgba(162, 229, 239, 1);
  border-radius: 4px;
`;

// TODO(#11341) - Remove external CPA navigation link when CPA is integrated into staff app
function CPALink({ enabled }: OptionalLinkProps) {
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  const cpaUrl =
    import.meta.env.VITE_DEPLOY_ENV === "production"
      ? "https://plan.recidiviz.org"
      : "https://plan-staging.recidiviz.org";

  return (
    <DropdownMenuItem>
      <a
        href={cpaUrl}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && <Icon kind={IconSVG.Open} width={20} />}
        Case Planning Assistant
        <BetaPill textColor="rgba(0, 85, 188, 1)">BETA</BetaPill>
        <Icon kind={IconSVG.Open} width={15} />
      </a>
    </DropdownMenuItem>
  );
}

function LogoutLink({ enabled }: OptionalLinkProps) {
  const logout = useLogout();
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <DropdownMenuItem>
      <NavLink to="/" onClick={logout} role="menuitem">
        {isMobile && <Icon kind={IconSVG.Leave} width={20} />}
        Log Out
      </NavLink>
    </DropdownMenuItem>
  );
}

function AccountLink({ enabled }: OptionalLinkProps) {
  const { isMobile } = useIsMobile(true);

  if (!enabled) return null;

  return (
    <DropdownMenuItem>
      <NavLink
        className="AccountLink"
        to={`/${DASHBOARD_VIEWS.profile}`}
        role="menuitem"
      >
        {isMobile && <UserAvatar />}
        Profile
      </NavLink>
    </DropdownMenuItem>
  );
}

function WorkflowsSystemLinks() {
  const { isMobile } = useIsMobile(true);

  const { workflowsStore } = useRootStore();

  if (!workflowsStore.supportsMultipleSystems || !isMobile) return null;

  return workflowsStore.workflowsSupportedSystems?.map((systemId) => {
    return (
      <DropdownMenuItem>
        <NavLink
          key={systemId}
          to={workflowsUrl(SYSTEM_ID_TO_PATH[systemId])}
          onClick={() => workflowsStore.updateActiveSystem(systemId)}
        >
          {isMobile && <Icon kind={IconSVG.Users} width={20} />}
          {toTitleCase(getJusticeInvolvedPersonTitle(systemId))}s
        </NavLink>
      </DropdownMenuItem>
    );
  });
}

type NavigationLayoutProps = {
  backgroundColor?: string;
  isFixed?: boolean;
  externalMethodologyUrl?: string;
  isNaked?: boolean;
  children?: React.ReactNode;
  topOffset?: number;
};

export const NavigationLayout: React.FC<NavigationLayoutProps> = observer(
  function NavigationLayout({
    backgroundColor,
    externalMethodologyUrl,
    children,
    isFixed = true,
    isNaked = false,
    topOffset = 0,
  }) {
    const { pathname } = useLocation();
    const { isMobile } = useIsMobile(true);
    const [drawerIsOpen, setDrawerIsOpen] = React.useState(false);

    const view = pathname.split("/")[1];
    const {
      currentTenantId,
      userStore,
      tenantStore,
      sentencingStore,
      workflowsStore: { homepage },
    } = useRootStore();
    const userAllowedNavigation = userStore?.userAllowedNavigation;

    if (!userAllowedNavigation || !currentTenantId) return null;

    // We should include the insights and workflows links on views that don't use the
    // sitewide nav bar
    const includeInsightsWorkflowsLinks = (
      [DASHBOARD_VIEWS.operations, DASHBOARD_VIEWS.system] as string[]
    ).includes(view);

    const enabledPathwaysPages =
      (userAllowedNavigation.system || []).length > 0;
    const enableWorkflows =
      (userAllowedNavigation.workflows || []).length > 0 &&
      includeInsightsWorkflowsLinks;
    const enableOperations = !!userAllowedNavigation.operations;
    const enabledInsights =
      !!userAllowedNavigation.insights && includeInsightsWorkflowsLinks;
    const enabledPSI = !!userAllowedNavigation.psi;

    const isInsightsView = view === DASHBOARD_VIEWS.insights;
    const isInsightsLanternState =
      tenantStore && tenantStore.insightsLanternState;

    const isDevOrStagingOrOfflineEnv =
      ["staging", "dev"].includes(import.meta.env.VITE_DEPLOY_ENV) ||
      isOfflineMode();

    const isPsiStaff =
      (import.meta.env.VITE_DEPLOY_ENV === "production" &&
        enabledPSI &&
        userStore.userPseudoId &&
        !userStore.isRecidivizUser &&
        !!sentencingStore.staffPseudoId) ||
      (isDevOrStagingOrOfflineEnv && enabledPSI);

    const isPsiSupervisor = isPsiStaff && sentencingStore.isSupervisor;

    // TODO(#11341) - Remove external CPA navigation link when CPA is integrated into staff app
    const enabledCPA = userStore.getRoutePermission("cpa");

    const quickLinks = (
      <>
        <AccountLink enabled />
        {!isPsiStaff && (
          <MethodologyLink
            currentTenantId={currentTenantId}
            view={view}
            externalMethodologyUrl={externalMethodologyUrl}
          />
        )}
        <PathwaysLink enabled={enabledPathwaysPages} />
        <OperationsLink enabled={enableOperations} />
        <WorkflowsLink enabled={enableWorkflows} homepage={homepage} />
        <WorkflowsSystemLinks />
        <InsightsLink enabled={enabledInsights} />
        <PSISupervisorLink
          enabled={isPsiSupervisor}
          staffPseudoId={sentencingStore.staffPseudoId}
        />
        <PSIStaffLink
          enabled={isPsiStaff}
          staffPseudoId={sentencingStore.staffPseudoId}
        />
        <CPALink enabled={enabledCPA} />
        <LogoutLink enabled={!isOfflineMode()} />
      </>
    );

    return (
      <Wrapper>
        <NavContainer
          alignBottom={isMobile && isFixed}
          isFixed={isFixed}
          backgroundColor={backgroundColor}
          hasBorder={!isNaked}
          topOffset={topOffset}
        >
          <Menubar ariaLabel="Main Navigation">
            <MainLogo
              enabled={!isMobile || !isFixed}
              enabledLanternLogo={isInsightsLanternState && isInsightsView}
            />
            {!isNaked ? (
              <NavMenu
                alignBottom={isMobile && isFixed}
                data-intercom-target="Profile"
              >
                <NavLinks role="none">{children}</NavLinks>
                {isMobile ? (
                  <>
                    <ProfileButtonMobile
                      order={isMobile && -1}
                      onClick={() => setDrawerIsOpen(true)}
                    >
                      <UserAvatar />
                    </ProfileButtonMobile>
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
                    <DropdownToggle
                      kind="link"
                      aria-label="Profile dropdown button"
                      role="menuitem"
                      className="ProfileDropdownButton"
                    >
                      <UserAvatar />
                    </DropdownToggle>
                    <DropdownProfileMenu
                      alignment="right"
                      ariaLabel="Profile menu"
                    >
                      {quickLinks}
                    </DropdownProfileMenu>
                  </DropdownProfile>
                )}
              </NavMenu>
            ) : (
              <div />
            )}
          </Menubar>
        </NavContainer>
        {!isMobile && isFixed && <Banner topOffset={topOffset} />}
      </Wrapper>
    );
  },
);
