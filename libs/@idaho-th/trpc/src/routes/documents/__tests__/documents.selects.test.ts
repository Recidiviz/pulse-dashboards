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

import { describe, expect, it } from "vitest";

import {
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
} from "~@idaho-th/prisma/client";

import {
  confirmedDocumentsWhere,
  listableProviderDocumentsWhere,
  listableStaffDocumentsWhere,
  providerVisibleDocumentsWhere,
} from "../documents.selects";

const HOUSING_PROVIDER_ID = "housing-provider-1";

describe("confirmedDocumentsWhere", () => {
  it("limits to confirmed documents", () => {
    expect(confirmedDocumentsWhere()).toEqual({
      status: HousingApplicationDocumentStatus.CONFIRMED,
    });
  });
});

describe("providerVisibleDocumentsWhere", () => {
  it("returns the provider's own-scoped and shared documents only", () => {
    expect(providerVisibleDocumentsWhere(HOUSING_PROVIDER_ID)).toEqual({
      status: HousingApplicationDocumentStatus.CONFIRMED,
      OR: [
        { scopedProviderId: HOUSING_PROVIDER_ID },
        { scopedProviderId: null },
      ],
    });
  });
});

describe("listableStaffDocumentsWhere", () => {
  it("excludes INFECTED documents from the staff list", () => {
    expect(listableStaffDocumentsWhere()).toEqual({
      status: HousingApplicationDocumentStatus.CONFIRMED,
      scanStatus: { not: HousingApplicationDocumentScanStatus.INFECTED },
    });
  });
});

describe("listableProviderDocumentsWhere", () => {
  it("excludes INFECTED documents from the provider-visible list", () => {
    expect(listableProviderDocumentsWhere(HOUSING_PROVIDER_ID)).toEqual({
      status: HousingApplicationDocumentStatus.CONFIRMED,
      OR: [
        { scopedProviderId: HOUSING_PROVIDER_ID },
        { scopedProviderId: null },
      ],
      scanStatus: { not: HousingApplicationDocumentScanStatus.INFECTED },
    });
  });
});
