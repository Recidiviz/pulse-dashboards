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

import { FilterParams, FirestoreAPIClient } from "~firestore-api";

import { residentOpportunitySchemas } from "../../configs/residentsOpportunitySchemas";
import {
  IncarcerationOpportunityId,
  ResidentsConfig,
  StateCode,
} from "../../configs/types";
import { proxyHost } from "../../utils/proxy";
import { AuthManager } from "../auth/AuthManager";
import { DataAPI } from "./interface";

export class ApiClient implements DataAPI {
  private firestoreClient: FirestoreAPIClient;

  private authentication: ILazyObservable<boolean>;

  constructor(
    private externals: {
      authManager: AuthManager;
      config?: ResidentsConfig;
    },
  ) {
    makeObservable<this, "isAuthenticated">(this, { isAuthenticated: true });

    this.firestoreClient = new FirestoreAPIClient(
      import.meta.env["VITE_FIRESTORE_PROJECT"],
      import.meta.env["VITE_FIRESTORE_API_KEY"],
      () => this.externals.authManager.isDemoUser,
      proxyHost(),
    );

    // this function will only run the first time auth is checked
    this.authentication = lazyObservable(async (updateValue) => {
      // note that we are assuming the auth flow is already complete by the time this is called,
      // otherwise this would result in an error being thrown
      const firebaseToken = await this.externals.authManager.getFirebaseToken();

      await this.firestoreClient.authenticate(firebaseToken);
      updateValue(true);
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
   * Fetches residents config object matching state code from {@link externals}.
   * This comes from a local static file, not an API backend
   */
  async residentsConfig(stateCode: StateCode) {
    const { residentsConfigByState } = await import(
      "../../configs/residentsConfig"
    );
    return residentsConfigByState[stateCode];
  }

  async residents(stateCode: StateCode, filters?: Array<FilterParams>) {
    await when(() => this.isAuthenticated);

    return await this.firestoreClient.residents(stateCode, filters);
  }

  async residentById(stateCode: StateCode, residentExternalId: string) {
    await when(() => this.isAuthenticated);

    const record = await this.firestoreClient.resident(
      stateCode,
      residentExternalId,
    );
    if (!record) {
      throw new Error(`No data found for resident ${residentExternalId}`);
    }

    return record;
  }

  async residentByPseudoId(stateCode: StateCode, residentPseudoId: string) {
    await when(() => this.isAuthenticated);

    const record = await this.firestoreClient.residentByPseudoId(
      stateCode,
      residentPseudoId,
    );
    if (!record) {
      throw new Error(`No data found for resident ${residentPseudoId}`);
    }

    return record;
  }

  async residentEligibility<O extends IncarcerationOpportunityId>(
    stateCode: StateCode,
    residentExternalId: string,
    opportunityId: O,
  ) {
    await when(() => this.isAuthenticated);
    try {
      const collectionName =
        this.externals.config?.eligibility?.incarcerationOpportunities[
          opportunityId
        ]?.firestoreCollection;

      if (!collectionName) {
        throw new Error(
          `Unable to resolve collection name for ${opportunityId}`,
        );
      }

      const schema = residentOpportunitySchemas[opportunityId];

      const record = await this.firestoreClient.recordForExternalId(
        stateCode,
        { raw: collectionName },
        residentExternalId,
        schema,
      );

      if (record) return record;

      throw new Error(
        `Missing ${opportunityId} record for ${residentExternalId}`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      throw e;
    }
  }
}
