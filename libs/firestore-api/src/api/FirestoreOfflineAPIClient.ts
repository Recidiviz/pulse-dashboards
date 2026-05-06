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

import {
  allResidents,
  locationRecordFixtures,
  shiftAllDates,
} from "~datatypes";

import { MissingRecordError } from "./errors";
import { FirestoreAPI } from "./interface";

export class FirestoreOfflineAPIClient implements FirestoreAPI {
  async residents(stateCode: string) {
    return allResidents
      .filter((r) => r.stateCode === stateCode)
      .map((r) => shiftAllDates(r));
  }

  async residentByPseudoId(stateCode: string, pseudoId: string) {
    const residentFixture = allResidents.find(
      (r) => r.stateCode === stateCode && r.pseudonymizedId === pseudoId,
    );

    if (!residentFixture)
      throw new MissingRecordError(
        `Record for ${pseudoId} in ${stateCode} missing from offline data`,
      );

    return shiftAllDates(residentFixture);
  }

  async recordForExternalId() {
    throw new Error("Not implemented");
  }

  async locations(stateCode: string) {
    return locationRecordFixtures.filter((r) => r.stateCode === stateCode);
  }
}
