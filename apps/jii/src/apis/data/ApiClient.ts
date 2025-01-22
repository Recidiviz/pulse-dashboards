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

import { makeObservable, when } from "mobx";
import { ILazyObservable, lazyObservable } from "mobx-utils";

import { AuthClient } from "~auth";
import { FilterParams, FirestoreAPIClient } from "~firestore-api";

import { residentOpportunitySchemas } from "../../configs/residentsOpportunitySchemas";
import {
  IncarcerationOpportunityId,
  ResidentsConfig,
  StateCode,
  StateLandingPageConfig,
} from "../../configs/types";
import { DataAPI } from "./interface";

const API_URL_BASE = import.meta.env["VITE_API_URL_BASE"];

export class ApiClient implements DataAPI {
  private firestoreClient: FirestoreAPIClient;

  private authentication: ILazyObservable<boolean>;

  constructor(
    private externals: {
      stateCode: StateCode;
      authClient: AuthClient;
      config?: ResidentsConfig;
    },
  ) {
    makeObservable<this, "isAuthenticated">(this, { isAuthenticated: true });

    this.firestoreClient = new FirestoreAPIClient(
      externals.stateCode,
      import.meta.env["VITE_FIRESTORE_PROJECT"],
      import.meta.env["VITE_FIRESTORE_API_KEY"],
    );

    // this function will only run the first time auth is checked
    this.authentication = lazyObservable(async (sink) => {
      const response = await fetch(`${API_URL_BASE}/firebaseToken`, {
        headers: {
          Authorization: `Bearer ${await externals.authClient.getTokenSilently()}`,
        },
      });
      let firebaseToken: string;
      if (response.ok) {
        firebaseToken = (await response.json()).firebaseToken;
      } else {
        throw new Error("Unable to retrieve Firebase token");
      }
      await this.firestoreClient.authenticate(firebaseToken);
      sink(true);
    }, false);
  }

  get isAuthenticated() {
    return this.authentication.current();
  }

  /**
   * Fetches application config object for the landing page (pre-login)
   */
  async landingPageConfig() {
    const { landingPageConfig } = await import(
      "../../configs/landingPageConfig"
    );
    return landingPageConfig;
  }

  /**
   * Fetches application config object for a state-specific landing page (pre-login)
   */
  async stateLandingPageConfig(
    stateCode: StateCode,
  ): Promise<StateLandingPageConfig> {
    const { getConfig } = await import(
      `../../configs/${stateCode}/landingPageConfig/config.ts`
    );
    return getConfig(import.meta.env["VITE_AUTH_ENV"]);
  }

  /**
   * Fetches residents config object matching state code from {@link externals}.
   * This comes from a local static file, not an API backend
   */
  async residentsConfig() {
    const { residentsConfigByState } = await import(
      "../../configs/residentsConfig"
    );
    return residentsConfigByState[this.externals.stateCode];
  }

  async residents(filters?: Array<FilterParams>) {
    await when(() => this.isAuthenticated);

    return await this.firestoreClient.residents(filters);
  }

  async residentById(residentExternalId: string) {
    await when(() => this.isAuthenticated);

    const record = await this.firestoreClient.resident(residentExternalId);
    if (!record) {
      throw new Error(`No data found for resident ${residentExternalId}`);
    }

    return record;
  }

  async residentByPseudoId(residentPseudoId: string) {
    await when(() => this.isAuthenticated);

    const record =
      await this.firestoreClient.residentByPseudoId(residentPseudoId);
    if (!record) {
      throw new Error(`No data found for resident ${residentPseudoId}`);
    }

    return record;
  }

  async residentEligibility<O extends IncarcerationOpportunityId>(
    residentExternalId: string,
    opportunityId: O,
  ) {
    await when(() => this.isAuthenticated);
    try {
      const collectionName =
        this.externals.config?.incarcerationOpportunities[opportunityId]
          ?.firestoreCollection;

      if (!collectionName) {
        throw new Error(
          `Unable to resolve collection name for ${opportunityId}`,
        );
      }

      const schema = residentOpportunitySchemas[opportunityId];

      const record = await this.firestoreClient.recordForExternalId(
        { raw: collectionName },
        residentExternalId,
        schema,
      );

      if (record) return record;

      throw new Error(
        `Missing ${opportunityId} record for ${residentExternalId}`,
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
