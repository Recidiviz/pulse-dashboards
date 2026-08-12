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

import { CaseNoteSummarySegment } from "../model/types";
import { getHousingSegments } from "./getHousingSegments";

const warn = jest.fn();

beforeEach(() => warn.mockClear());

const field = (fieldValue: string) => ({
  fieldValue,
  quotes: [`quote for ${fieldValue}`],
  lastVerifiedDate: "2026-07-14",
});

/** Fixtures are partial by design; the cast keeps each case to just the relevant fields. */
const build = (fields: unknown) => fields as PrismaJson.CNIHousingFields;

const render = (segments: CaseNoteSummarySegment[] | null) =>
  segments?.map(({ content }) => content).join("");

describe("getHousingSegments", () => {
  it("renders in custody (2a)", () => {
    const result = getHousingSegments(
      build({ primaryStatus: field("in_custody") }),
      warn,
    );
    expect(render(result)).toBe("is currently in custody");
  });

  describe("unhoused (2b)", () => {
    it("renders the bare sentence with no location", () => {
      const result = getHousingSegments(
        build({ primaryStatus: field("unhoused") }),
        warn,
      );
      expect(render(result)).toBe("is currently unhoused");
    });

    it.each([
      ["vehicle", "is currently unhoused, living in a vehicle"],
      ["encampment", "is currently unhoused, in an encampment"],
      ["street", "is currently unhoused, on the street"],
      ["abandoned_building", "is currently unhoused, in an abandoned building"],
    ])("maps unhousedLocation=%s", (unhousedLocation, expected) => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("unhoused"),
          unhousedLocation: field(unhousedLocation),
        }),
        warn,
      );
      expect(render(result)).toBe(expected);
    });
  });

  describe("housed (2c)", () => {
    it.each([
      ["renting", "is housed in a residence that they rent"],
      ["own", "is housed in a residence that they own"],
      ["dependent", "is housed and dependent on others for housing"],
      ["temporary_housing", "is housed in temporary housing"],
    ])("maps housedType=%s", (housedType, expected) => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field(housedType),
        }),
        warn,
      );
      expect(render(result)).toBe(expected);
    });

    it("appends an address", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("renting"),
          address: field("123 Main St, Denver, CO 80202"),
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is housed in a residence that they rent at 123 Main St, Denver, CO 80202",
      );
    });

    it.each([
      ["with_family", "staying with family"],
      ["with_partner", "staying with a partner"],
      ["with_friend", "staying with a friend"],
    ])("maps dependentHousingType=%s", (dependentHousingType, fragment) => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("dependent"),
          dependentHousingType: field(dependentHousingType),
        }),
        warn,
      );
      expect(render(result)).toBe(
        `is housed and dependent on others for housing, ${fragment}`,
      );
    });

    it.each([
      ["sober_living", "is housed in sober living"],
      ["treatment_program", "is housed in a treatment program"],
      ["transitional_program", "is housed in a transitional program"],
      ["shelter", "is housed at a shelter"],
      ["hotel_motel", "is housed in a hotel/motel"],
    ])(
      "drops the redundant `in temporary housing` for temporaryHousingType=%s",
      (temporaryHousingType, expected) => {
        const result = getHousingSegments(
          build({
            primaryStatus: field("housed"),
            housedType: field("temporary_housing"),
            temporaryHousingType: field(temporaryHousingType),
          }),
          warn,
        );
        expect(render(result)).toBe(expected);
      },
    );

    it("keeps `in temporary housing` when the subtype is unrecognized", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("temporary_housing"),
          temporaryHousingType: field("rv_park"),
        }),
        warn,
      );

      expect(render(result)).toBe("is housed in temporary housing");
      expect(warn).toHaveBeenCalledWith(
        'no template fragment for temporaryHousingType="rv_park"',
      );
    });

    it("names the program instead of the generic temporary-housing phrase", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("temporary_housing"),
          temporaryHousingName: field("Stride Sober Living"),
        }),
        warn,
      );
      expect(render(result)).toBe("is housed at Stride Sober Living");
    });

    it("combines a program name with a dependent type", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("temporary_housing"),
          temporaryHousingName: field("Hope Homes"),
          dependentHousingType: field("with_family"),
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is housed at Hope Homes, staying with family",
      );
    });

    it("combines a program name with an address", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("temporary_housing"),
          temporaryHousingName: field("La Puente Homeless Shelter"),
          address: field("128 W 6th St, La Junta, CO 81050"),
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is housed at La Puente Homeless Shelter at 128 W 6th St, La Junta, CO 81050",
      );
    });
  });

  it("attaches each field's quotes to its own segment", () => {
    const result = getHousingSegments(
      build({
        primaryStatus: field("housed"),
        housedType: field("dependent"),
        address: field("123 Jackson St"),
      }),
      warn,
    );

    expect(result).toEqual([
      {
        content: "is housed",
        citation: {
          quotes: ["quote for housed"],
          lastVerifiedDate: new Date(2026, 6, 14),
        },
      },
      {
        content: " and dependent on others for housing",
        citation: {
          quotes: ["quote for dependent"],
          lastVerifiedDate: new Date(2026, 6, 14),
        },
      },
      {
        content: " at 123 Jackson St",
        citation: {
          quotes: ["quote for 123 Jackson St"],
          lastVerifiedDate: new Date(2026, 6, 14),
        },
      },
    ]);
  });

  describe("missing fields", () => {
    it.each([
      ["an empty object", {}],
      ["a blank fieldValue", { primaryStatus: { fieldValue: "  " } }],
      ["an unrecognized status", { primaryStatus: { fieldValue: "evicted" } }],
    ])("returns null for %s", (_label, cniFields) => {
      expect(getHousingSegments(build(cniFields), warn)).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    it("renders the bare sentence when only primaryStatus is present", () => {
      const result = getHousingSegments(
        build({ primaryStatus: field("housed") }),
        warn,
      );
      expect(render(result)).toBe("is housed");
    });

    it("renders an address without a housedType", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          address: field("123 Jackson St"),
        }),
        warn,
      );
      expect(render(result)).toBe("is housed at 123 Jackson St");
    });

    it.each(["constructor", "toString", "__proto__"])(
      "treats the inherited Object property %s as an unknown housedType",
      (housedType) => {
        const result = getHousingSegments(
          build({
            primaryStatus: field("housed"),
            housedType: field(housedType),
            address: field("123 Jackson St"),
          }),
          warn,
        );

        expect(render(result)).toBe("is housed at 123 Jackson St");
        expect(warn).toHaveBeenCalledWith(
          `no template fragment for housedType="${housedType}"`,
        );
      },
    );

    it("omits an unknown housedType but keeps the rest of the sentence", () => {
      const result = getHousingSegments(
        build({
          primaryStatus: field("housed"),
          housedType: field("houseboat"),
          address: field("Slip 12"),
        }),
        warn,
      );

      expect(render(result)).toBe("is housed at Slip 12");
      expect(warn).toHaveBeenCalledWith(
        'no template fragment for housedType="houseboat"',
      );
    });
  });
});
