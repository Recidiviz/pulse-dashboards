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

import assertNever from "assert-never";
import isMatch from "lodash/isMatch";

import {
  outputFixture,
  usMeSccpFixtures,
  usMeWorkReleaseFixtures,
} from "~datatypes";
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

  // have to accept an argument for compatibility, but we don't need it for anything
  constructor(externals: unknown) {
    this.firestoreClient = new FirestoreOfflineAPIClient();
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
   * Fetches residents config object matching `stateCode`
   */
  async residentsConfig(stateCode: StateCode) {
    const { residentsConfigByState } = await import(
      "../../configs/residentsConfig"
    );
    return residentsConfigByState[stateCode];
  }

  /**
   * Fetches fixture data for all residents matching `stateCode`
   */
  async residents(stateCode: StateCode) {
    return this.firestoreClient.residents(stateCode);
  }

  /**
   * Fetches fixture data for the resident with personExternalId matching `residentExternalId`
   * and `stateCode`. Throws if a match cannot be found.
   */
  async residentById(stateCode: StateCode, residentExternalId: string) {
    const residentFixture = await this.firestoreClient.resident(
      stateCode,
      residentExternalId,
    );

    if (!residentFixture) {
      throw new Error(
        `Missing data for resident ${residentExternalId} in ${stateCode}`,
      );
    }

    return residentFixture;
  }

  /**
   * Fetches data for the resident with pseudonymizedId matching `residentPseudoId`
   * and `stateCode`. Throws if a match cannot be found.
   */
  async residentByPseudoId(stateCode: StateCode, residentPseudoId: string) {
    const residentFixture = await this.firestoreClient.residentByPseudoId(
      stateCode,
      residentPseudoId,
    );

    if (!residentFixture) {
      throw new Error(
        `Missing data for resident ${residentPseudoId} in ${stateCode}`,
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
    stateCode: StateCode,
    residentExternalId: string,
    opportunityId: O,
  ): Promise<OpportunityRecord<O>> {
    let fixture: OpportunityRecord<O> | undefined;

    switch (opportunityId) {
      case "usMeSCCP": {
        const parsedFixture = Object.values(usMeSccpFixtures).find((f) =>
          isMatch(outputFixture(f), {
            stateCode: stateCode,
            externalId: residentExternalId,
          }),
        );

        fixture = parsedFixture ? outputFixture(parsedFixture) : undefined;
        break;
      }
      case "usMeWorkRelease": {
        fixture = Object.values(usMeWorkReleaseFixtures).find((f) =>
          isMatch(f, {
            stateCode: stateCode,
            externalId: residentExternalId,
          }),
        );
        break;
      }
      default:
        assertNever(opportunityId);
    }

    if (!fixture) {
      throw new Error(
        `Unable to find ${opportunityId} record for ${residentExternalId}`,
      );
    }

    return fixture;
  }
}
