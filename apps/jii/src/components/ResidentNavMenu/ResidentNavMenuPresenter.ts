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

export type LinkProps = {
  children: string;
  to: string;
};

export class ResidentNavMenuPresenter {
  constructor(
    private config: ResidentsConfig,
    private userStore: UserStore,
    private routeParams:
      | RouteParams<typeof State.Resident>
      | RouteParams<typeof State>,
  ) {
    makeAutoObservable(this);
  }

  get homeLink(): LinkProps | undefined {
    if (!("personPseudoId" in this.routeParams)) return;

    return {
      children: "Home",
      to: State.Resident.buildPath(this.routeParams),
    };
  }

  get searchLink(): LinkProps | undefined {
    if (!this.userStore.hasPermission("enhanced")) return;

    return {
      children: "Search",
      to: State.Search.buildPath({
        stateSlug: this.routeParams.stateSlug,
      }),
    };
  }

  get opportunityLinks(): Array<LinkProps> | undefined {
    const { routeParams } = this;

    if (!("personPseudoId" in routeParams)) return;

    const links = [];

    links.push(
      ...Object.values(this.config.incarcerationOpportunities).map((c) => ({
        children: c.name,
        to: State.Resident.Eligibility.Opportunity.buildPath({
          ...routeParams,
          opportunitySlug: c.urlSlug,
        }),
      })),
    );

    if (!links.length) return;

    return links;
  }
}
