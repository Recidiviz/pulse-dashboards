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
import React from "react";
import { NavLink } from "react-router-dom";

import { ReactComponent as MethodologyLogo } from "../../assets/static/images/methodology.svg";
import { ReactComponent as PathwaysLogo } from "../../assets/static/images/pathways.svg";
import { ReactComponent as PracticesLogo } from "../../assets/static/images/practices.svg";
import ProfileLink from "../../components/ProfileLink";
import { useCoreStore } from "../CoreStoreProvider";

const ViewNavigation = (): React.ReactElement => {
  const { filtersStore, pagePracticesStore } = useCoreStore();
  return (
    <aside className="ViewNavigation">
      <div className="ViewNavigation__tooltip-box">
        <NavLink
          activeClassName="ViewNavigation__navlink--active"
          className="ViewNavigation__navlink"
          to="/pathways"
          onClick={() => filtersStore.resetFilters()}
        >
          <PathwaysLogo className="ViewNavigation__icon" />
        </NavLink>
        <div className="ViewNavigation__tooltip">
          <h5 className="ViewNavigation__tooltip-header">Pathways</h5>
          <div className="ViewNavigation__tooltip-body">
            A real-time map of your system and how people are moving through it
          </div>
        </div>
      </div>
      <div className="ViewNavigation__tooltip-box">
        <NavLink
          activeClassName="ViewNavigation__navlink--active"
          className="ViewNavigation__navlink"
          to="/practices"
          onClick={() => pagePracticesStore.resetCurrentEntityId()}
        >
          <PracticesLogo className="ViewNavigation__icon" />
        </NavLink>
        <div className="ViewNavigation__tooltip">
          <h5 className="ViewNavigation__tooltip-header">Practices</h5>
          <div className="ViewNavigation__tooltip-body">
            A birds-eye view of staff- and region-level resources and
            operational trends
          </div>
        </div>
      </div>
      <div className="ViewNavigation__bottom">
        <div className="ViewNavigation__tooltip-box">
          <a
            className="ViewNavigation__navlink"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MethodologyLogo className="ViewNavigation__icon" />
          </a>
          <div className="ViewNavigation__tooltip">
            <div className="ViewNavigation__tooltip-header">
              Methodology
              <Icon kind={IconSVG.Open} width={16} height={16} />
            </div>
          </div>
        </div>
        <div className="ViewNavigation__tooltip-box">
          <div className="ViewNavigation__navlink">
            <ProfileLink pathways />
          </div>
          <div className="ViewNavigation__tooltip">
            <div className="ViewNavigation__tooltip-header">Profile</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ViewNavigation;
