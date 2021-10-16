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

import "./MobileNavigation.scss";

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { ReactComponent as MenuIcon } from "../../assets/static/images/menu.svg";
import Drawer from "../../components/Drawer";
import useIsMobile from "../../hooks/useIsMobile";
import PageNavigation from "../PageNavigation";
import PracticesSummaryBreadcrumbs from "../PracticesSummaryBreadcrumbs";
import SectionNavigation from "../SectionNavigation";
import ViewNavigation from "../ViewNavigation";
import { PATHWAYS_VIEWS } from "../views";

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
      <Drawer isShowing={open} hide={() => setOpen(false)}>
        <ViewNavigation>
          {currentView === PATHWAYS_VIEWS.system && <PageNavigation />}
        </ViewNavigation>
      </Drawer>
      <div className="MobileNavigation">
        <MenuIcon
          className="MobileNavigation__icon"
          onClick={() => setOpen(!open)}
        />
        <div className="MobileNavigation__title">{title}</div>
        {currentView === PATHWAYS_VIEWS.system && (
          <div className="MobileNavigation__system">
            <SectionNavigation />
          </div>
        )}
        {currentView === PATHWAYS_VIEWS.operations && (
          <div className="MobileNavigation__operations">
            <PracticesSummaryBreadcrumbs />
          </div>
        )}
      </div>
    </>
  ) : null;
};

export default MobileNavigation;
