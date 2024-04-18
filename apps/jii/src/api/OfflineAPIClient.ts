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
  incarcerationStaffFixtures,
  outputFixture,
  outputFixtureArray,
} from "~datatypes";

import type { RootStore } from "../datastores/RootStore";
import { DataAPI } from "./interface";

export class OfflineAPIClient implements DataAPI {
  constructor(private readonly rootStore: RootStore) {}

  private get stateCode() {
    return this.rootStore.stateCode;
  }

  /**
   * Fetches fixture data for all residents matching `this.stateCode`
   */
  async residents() {
    return outputFixtureArray(allResidents).filter(
      (r) => r.stateCode === this.stateCode,
    );
  }

  /**
   * Fetches fixture data for the resident with personExternalId matching `residentExternalId`
   * and `this.stateCode`. Throws if a match cannot be found.
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
   * Fetches fixture data for the incarceration staff member matching `staffId`
   * and `this.stateCode`. Throws if a match cannot be found.
   */
  async incarcerationStaffById(staffId: string) {
    const staffFixture = incarcerationStaffFixtures.find((f) =>
      isMatch(outputFixture(f), { stateCode: this.stateCode, id: staffId }),
    );

    if (staffFixture) {
      return outputFixture(staffFixture);
    }
    throw new Error(
      `Missing data for incarceration staff ${staffId} in ${this.stateCode}`,
    );
  }

  /**
   * Convenience method to fetch fixture data for both a resident and their assigned
   * incarceration staff member, since the latter depends on the former. Throws if
   * either record cannot be found.
   */
  async residentAndAssignedStaffById(residentExternalId: string) {
    const resident = await this.residentById(residentExternalId);
    const staff = await this.incarcerationStaffById(resident.officerId);

    return { resident, staff };
  }
}
