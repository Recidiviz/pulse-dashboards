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

import "./ImpactSectionNavigation.scss";

import { Icon, IconSVG } from "@recidiviz/design-system";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Drawer from "../../components/Drawer";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { IMPACT_SECTIONS, ImpactSection } from "../views";

const ImpactSectionNavigation: React.FC = () => {
  const [open, setOpen] = useState(false);

  const isMobile = useIsMobile();
  const { userStore } = useRootStore();
  const { impactStore } = useRootStore();
  const { setSection } = impactStore;

  const { pathname } = useLocation();
  const navigationLayout = userStore.userAllowedNavigation;
  const currentView = pathname.split("/")[1];
  const currentPage = pathname.split("/")[2] ?? impactStore.page;
  const enabledSections = navigationLayout[currentPage];

  const [currentSection = enabledSections[0]] = pathname.split("/").slice(3, 4);
  const isMultipleSections = enabledSections.length > 1;
  const sections = IMPACT_SECTIONS;

  type ImpactSectionToTitle = {
    [key in ImpactSection]: string;
  };

  const sectionTitles: ImpactSectionToTitle = {
    avgDailyPopulation: "Average Daily Population",
    avgPopulationCompliantReporting:
      "Average Daily Population on Compliant Reporting",
  };

  useEffect(() => {
    setOpen(false);
  }, [currentSection]);

  const sectionLinks = (
    <nav className="ImpactSectionNavigation">
      <div className="ImpactSectionNavigation__title" />
      {enabledSections.map((sectionId: string) => (
        <div key={sectionId}>
          <Link
            className={cn("ImpactSectionNavigation__navlink", {
              "ImpactSectionNavigation__navlink--active":
                currentSection === sectionId,
              "ImpactSectionNavigation__navlink--multiple": isMultipleSections,
            })}
            to={`/${currentView}/${currentPage}/${sectionId}`}
            onClick={() => setSection(sectionId)}
          >
            <div className="ImpactSectionNavigation__section-name">
              {sections && sectionTitles[sectionId]}
            </div>
            <div className="ImpactSectionNavigation__arrow">
              {currentSection === sectionId && (
                <Icon kind={IconSVG.Arrow} width={16} height={16} />
              )}
            </div>
          </Link>
        </div>
      ))}
    </nav>
  );

  if (isMobile && isMultipleSections)
    return (
      <>
        <Drawer position="right" isShowing={open} hide={() => setOpen(false)}>
          {sectionLinks}
        </Drawer>
        <button
          type="button"
          className="ImpactSectionNavigation__drawer-button"
          onClick={() => setOpen(!open)}
        >
          <span>{sections && sectionTitles[currentSection]}</span>
          <Icon kind={IconSVG.DownChevron} width={10} height={6} />
        </button>
      </>
    );

  return sectionLinks;
};

export default observer(ImpactSectionNavigation);
