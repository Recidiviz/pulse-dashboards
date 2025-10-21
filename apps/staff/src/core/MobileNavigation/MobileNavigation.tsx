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

import "./MobileNavigation.scss";

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Menubar } from "~design-system";

import MenuIcon from "../../assets/static/images/menu.svg?react";
import Drawer from "../../components/Drawer";
import useIsMobile from "../../hooks/useIsMobile";
import MobileViewNavigation from "../MobileViewNavigation";
import PageNavigation from "../PageNavigation";
import SectionNavigation from "../SectionNavigation";
import { DASHBOARD_VIEWS } from "../views";
import VitalsSummaryBreadcrumbs from "../VitalsSummaryBreadcrumbs";

interface Props {
  title?: string;
}

const MobileNavigation: React.FC<Props> = ({ title }) => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const currentView = pathname.split("/")[1].toLowerCase();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return isMobile ? (
    <>
      <Drawer
        isShowing={open}
        hide={() => setOpen(false)}
        id="mobile-page-navigation-drawer"
      >
        <MobileViewNavigation>
          {currentView === DASHBOARD_VIEWS.system && <PageNavigation />}
        </MobileViewNavigation>
      </Drawer>
      <div className="MenubarContainer">
        <Menubar className="MobileNavigation" aria-label="Main navigation">
          <MenuIcon
            className="MobileNavigation__icon"
            onClick={() => setOpen(!open)}
            onKeyDown={(event) => {
              if (event?.key === "Enter" || event?.key === " ") {
                setOpen(!open);
              }
            }}
            role="menuitem"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={
              open ? "Close page navigation menu" : "Open page navigation menu"
            }
          />
          <div className="MobileNavigation__title" aria-live="polite">
            {title}
          </div>
          {currentView === DASHBOARD_VIEWS.system ? (
            <div
              className="MobileNavigation__system"
              aria-label="Section navigation"
            >
              <SectionNavigation />
            </div>
          ) : (
            <div />
          )}
          {currentView === DASHBOARD_VIEWS.operations ? (
            <div
              className="MobileNavigation__operations"
              aria-label="Operations navigation"
            >
              <VitalsSummaryBreadcrumbs />
            </div>
          ) : (
            <div />
          )}
        </Menubar>
      </div>
    </>
  ) : null;
};

export default MobileNavigation;
