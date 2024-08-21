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

import "./PageNavigation.scss";

import { palette } from "@recidiviz/design-system";
import cx from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { PATHWAYS_TENANTS } from "../../RootStore/TenantStore/pathwaysTenants";
import { getMethodologyCopy, getPageCopy } from "../content";
import { useCoreStore } from "../CoreStoreProvider";
import { NavigationLayout } from "../NavigationLayout";
import { NavigationSection } from "../types/navigation";
import { isValidDashboardRootPath } from "../views";

const PageNavigation: React.FC = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { page } = useCoreStore();
  const { userStore, currentTenantId } = useRootStore();
  const currentView = pathname.split("/")[1];
  const navigationLayout = userStore.userAllowedNavigation;
  const pageOptions = navigationLayout[currentView] ?? [];
  const isDashboardView = PATHWAYS_TENANTS.includes(currentTenantId);
  // TODO(#2016): Remove try-catch once getMethodologyCopy() always returns copy
  let mergePageAndMethodologyCopy = getPageCopy(currentTenantId);
  try {
    mergePageAndMethodologyCopy = {
      ...mergePageAndMethodologyCopy,
      ...getMethodologyCopy(currentTenantId),
    };
  } catch {
    // no methodology exists for state
  }

  const options = pageOptions.map((pageOption: NavigationSection) => (
    <li key={pageOption}>
      <NavLink
        to={{ pathname: `/${currentView}/${pageOption}`, hash: "" }}
        className={cx("PageNavigation__option", {
          "PageNavigation__option--selected":
            page?.toLowerCase() === pageOption.toLowerCase(),
        })}
      >
        {/* @ts-ignore */}
        {mergePageAndMethodologyCopy?.[pageOption]?.title}
      </NavLink>
    </li>
  ));

  if (!isMobile)
    return (
      <NavigationLayout backgroundColor={palette.marble3}>
        {options}
      </NavigationLayout>
    );

  return (
    <ul
      className={cx("PageNavigation", {
        "PageNavigation--pathways":
          isDashboardView && !isMobile && isValidDashboardRootPath(currentView),
        "PageNavigation--mobile": isMobile && isDashboardView,
      })}
    >
      {options}
    </ul>
  );
};

export default observer(PageNavigation);
