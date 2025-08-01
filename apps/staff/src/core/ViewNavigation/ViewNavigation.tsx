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

import "./ViewNavigation.scss";

import { Icon, IconSVG } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

import MethodologyLogo from "../../assets/static/images/methodology.svg?react";
import { useRootStore } from "../../components/StoreProvider";
import { TenantId } from "../../RootStore/types";
import { appendActiveClassName } from "../../utils/navigation";
import { UserAvatar } from "../Avatar";
import { useCoreStore } from "../CoreStoreProvider";
import { DASHBOARD_VIEWS } from "../views";

type OptionalLinkProps = { enabled: boolean };

function PathwaysLink({ enabled }: OptionalLinkProps) {
  const { filtersStore } = useCoreStore();

  if (!enabled) return null;

  return (
    <NavLink
      className={appendActiveClassName(`ViewNavigation__navlink`)}
      to={`/${DASHBOARD_VIEWS.system}`}
      onClick={() => filtersStore.resetFilters()}
    >
      <Icon kind={IconSVG.Pathways} width={24} />
      <div className="ViewNavigation__navlink-heading">System-Level Trends</div>
    </NavLink>
  );
}

function ProfileNavLink() {
  return (
    <NavLink
      className={appendActiveClassName(`ViewNavigation__navlink`)}
      to={`/${DASHBOARD_VIEWS.profile}`}
    >
      <UserAvatar />
      <div className="ViewNavigation__navlink-heading">Profile</div>
    </NavLink>
  );
}

function MethodologyLink({
  currentTenantId,
  view,
}: {
  currentTenantId: TenantId;
  view: string;
}) {
  const linkContents = (
    <>
      <MethodologyLogo className="ViewNavigation__icon" />
      <div className="ViewNavigation__navlink-heading">How it works</div>
    </>
  );

  const {
    analyticsStore,
    tenantStore: { workflowsMethodologyUrl },
  } = useRootStore();

  const handleMethodologyLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    analyticsStore.trackMethodologyLinkClicked({
      path: location.pathname,
      methodologyLink: e.currentTarget.href,
    });
  };

  if (view === DASHBOARD_VIEWS.workflows) {
    return (
      <a
        className="ViewNavigation__navlink"
        href={workflowsMethodologyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleMethodologyLinkClick}
      >
        {linkContents}
      </a>
    );
  }

  const methodologyView =
    view === DASHBOARD_VIEWS.profile || view === DASHBOARD_VIEWS.methodology
      ? DASHBOARD_VIEWS.system
      : view;
  return (
    <NavLink
      className="ViewNavigation__navlink"
      target="_blank"
      to={{
        pathname: `/${DASHBOARD_VIEWS.methodology}/${methodologyView}`,
        search: `?stateCode=${currentTenantId}`,
      }}
      onClick={handleMethodologyLinkClick}
    >
      {linkContents}
    </NavLink>
  );
}

function InsightsLink({ enabled }: OptionalLinkProps) {
  if (!enabled) return null;

  return (
    <NavLink
      className={({ isActive }) =>
        `ViewNavigation__navlink${
          isActive ? " ViewNavigation__navlink--active" : ""
        }`
      }
      to={`/${DASHBOARD_VIEWS.insights}`}
    >
      <Icon kind={IconSVG.Insights} width={24} />
      <div className="ViewNavigation__navlink-heading">Overview</div>
    </NavLink>
  );
}

function WorkflowsLink({ enabled }: OptionalLinkProps) {
  if (!enabled) return null;

  return (
    <NavLink
      className={({ isActive }) =>
        `ViewNavigation__navlink${
          isActive ? " ViewNavigation__navlink--active" : ""
        }`
      }
      to={`/${DASHBOARD_VIEWS.workflows}`}
    >
      <Icon kind={IconSVG.Workflows} width={24} />
      <div className="ViewNavigation__navlink-heading">Workflows</div>
    </NavLink>
  );
}

function OperationsLink({ enabled }: OptionalLinkProps) {
  const { vitalsStore } = useCoreStore();

  if (!enabled) return null;
  return (
    <NavLink
      className={({ isActive }) =>
        `ViewNavigation__navlink${
          isActive ? " ViewNavigation__navlink--active" : ""
        }`
      }
      to={`/${DASHBOARD_VIEWS.operations}`}
      onClick={() => vitalsStore.resetCurrentEntityId()}
    >
      <Icon kind={IconSVG.Operations} width={24} />
      <div className="ViewNavigation__navlink-heading">Operational Metrics</div>
    </NavLink>
  );
}

const ViewNavigation: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { pathname } = useLocation();
  const view = pathname.split("/")[1];
  const { currentTenantId, userStore } = useCoreStore();

  const navigationLayout = userStore.userAllowedNavigation;
  if (!navigationLayout || !currentTenantId) return <div />;

  const enabledPathwaysPages = (navigationLayout.system || []).length > 0;
  const enableInsights = !!navigationLayout.insights;
  const enableOperations = !!navigationLayout.operations;
  const enableWorkflows = !!navigationLayout.workflows;

  return (
    <div className="ViewNavigation__mobile">
      <InsightsLink enabled={enableInsights} />
      <PathwaysLink enabled={enabledPathwaysPages} />
      {children}
      <OperationsLink enabled={enableOperations} />
      <WorkflowsLink enabled={enableWorkflows} />
      <MethodologyLink currentTenantId={currentTenantId} view={view} />
      <ProfileNavLink />
    </div>
  );
};

export default observer(ViewNavigation);
