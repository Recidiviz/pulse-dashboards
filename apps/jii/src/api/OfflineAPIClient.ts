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

import {
  allResidents,
  outputFixture,
  outputFixtureArray,
  usMeSccpFixtures,
} from "~datatypes";

import {
  IncarcerationOpportunityId,
  OpportunityRecord,
  StateCode,
} from "../configs/types";
import { DataAPI } from "./interface";

export class OfflineAPIClient implements DataAPI {
  constructor(private externals: { stateCode: StateCode }) {}

  private get stateCode() {
    return this.externals.stateCode;
  }

  /**
   * Fetches residents config object matching {@link stateCode}
   */
  async residentsConfig() {
    const { residentsConfigByState } = await import(
      "../configs/residentsConfig"
    );
    return residentsConfigByState[this.stateCode];
  }

  /**
   * Fetches fixture data for all residents matching {@link stateCode}
   */
  async residents() {
    return outputFixtureArray(allResidents).filter(
      (r) => r.stateCode === this.stateCode,
    );
  }

  /**
   * Fetches fixture data for the resident with personExternalId matching `residentExternalId`
   * and {@link stateCode}. Throws if a match cannot be found.
   */
  async residentById(residentExternalId: string) {
    const residentFixture = allResidents.find(
      (r) =>
        r.output.stateCode === this.stateCode &&
        r.output.personExternalId === residentExternalId,
    );

    if (residentFixture) {
      return outputFixture(residentFixture);
    }
    throw new Error(
      `Missing data for resident ${residentExternalId} in ${this.stateCode}`,
    );
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
