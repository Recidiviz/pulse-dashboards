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

import { observer } from "mobx-react-lite";
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

import { ReactComponent as MethodologyLogo } from "../../assets/static/images/methodology.svg";
import { ReactComponent as PathwaysLogo } from "../../assets/static/images/pathways.svg";
import { ReactComponent as PracticesLogo } from "../../assets/static/images/practices.svg";
import { UserAvatar } from "../Avatar";
import { useCoreStore } from "../CoreStoreProvider";
import { PRACTICES_METHODOLOGY_URL } from "../utils/constants";
import { PATHWAYS_VIEWS } from "../views";

const ViewTooltip: React.FC<{ title: string; body?: string }> = ({
  children,
  title,
  body,
}) => {
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

const ViewNavigation: React.FC<ViewNavigationProps> = ({
  children,
  drawer = false,
}) => {
  const { pathname } = useLocation();
  const view = pathname.split("/")[1];
  const {
    filtersStore,
    pagePracticesStore,
    currentTenantId,
    userStore,
  } = useCoreStore();

  const navigationLayout = userStore.userAllowedNavigation;
  if (!navigationLayout) return <div />;

  // Pathways is enabled if enabledPathwaysPages.length > 0
  const enabledPathwaysPages = navigationLayout.system || [];
  // Practices is enabled if enabledPractices !== undefined
  const enablePractices = navigationLayout.operations;
  const enablePracticesV2 = Boolean(navigationLayout.workflows);

  const PathwaysLink = () => {
    return enabledPathwaysPages.length > 0 ? (
      <NavLink
        activeClassName="ViewNavigation__navlink--active"
        className="ViewNavigation__navlink"
        to={`/${PATHWAYS_VIEWS.system}`}
        onClick={() => filtersStore.resetFilters()}
      >
        <PathwaysLogo className="ViewNavigation__icon" />
        <div className="ViewNavigation__navlink-heading">
          System-Level Trends
        </div>
      </NavLink>
    ) : null;
  };

  const PracticesLink = () => {
    return enablePractices ? (
      <NavLink
        activeClassName="ViewNavigation__navlink--active"
        className="ViewNavigation__navlink"
        to={`/${PATHWAYS_VIEWS.operations}`}
        onClick={() => pagePracticesStore.resetCurrentEntityId()}
      >
        <PracticesLogo className="ViewNavigation__icon" />
        <div className="ViewNavigation__navlink-heading">
          Operational Metrics
        </div>
      </NavLink>
    ) : null;
  };

  const PracticesV2Link = () => {
    return enablePracticesV2 ? (
      <NavLink
        activeClassName="ViewNavigation__navlink--active"
        className="ViewNavigation__navlink"
        to={`/${PATHWAYS_VIEWS.practices}`}
      >
        <PracticesLogo className="ViewNavigation__icon" />
        <div className="ViewNavigation__navlink-heading">Workflows</div>
      </NavLink>
    ) : null;
  };

  const MethodologyLink = () => {
    const linkContents = (
      <>
        <MethodologyLogo className="ViewNavigation__icon" />
        <div className="ViewNavigation__navlink-heading">Methodology</div>
      </>
    );

    if (view === PATHWAYS_VIEWS.practices) {
      return (
        <a
          className="ViewNavigation__navlink"
          href={PRACTICES_METHODOLOGY_URL}
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
        className="ViewNavigation__navlink"
        to={{
          pathname: `/${PATHWAYS_VIEWS.methodology}/${methodologyView}`,
          search: `?stateCode=${currentTenantId}`,
        }}
      >
        {linkContents}
      </NavLink>
    );
  };

  const ProfileNavLink = () => (
    <NavLink
      activeClassName="ViewNavigation__navlink--active"
      className="ViewNavigation__navlink"
      to={`/${PATHWAYS_VIEWS.profile}`}
    >
      <UserAvatar />
      <div className="ViewNavigation__navlink-heading">Profile</div>
    </NavLink>
  );

  if (drawer) {
    return (
      <div className="ViewNavigation__mobile">
        <PathwaysLink />
        {children}
        <PracticesLink />
        <PracticesV2Link />
        <MethodologyLink />
        <ProfileNavLink />
      </div>
    );
  }

  return (
    <aside className="ViewNavigation">
      <ViewTooltip
        title={
          currentTenantId && ["US_TN", "US_ME"].includes(currentTenantId)
            ? "Pathways"
            : "System-Level Trends"
        }
        body="A real-time map of the corrections system and how people are moving through it"
      >
        <PathwaysLink />
      </ViewTooltip>

      <ViewTooltip
        title="Operational Metrics"
        body="A birds-eye view of staff- and region-level trends"
      >
        <PracticesLink />
      </ViewTooltip>

      <ViewTooltip
        title="Workflows"
        body="A tool to identify and take action on opportunities to improve outcomes"
      >
        <PracticesV2Link />
      </ViewTooltip>

      <div className="ViewNavigation__bottom">
        <ViewTooltip title="Methodology">
          <MethodologyLink />
        </ViewTooltip>

        <ViewTooltip title="Profile">
          <ProfileNavLink />
        </ViewTooltip>
      </div>
    </aside>
  );
};

export default observer(ViewNavigation);
