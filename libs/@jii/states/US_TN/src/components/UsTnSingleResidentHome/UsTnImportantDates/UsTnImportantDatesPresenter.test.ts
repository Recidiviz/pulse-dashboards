// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ResidentRecord } from "~datatypes";

import { UsTnImportantDatesPresenter } from "./UsTnImportantDatesPresenter";

describe("UsTnImportantDatesPresenter tests", () => {
  describe("expirationDateReduced", () => {
    it("should return true if expirationDateOriginal is greater than expirationDate", () => {
      const expirationDateOriginal = new Date("2025-04-01");
      const expirationDate = new Date("2024-12-01");
      const presenter = new UsTnImportantDatesPresenter({
        metadata: {
          stateCode: "US_TN",
          expirationDate,
          expirationDateOriginal,
        },
      } as never as ResidentRecord);

      expect(presenter.expirationDateReduced).toBe(true);
    });

    it("should return false if expirationDateOriginal is less than or equal to expirationDate", () => {
      const expirationDateOriginal = new Date("2024-12-01");
      const expirationDate = new Date("2024-12-01");
      const presenter = new UsTnImportantDatesPresenter({
        metadata: {
          stateCode: "US_TN",
          expirationDate,
          expirationDateOriginal,
        },
      } as never as ResidentRecord);

      expect(presenter.expirationDateReduced).toBe(false);
    });
  });

  describe("expirationDateReduction", () => {
    it("should return an empty string if the metadata state code is not US_TN", () => {
      const presenter = new UsTnImportantDatesPresenter({
        metadata: {
          stateCode: "US_CA",
          expirationDate: new Date(),
          expirationDateOriginal: new Date(),
        },
      } as never as ResidentRecord);
      expect(presenter.expirationDateReduction).toBe("");
    });

    it("should return the formatted duration between expirationDate and expirationDateOriginal in days", () => {
      const expirationDateOriginal = new Date("2025-04-01");
      const expirationDate = new Date("2024-12-01");
      const presenter = new UsTnImportantDatesPresenter({
        metadata: {
          stateCode: "US_TN",
          expirationDate,
          expirationDateOriginal,
        },
      } as never as ResidentRecord);

      expect(presenter.expirationDateReduction).toBe("121 days");
    });
  });
});
