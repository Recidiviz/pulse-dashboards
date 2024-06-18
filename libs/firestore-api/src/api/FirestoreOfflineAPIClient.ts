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
  outputFixture,
  outputFixtureArray,
  StaffRecord,
  supervisionStaffFixtures,
} from "~datatypes";

import { FirestoreAPI } from "./interface";

export class FirestoreOfflineAPIClient implements FirestoreAPI {
  constructor(private stateCode: string) {}

  async authenticate(): Promise<void> {
    return;
  }

  async staffRecordsWithSupervisor(
    supervisorExternalId: string,
  ): Promise<StaffRecord[]> {
    return outputFixtureArray(supervisionStaffFixtures).filter(
      (staffRecord) =>
        staffRecord.stateCode === this.stateCode &&
        staffRecord.supervisorExternalId === supervisorExternalId,
    );
  }

  async residents() {
    return outputFixtureArray(allResidents).filter(
      (r) => r.stateCode === this.stateCode,
    );
  }

  async resident(externalId: string) {
    const residentFixture = allResidents.find(
      (r) =>
        r.output.stateCode === this.stateCode &&
        r.output.personExternalId === externalId,
    );

    return residentFixture ? outputFixture(residentFixture) : undefined;
  }

  async recordForExternalId() {
    throw new Error("Not implemented");
  }
}
