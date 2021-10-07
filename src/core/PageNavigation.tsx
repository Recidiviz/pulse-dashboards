// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import "./PageNavigation.scss";

import cx from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useLocation } from "react-router-dom";

import { useRootStore } from "../components/StoreProvider";
import useIsMobile from "../hooks/useIsMobile";
import { useCoreStore } from "./CoreStoreProvider";
import { NavigationSection } from "./types/navigation";
import { getPageHeadingFromId, PATHWAYS_VIEWS } from "./views";
import withRouteSync from "./withRouteSync";

const PageNavigation: React.FC = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { page } = useCoreStore();
  const { userStore } = useRootStore();
  const currentView = pathname.split("/")[1];
  const navigationLayout = userStore.userAllowedNavigation;
  const pageOptions = navigationLayout[currentView] ?? [];

  const isCoreView =
    currentView &&
    !Object.values(PATHWAYS_VIEWS).includes(currentView.toLowerCase());
  const isPathwaysView =
    currentView &&
    Object.values(PATHWAYS_VIEWS).includes(currentView.toLowerCase());

  return (
    <ul
      className={cx("PageNavigation", {
        "PageNavigation--pathways": isPathwaysView && !isMobile,
        "PageNavigation--core": isCoreView,
        "PageNavigation--mobile": isMobile && isPathwaysView,
      })}
    >
      {pageOptions.map((pageOption: NavigationSection) => (
        <li key={pageOption}>
          <Link
            to={`/${currentView}/${pageOption}`}
            className={cx("PageNavigation__option", {
              "PageNavigation__option--selected":
                page?.toLowerCase() === pageOption.toLowerCase(),
            })}
          >
            {getPageHeadingFromId(pageOption)}
          </Link>
        </li>
      ))}
    </ul>
  );
};
export default withRouteSync(observer(PageNavigation));
