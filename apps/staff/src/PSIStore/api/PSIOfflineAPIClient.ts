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

import { PSIStore } from "../PSIStore";
import { Case, Staff } from "./PSIAPIClient";

// TODO(#29901): Remove `as unknown as` once the final Staff/Case response shape is solidified.

export class PSIOfflineAPIClient {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly psiStore: PSIStore) {}

  async getStaffInfo(): Promise<Staff> {
    const { PSIStaffInfoFixture } = await import(
      "../offlineFixtures/PSIStaffInfoFixture"
    );
    return PSIStaffInfoFixture as unknown as Promise<Staff>;
  }

  async getCaseDetails(): Promise<Case> {
    const { PSICaseDetailsFixture } = await import(
      "../offlineFixtures/PSICaseDetailsFixture"
    );
    return PSICaseDetailsFixture as unknown as Promise<Case>;
  }
}
