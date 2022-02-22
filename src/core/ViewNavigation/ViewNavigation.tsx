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
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import useIsMobile from "../../hooks/useIsMobile";
import { useCoreStore } from "../CoreStoreProvider";
import { PATHWAYS_VIEWS } from "../views";

const ViewNavigation: React.FC = ({ children }) => {
  const isMobile = useIsMobile();
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

  const MethodologyLink = () => {
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
        <MethodologyLogo className="ViewNavigation__icon" />
        <div className="ViewNavigation__navlink-heading">Methodology</div>
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

  if (isMobile) {
    return (
      <div className="ViewNavigation__mobile">
        <PathwaysLink />
        {children}
        <PracticesLink />
        <MethodologyLink />
        <ProfileNavLink />
      </div>
    );
  }

  return (
    <aside className="ViewNavigation">
      <div className="ViewNavigation__tooltip-box">
        <PathwaysLink />
        <div className="ViewNavigation__tooltip">
          <h5 className="ViewNavigation__tooltip-header">
            System-Level Trends
          </h5>
          {/* prettier-ignore */}
          <div className="ViewNavigation__tooltip-body">
            A real-time map of the corrections system and how people are moving through it
          </div>
        </div>
      </div>
      <div className="ViewNavigation__tooltip-box">
        <PracticesLink />
        <div className="ViewNavigation__tooltip">
          <h5 className="ViewNavigation__tooltip-header">
            Operational Metrics
          </h5>
          <div className="ViewNavigation__tooltip-body">
            A birds-eye view of staff- and region-level trends
          </div>
        </div>
      </div>
      <div className="ViewNavigation__bottom">
        <div className="ViewNavigation__tooltip-box">
          <MethodologyLink />
          <div className="ViewNavigation__tooltip">
            <div className="ViewNavigation__tooltip-header">Methodology</div>
          </div>
        </div>
        <div className="ViewNavigation__tooltip-box">
          <ProfileNavLink />
          <div className="ViewNavigation__tooltip">
            <div className="ViewNavigation__tooltip-header">Profile</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default observer(ViewNavigation);
