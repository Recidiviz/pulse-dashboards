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

import "./SectionNavigation.scss";

import { Icon, IconSVG } from "@recidiviz/design-system";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useLocation } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import { useCoreStore } from "../CoreStoreProvider";
import usePageContent from "../hooks/usePageContent";
import { PathwaysPage } from "../views";

const SectionNavigation: React.FC = () => {
  const { pathname } = useLocation();
  const { userStore } = useRootStore();
  const { setSection } = useCoreStore();
  const navigationLayout = userStore.userAllowedNavigation;
  const [currentView, currentPage] = pathname.split("/").slice(1, 4);
  const enabledSections = navigationLayout[currentPage] ?? [];
  const [currentSection = enabledSections[0]] = pathname.split("/").slice(3, 4);
  const { sections } = usePageContent(currentPage as PathwaysPage);

  return (
    <nav className="SectionNavigation">
      <div className="SectionNavigation__title" />
      {enabledSections.map((sectionId: string) => (
        <div key={sectionId}>
          <Link
            className={cn("SectionNavigation__navlink", {
              "SectionNavigation__navlink--active":
                currentSection === sectionId,
            })}
            to={`/${currentView}/${currentPage}/${sectionId}`}
            onClick={() => setSection(sectionId)}
          >
            {sections && sections[sectionId]}
            {currentSection === sectionId && (
              <Icon
                className="SectionNavigation__icon"
                kind={IconSVG.Arrow}
                width={16}
                height={16}
              />
            )}
          </Link>
        </div>
      ))}
    </nav>
  );
};

export default observer(SectionNavigation);
