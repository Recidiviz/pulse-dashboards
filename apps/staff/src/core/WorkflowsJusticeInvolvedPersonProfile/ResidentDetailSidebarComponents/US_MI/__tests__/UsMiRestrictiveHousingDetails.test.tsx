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

import { render } from "@testing-library/react";

import {
  type UsMiBondableOffense,
  type UsMiNonbondableOffense,
  type UsMiSegregationStay,
} from "~datatypes";

import {
  MisconductHistory,
  SegregationHistory,
} from "../UsMiRestrictiveHousingDetails";

describe("UsMiRestrictiveHousingDetails helper functions", () => {
  describe("SegregationHistory", () => {
    it("returns N/A for empty array", () => {
      const { container } = render(<SegregationHistory stays={[]} />);
      expect(container.textContent).toBe("N/A");
    });

    it("formats single segregation stay with dates and offense codes", () => {
      const stays: UsMiSegregationStay[] = [
        {
          stayStartDate: new Date("2023-01-01"),
          stayEndDate: new Date("2023-03-01"),
          stayOffenses: "014",
        },
      ];
      const { container } = render(<SegregationHistory stays={stays} />);
      expect(container).toMatchSnapshot();
    });

    it("formats multiple segregation stays", () => {
      const stays: UsMiSegregationStay[] = [
        {
          stayStartDate: new Date("2023-01-01"),
          stayEndDate: new Date("2023-03-01"),
          stayOffenses: "014",
        },
        {
          stayStartDate: new Date("2023-06-01"),
          stayEndDate: new Date("2023-08-01"),
          stayOffenses: "030,003",
        },
      ];
      const { container } = render(<SegregationHistory stays={stays} />);
      expect(container).toMatchSnapshot();
    });

    it("handles stays with empty offense codes", () => {
      const stays: UsMiSegregationStay[] = [
        {
          stayStartDate: new Date("2023-01-01"),
          stayEndDate: new Date("2023-03-01"),
          stayOffenses: "",
        },
      ];
      const { container } = render(<SegregationHistory stays={stays} />);
      expect(container).toMatchSnapshot();
    });

    it("removes trailing commas from offense codes", () => {
      const stays = [
        {
          stayStartDate: new Date("2023-01-01"),
          stayEndDate: new Date("2023-03-01"),
          stayOffenses: "014,030,",
        },
      ];
      const { container } = render(<SegregationHistory stays={stays} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("MisconductHistory", () => {
    it("returns N/A when both arrays are empty", () => {
      const { container } = render(
        <MisconductHistory bondableOffenses={[]} nonbondableOffenses={[]} />,
      );
      expect(container.textContent).toBe("N/A");
    });

    it("renders bondable offenses only", () => {
      const bondableOffenses: UsMiBondableOffense[] = [
        {
          bondableOffense: "423",
          bondableIncidentDate: new Date("2023-12-27"),
        },
      ];
      const { container } = render(
        <MisconductHistory
          bondableOffenses={bondableOffenses}
          nonbondableOffenses={[]}
        />,
      );
      expect(container.textContent).toBe("Dec 27, 2023• Code: 423");
    });

    it("renders nonbondable offenses only", () => {
      const nonbondableOffenses: UsMiNonbondableOffense[] = [
        {
          nonbondableOffense: "008",
          nonbondableIncidentDate: new Date("2023-05-31"),
        },
      ];
      const { container } = render(
        <MisconductHistory
          bondableOffenses={[]}
          nonbondableOffenses={nonbondableOffenses}
        />,
      );
      expect(container.textContent).toBe("May 31, 2023• Code: 008");
    });

    it("sorts offenses by date (oldest first)", () => {
      const bondableOffenses: UsMiBondableOffense[] = [
        {
          bondableOffense: "423",
          bondableIncidentDate: new Date("2023-12-27"),
        },
        {
          bondableOffense: "057",
          bondableIncidentDate: new Date("2023-12-05"),
        },
      ];
      const nonbondableOffenses: UsMiNonbondableOffense[] = [
        {
          nonbondableOffense: "008",
          nonbondableIncidentDate: new Date("2024-01-15"),
        },
      ];

      const { container } = render(
        <MisconductHistory
          bondableOffenses={bondableOffenses}
          nonbondableOffenses={nonbondableOffenses}
        />,
      );

      expect(container.textContent).toBe(
        "Dec 5, 2023• Code: 057Dec 27, 2023• Code: 423Jan 15, 2024• Code: 008",
      );
    });

    it("groups multiple offenses on the same date", () => {
      const bondableOffenses: UsMiBondableOffense[] = [
        {
          bondableOffense: "423",
          bondableIncidentDate: new Date("2023-12-05"),
        },
        {
          bondableOffense: "057",
          bondableIncidentDate: new Date("2023-12-05"),
        },
      ];

      const { container } = render(
        <MisconductHistory
          bondableOffenses={bondableOffenses}
          nonbondableOffenses={[]}
        />,
      );

      expect(container.textContent).toBe("Dec 5, 2023• Code: 423, 057");
    });
  });
});
