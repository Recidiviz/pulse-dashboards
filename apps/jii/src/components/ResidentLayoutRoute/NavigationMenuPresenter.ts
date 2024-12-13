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
import { UserStore } from "../../datastores/UserStore";
import { State } from "../../routes/routes";
import { RouteParams } from "../../routes/utils";
import { ResidentsContext } from "../ResidentsHydrator/context";

export class NavigationMenuPresenter {
  constructor(
    private config: ResidentsConfig,
    private userStore: UserStore,
    private residentRouteParams: RouteParams<typeof State.Resident>,
    private activeResident: ResidentsContext["activeResident"],
  ) {
    makeAutoObservable(this);
  }

  get links() {
    const links = [{ text: "Home", url: "/" }];

    if (this.userStore.hasPermission("enhanced")) {
      links.push({
        text: "Search for Residents",
        url: State.Search.buildPath({
          stateSlug: this.residentRouteParams.stateSlug,
        }),
      });
    }

    // these links will just be broken without a resident active
    if (this.activeResident) {
      links.push(
        ...Object.values(this.config.incarcerationOpportunities).map((c) => ({
          text: c.shortName,
          url: State.Resident.Eligibility.Opportunity.buildPath({
            ...this.residentRouteParams,
            opportunitySlug: c.urlSlug,
          }),
        })),
      );
    }

    return links;
  }

  logout() {
    this.userStore.logOut();
  }
}
