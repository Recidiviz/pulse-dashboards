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

import { FirestoreFixture } from "./utils";

// Per-user overrides the scoped-key mint endpoint reads alongside the staff
// record. `overrideDistrictIds` takes precedence over the staff record's own
// `district`, which is the branch these fixtures exist to cover.
//
// Docs land at `<lowercased stateCode>_<externalId>`, matching `staffDocId` in
// apps/staff-server/src/server/workflows/typesense/utils.ts. The loader adds the
// state prefix itself, so `idFunc` returns the bare external id.
type UserUpdateFixture = {
  stateCode: string;
  externalId: string;
  overrideDistrictIds?: string[];
};

export const userUpdatesData: FirestoreFixture<UserUpdateFixture> = {
  data: [
    // Pairs with the E2E_TN_OVERRIDE staff record, whose own district is
    // "E2E DISTRICT 1". These two win instead.
    {
      stateCode: "US_TN",
      externalId: "E2E_TN_OVERRIDE",
      overrideDistrictIds: ["E2E DISTRICT 2", "E2E DISTRICT 3"],
    },
  ],
  idFunc: (r) => r.externalId,
};
