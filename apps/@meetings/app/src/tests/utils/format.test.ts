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

import {
  formatMeetingStartDateTitle,
  formatPersonTitle,
} from "../../utils/format";

describe("Formatting Utilities", () => {
  describe("formatMeetingStartDateTitle", () => {
    it('should format a date into "MM/dd/yy at HH:mm"', () => {
      const testDate = new Date("2026-03-02T14:29:47.174Z");

      const result = formatMeetingStartDateTitle(testDate);

      expect(result).toBe("03/02/26 at 09:29");
    });
  });

  describe("formatPersonTitle", () => {
    const externalId = "ID-123";

    it("should return fullName with externalId when fullName is provided", () => {
      const data = {
        fullName: "John Doe",
        displayPersonExternalId: externalId,
      };

      const result = formatPersonTitle(data);

      expect(result).toBe("John Doe | ID-123");
    });

    it("should fallback to givenNames and surname when fullName is missing", () => {
      const data = {
        givenNames: "Jane",
        surname: "Smith",
        displayPersonExternalId: externalId,
      };

      const result = formatPersonTitle(data);

      expect(result).toBe("Jane Smith | ID-123");
    });
  });
});
