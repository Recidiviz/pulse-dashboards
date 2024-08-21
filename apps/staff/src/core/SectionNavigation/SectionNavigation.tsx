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

import "./SectionNavigation.scss";

import { Icon, IconSVG } from "@recidiviz/design-system";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Drawer from "../../components/Drawer";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { useCoreStore } from "../CoreStoreProvider";
import usePageContent from "../hooks/usePageContent";
import { PathwaysPage } from "../views";

const SectionNavigation: React.FC = () => {
  const [open, setOpen] = useState(false);

  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { userStore } = useRootStore();
  const { setSection } = useCoreStore();
  const navigationLayout = userStore.userAllowedNavigation;
  const [currentView, currentPage] = pathname.split("/").slice(1, 4);
  const enabledSections = navigationLayout[currentPage] ?? [];
  const [currentSection = enabledSections[0]] = pathname.split("/").slice(3, 4);
  const { sections } = usePageContent(currentPage as PathwaysPage);

  const isMultipleSections = enabledSections.length > 1;

  useEffect(() => {
    setOpen(false);
  }, [currentSection]);

  const sectionLinks = (
    <nav className="SectionNavigation">
      <div className="SectionNavigation__title" />
      {enabledSections.map((sectionId: string) => (
        <div key={sectionId}>
          <Link
            className={cn("SectionNavigation__navlink", {
              "SectionNavigation__navlink--active":
                currentSection === sectionId,
              "SectionNavigation__navlink--multiple": isMultipleSections,
            })}
            to={`/${currentView}/${currentPage}/${sectionId}`}
            onClick={() => setSection(sectionId)}
          >
            <div className="SectionNavigation__section-name">
              {sections && sections[sectionId]}
            </div>
            <div className="SectionNavigation__arrow">
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
          className="SectionNavigation__drawer-button"
          onClick={() => setOpen(!open)}
        >
          <span>{sections && sections[currentSection]}</span>
          <Icon kind={IconSVG.DownChevron} width={10} height={6} />
        </button>
      </>
    );

  return sectionLinks;
};

export default observer(SectionNavigation);
