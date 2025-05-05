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
import { SimpleNavLinkProps } from "../types";

export class ResidentNavBarPresenter {
  constructor(
    private config: ResidentsConfig,
    private userStore: UserStore,
    private routeParams:
      | RouteParams<typeof State.Resident>
      | RouteParams<typeof State>,
  ) {
    makeAutoObservable(this);
  }

  get homeLink(): SimpleNavLinkProps | undefined {
    if (!("personPseudoId" in this.routeParams)) return;

    return {
      children: "Home",
      to: State.Resident.buildPath(this.routeParams),
      end: true,
    };
  }

  get menuLinks(): Array<SimpleNavLinkProps> {
    const links: Array<SimpleNavLinkProps> = [];

    const { routeParams } = this;
    if (
      "personPseudoId" in routeParams &&
      this.config.eligibility?.incarcerationOpportunities
    ) {
      links.push(
        ...Object.values(
          this.config.eligibility.incarcerationOpportunities,
        ).map((c) => ({
          children: c.name,
          to: State.Resident.Eligibility.Opportunity.buildPath({
            ...routeParams,
            opportunitySlug: c.urlSlug,
          }),
          end: false,
        })),
      );
    }

    if (this.userStore.hasPermission("enhanced")) {
      links.push({
        children: "Search",
        to: State.Search.buildPath({
          stateSlug: this.routeParams.stateSlug,
        }),
        end: true,
      });
    }

    return links;
  }
}
