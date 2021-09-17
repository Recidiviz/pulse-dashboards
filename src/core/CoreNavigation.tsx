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

import "./CoreNavigation.scss";

import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useLocation } from "react-router-dom";

import recidivizLogo from "../assets/static/images/Logo.svg";
import { useRootStore } from "../components/StoreProvider";
import UserAvatar from "../components/UserAvatar";
import flags from "../flags";
import { useCoreStore } from "./CoreStoreProvider";
import CoreViewNavigation from "./CoreViewNavigation";
import PageNavigation from "./PageNavigation";
import { CORE_VIEWS } from "./views";

const CoreNavigation: React.FC = () => {
  const { pathname } = useLocation();
  const { currentTenantId, userStore } = useRootStore();
  const { setView } = useCoreStore();
  if (!currentTenantId) return null;

  const navigationLayout = userStore.userAllowedNavigation;
  const [currentView, currentPage] = pathname.split("/").slice(1, 3);
  const pageOptions = navigationLayout[currentView] ?? [];
  const menu = [] as {
    label: string;
    link: string;
  }[];
  Object.entries(navigationLayout).forEach((entry) => {
    const page = entry[0];
    const options = entry[1];
    if (!Object.values(CORE_VIEWS).includes(page)) return;
    menu.push({
      label: page[0].toUpperCase() + page.slice(1),
      // @ts-ignore
      link: `/${page}${options.length ? `/${options[0]}` : ""}`,
    });
  });

  return (
    <nav className="CoreNavigation">
      <div className="CoreNavigation__left">
        <div className="CoreNavigation__logo">
          <Link to="/">
            <img
              className="CoreNavigation__logo-image"
              src={recidivizLogo}
              alt="Logo"
            />
          </Link>
        </div>
        <CoreViewNavigation
          onClick={(link: string) => setView(link)}
          menu={menu}
        />
      </div>
      <div className="CoreNavigation__right">
        {flags.enableCoreTabNavigation && (
          <PageNavigation
            currentView={currentView}
            currentPage={currentPage ?? ""}
            pageOptions={pageOptions}
          />
        )}
        <UserAvatar />
      </div>
    </nav>
  );
};

export default observer(CoreNavigation);
