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

import { SimpleNavLinkProps } from "~@jii/common-ui";
import { UserStore } from "~@jii/data";
import { State } from "~@jii/paths";
import { RouteParams } from "~@jii/paths";

export class ResidentNavBarPresenter {
  constructor(
    private userStore: UserStore,
    private routeParams:
      | RouteParams<typeof State.Resident>
      | RouteParams<typeof State>,
  ) {
    makeAutoObservable(this);
  }

  get homeLink() {
    if (!("personPseudoId" in this.routeParams)) return;

    return {
      to: State.Resident.buildPath(this.routeParams),
      end: true,
    };
  }

  // TODO(#10032): [JII][P2] Parameterize additional top-level links in ResidentNavBar
  get additionalTopBarLinks(): { label: string; to: string }[] {
    if (
      !("personPseudoId" in this.routeParams) ||
      this.routeParams.stateSlug !== "tennessee"
    )
      return [];

    return [
      {
        label: "About",
        to: State.Resident.UsTnMoreInformation.About.buildPath(
          this.routeParams,
        ),
      },
    ];
  }

  get menuLinks(): Array<SimpleNavLinkProps> {
    const links: Array<SimpleNavLinkProps> = [];

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
