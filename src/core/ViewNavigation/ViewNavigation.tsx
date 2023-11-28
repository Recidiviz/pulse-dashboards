// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { ReactComponent as MethodologyLogo } from "../../assets/static/images/methodology.svg";
import { useFeatureVariants } from "../../components/StoreProvider";
import { TenantId } from "../../RootStore/types";
import { UserAvatar } from "../Avatar";
import { useCoreStore } from "../CoreStoreProvider";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import { DASHBOARD_VIEWS } from "../views";

const ViewTooltip: React.FC<{ title: string; body?: string }> = ({
  children,
  title,
  body,
}) => {
  if (!children) return null;

  return (
    <div className="ViewNavigation__tooltip-box">
      {children}
      <div className="ViewNavigation__tooltip">
        <div className="ViewNavigation__tooltip-header">{title}</div>
        {body && <div className="ViewNavigation__tooltip-body">{body}</div>}
      </div>
    </div>
  );
};

interface ViewNavigationProps {
  drawer?: boolean;
}

type OptionalLinkProps = { enabled: boolean };

function PathwaysLink({ enabled }: OptionalLinkProps) {
  const { filtersStore } = useCoreStore();

  if (!enabled) return null;

  return (
    <NavLink
      activeClassName="ViewNavigation__navlink--active"
      className="ViewNavigation__navlink"
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
      activeClassName="ViewNavigation__navlink--active"
      className="ViewNavigation__navlink"
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
      <div className="ViewNavigation__navlink-heading">Methodology</div>
    </>
  );

  if (view === DASHBOARD_VIEWS.workflows) {
    return (
      <a
        className="ViewNavigation__navlink"
        href={WORKFLOWS_METHODOLOGY_URL[currentTenantId]}
        target="_blank"
        rel="noopener noreferrer"
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
      to={{
        pathname: `/${DASHBOARD_VIEWS.methodology}/${methodologyView}`,
        search: `?stateCode=${currentTenantId}`,
      }}
    >
      {linkContents}
    </NavLink>
  );
}

function WorkflowsLink({ enabled }: OptionalLinkProps) {
  if (!enabled) return null;

  return (
    <NavLink
      activeClassName="ViewNavigation__navlink--active"
      className="ViewNavigation__navlink"
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
      activeClassName="ViewNavigation__navlink--active"
      className="ViewNavigation__navlink"
      to={`/${DASHBOARD_VIEWS.operations}`}
      onClick={() => vitalsStore.resetCurrentEntityId()}
    >
      <Icon kind={IconSVG.Operations} width={24} />
      <div className="ViewNavigation__navlink-heading">Operational Metrics</div>
    </NavLink>
  );
}

const ViewNavigation: React.FC<ViewNavigationProps> = ({
  children,
  drawer = false,
}) => {
  const { pathname } = useLocation();
  const view = pathname.split("/")[1];
  const { currentTenantId, userStore, tenantStore } = useCoreStore();
  const { responsiveRevamp } = useFeatureVariants();

  const navigationLayout = userStore.userAllowedNavigation;
  if (!navigationLayout || !currentTenantId) return <div />;

  const enabledPathwaysPages = (navigationLayout.system || []).length > 0;
  const enableOperations = !!navigationLayout.operations;
  const enableWorkflows = !!navigationLayout.workflows;

  if (responsiveRevamp && !drawer) return null;

  if (drawer) {
    return (
      <div className="ViewNavigation__mobile">
        <PathwaysLink enabled={enabledPathwaysPages} />
        {children}
        <OperationsLink enabled={enableOperations} />
        <WorkflowsLink enabled={enableWorkflows} />
        <MethodologyLink currentTenantId={currentTenantId} view={view} />
        <ProfileNavLink />
      </div>
    );
  }

  return (
    <aside className="ViewNavigation">
      <ViewTooltip
        title={tenantStore.pathwaysName}
        body="A real-time map of the corrections system and how people are moving through it"
      >
        <PathwaysLink enabled={enabledPathwaysPages} />
      </ViewTooltip>

      <ViewTooltip
        title="Operational Metrics"
        body="A birds-eye view of staff- and region-level trends"
      >
        <OperationsLink enabled={enableOperations} />
      </ViewTooltip>

      <ViewTooltip
        title="Workflows"
        body="A tool to identify and take action on opportunities to improve outcomes"
      >
        <WorkflowsLink enabled={enableWorkflows} />
      </ViewTooltip>

      <div className="ViewNavigation__bottom">
        <ViewTooltip title="Methodology">
          <MethodologyLink currentTenantId={currentTenantId} view={view} />
        </ViewTooltip>

        <ViewTooltip title="Profile">
          <ProfileNavLink />
        </ViewTooltip>
      </div>
    </aside>
  );
};

export default observer(ViewNavigation);
