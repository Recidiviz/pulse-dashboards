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

import { testTranslation } from "../../utils/testTranslation";

describe("numberOfDaysFormatter", () => {
  describe("English", () => {
    it("should format 1 day", async () => {
      const result = await testTranslation("{{value, numberOfDays}}", {
        value: 1,
      });
      expect(result).toBe("1 day");
    });

    it("should format a positive number of days", async () => {
      const result = await testTranslation("{{value, numberOfDays}}", {
        value: 5,
      });
      expect(result).toBe("5 days");
    });

    it("should format a negative number of days", async () => {
      const result = await testTranslation("{{value, numberOfDays}}", {
        value: -3,
      });
      expect(result).toBe("-3 days");
    });

    it("should format a large number of days", async () => {
      const result = await testTranslation("{{value, numberOfDays}}", {
        value: 1845,
      });
      expect(result).toBe("1,845 days");
    });
  });

  describe("Spanish", () => {
    it("should format 1 day", async () => {
      const result = await testTranslation(
        "{{value, numberOfDays}}",
        { value: 1 },
        "es",
      );
      expect(result).toBe("1 día");
    });

    it("should format a positive number of days", async () => {
      const result = await testTranslation(
        "{{value, numberOfDays}}",
        { value: 5 },
        "es",
      );
      expect(result).toBe("5 días");
    });

    it("should format a negative number of days", async () => {
      const result = await testTranslation(
        "{{value, numberOfDays}}",
        { value: -3 },
        "es",
      );
      expect(result).toBe("-3 días");
    });
  });
});
