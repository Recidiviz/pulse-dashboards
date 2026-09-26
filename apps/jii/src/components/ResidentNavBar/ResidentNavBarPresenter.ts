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
import { ResidentFlags, UserStore } from "~@jii/data";
import { RouteParams, State } from "~@jii/paths";

type AdditionalTopBarLink = {
  label: string;
  to: string;
  // Whether this link should stay highlighted while on any of its sub-routes,
  // rather than only when its own path is matched exactly. Defaults to false.
  activeOnSubroutes?: boolean;
};

export class ResidentNavBarPresenter {
  constructor(
    private userStore: UserStore,
    private routeParams:
      | RouteParams<typeof State.Resident>
      | RouteParams<typeof State>,
    private residentFlags?: ResidentFlags,
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
  get additionalTopBarLinks(): AdditionalTopBarLink[] {
    if (!("personPseudoId" in this.routeParams)) return [];

    if (this.routeParams.stateSlug === "tennessee") {
      return [
        {
          label: "About",
          to: State.Resident.UsTnMoreInformation.About.buildPath(
            this.routeParams,
          ),
        },
      ];
    }

    if (this.routeParams.stateSlug === "arizona") {
      const links = [
        {
          label: "About",
          to: State.Resident.UsAzMoreInformation.About.buildPath(
            this.routeParams,
          ),
        },
      ];
      if (this.residentFlags?.usAzClassification) {
        links.push({
          label: "My Classification",
          to: State.Resident.UsAzClassificationPoints.buildPath(
            this.routeParams,
          ),
        });
      }
      return links;
    }

    const showsProgramCatalog =
      this.routeParams.stateSlug === "arkansas" ||
      (this.routeParams.stateSlug === "colorado" &&
        // TODO OBT-49104 remove after the Edovo credits launch
        !!this.residentFlags?.usCoEdovoCredits);

    if (showsProgramCatalog) {
      return [
        {
          label: "Programs",
          to: State.Resident.ProgramCatalog.buildPath(this.routeParams),
        },
      ];
    }

    if (this.routeParams.stateSlug === "mass") {
      const links: AdditionalTopBarLink[] = [
        {
          label: "Programs",
          to: State.Resident.ProgramCatalog.buildPath(this.routeParams),
        },
      ];

      if (this.residentFlags?.usMaReentry) {
        links.push({
          label: "Reentry",
          to: State.Resident.UsMaReentry.buildPath(this.routeParams),
          activeOnSubroutes: true,
        });
      }

      return links;
    }

    return [];
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
