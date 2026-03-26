// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { captureException } from "@sentry/react";
import { makeAutoObservable, onReactionError } from "mobx";

import {
  DEFAULT_PATHWAYS_PAGE,
  DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  PATHWAYS_PAGES,
  PathwaysPage,
  PathwaysSection,
  PathwaysTenantId,
} from "~shared-pathways";

import AnalyticsStore from "./AnalyticsStore";
import FiltersStore from "./FiltersStore";
import MetricsStore from "./MetricsStore";
import UserStore from "./UserStore";

// global error handling for Mobx reactions
onReactionError((error) => {
  captureException(error);
});

/**
 * Returns the auth settings configured for the current environment, if any.
 */
export function getAuthSettings(): Auth0ClientOptions | undefined {
  const clientId = import.meta.env["VITE_PUBLIC_PATHWAYS_AUTH0_CLIENT_ID"];
  const domain = import.meta.env["VITE_PUBLIC_PATHWAYS_AUTH0_DOMAIN"];
  const audience = import.meta.env["VITE_PUBLIC_PATHWAYS_AUTH0_AUDIENCE"];
  if (!clientId || !domain || !audience) return undefined;

  return {
    clientId,
    domain,
    authorizationParams: {
      audience,
      redirect_uri: `${window.location.origin}`,
    },
  };
}

export class RootStore {
  userStore: UserStore;

  filtersStore: FiltersStore;

  metricsStore: MetricsStore;

  analyticsStore: AnalyticsStore;

  page: PathwaysPage = PATHWAYS_PAGES.prison;

  section: PathwaysSection =
    DEFAULT_PATHWAYS_SECTION_BY_PAGE[DEFAULT_PATHWAYS_PAGE];

  currentTenantId = "US_NY" as PathwaysTenantId;

  setSection(section: PathwaysSection): void {
    this.section = section;
  }

  constructor() {
    makeAutoObservable(this);

    this.userStore = new UserStore({
      authSettings: getAuthSettings(),
      rootStore: this,
    });
    this.filtersStore = new FiltersStore({ rootStore: this });
    this.metricsStore = new MetricsStore({ rootStore: this });
    this.analyticsStore = new AnalyticsStore({ rootStore: this });
  }

  setPage(page: PathwaysPage): void {
    this.page = page;
  }
}
