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

import { makeAutoObservable } from "mobx";

import { ResidentsConfig } from "../../configs/types";
import { RootStore } from "../../datastores/RootStore";

export class NavigationMenuPresenter {
  constructor(
    private config: ResidentsConfig,
    private rootStore: RootStore,
  ) {
    makeAutoObservable(this);
  }

  get links() {
    const links = [{ text: "Home", url: "/" }];

    if (this.rootStore.userStore.hasEnhancedPermission) {
      links.push({ text: "Search for Residents", url: "/search" });
    }

    links.push(
      ...Object.values(this.config.incarcerationOpportunities).map((c) => ({
        text: c.copy.menuLabel,
        url: `/eligibility/${c.urlSection}`,
      })),
    );

    return links;
  }

  logout() {
    this.rootStore.authStore.logout();
  }
}
