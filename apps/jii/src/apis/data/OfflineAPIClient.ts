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

import isMatch from "lodash/isMatch";

import { outputFixture, usMeSccpFixtures } from "~datatypes";
import { FirestoreAPI, FirestoreOfflineAPIClient } from "~firestore-api";

import {
  IncarcerationOpportunityId,
  OpportunityRecord,
  StateCode,
  StateLandingPageConfig,
} from "../../configs/types";
import { DataAPI } from "./interface";

export class OfflineAPIClient implements DataAPI {
  private firestoreClient: FirestoreAPI;

  constructor(private externals: { stateCode: StateCode }) {
    this.firestoreClient = new FirestoreOfflineAPIClient(externals.stateCode);
  }

  private get stateCode() {
    return this.externals.stateCode;
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
    return getConfig(import.meta.env["VITE_AUTH0_TENANT_KEY"]);
  }

  /**
   * Fetches residents config object matching {@link stateCode}
   */
  async residentsConfig() {
    const { residentsConfigByState } = await import(
      "../../configs/residentsConfig"
    );
    return residentsConfigByState[this.stateCode];
  }

  /**
   * Fetches fixture data for all residents matching {@link stateCode}
   */
  async residents() {
    return this.firestoreClient.residents();
  }

  /**
   * Fetches fixture data for the resident with personExternalId matching `residentExternalId`
   * and {@link stateCode}. Throws if a match cannot be found.
   */
  async residentById(residentExternalId: string) {
    const residentFixture =
      await this.firestoreClient.resident(residentExternalId);

    if (!residentFixture) {
      throw new Error(
        `Missing data for resident ${residentExternalId} in ${this.stateCode}`,
      );
    }

    return residentFixture;
  }

  /**
   * Fetches the opportunity eligibility record fixture for the specified resident
   * and opportunity type, returning `undefined` if a record is not found (indicating
   * the resident is not currently eligible).
   */
  async residentEligibility<O extends IncarcerationOpportunityId>(
    residentExternalId: string,
    opportunityId: O,
  ): Promise<OpportunityRecord<O> | undefined> {
    // for convenience, while there is only one opportunity configured we skip the ID lookup step
    const fixture = Object.values(usMeSccpFixtures).find((f) =>
      isMatch(outputFixture(f), {
        stateCode: this.stateCode,
        externalId: residentExternalId,
      }),
    );

    if (!fixture) {
      return;
    }

    return outputFixture(fixture);
  }
}
