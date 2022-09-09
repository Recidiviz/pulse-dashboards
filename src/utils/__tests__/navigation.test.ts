// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
  convertSlugToId,
  convertToSlug,
  getPathsFromNavigation,
  getPathWithoutParams,
} from "../navigation";

describe("getPathsFromNavigation", () => {
  it("returns the correct allowed paths paths", () => {
    const navigation = {
      goals: [],
      community: ["explore", "practices"],
      methodology: ["practices"],
      facilities: ["explore"],
    };
    const allowedPaths = getPathsFromNavigation(navigation);
    const expected = [
      "/goals",
      "/community/explore",
      "/community/practices",
      "/community",
      "/methodology/practices",
      "/methodology",
      "/facilities/explore",
      "/facilities",
    ];
    expect(allowedPaths).toEqual(expected);
  });
});

describe("getPathWithoutParams", () => {
  it("returns the full path when given a path without params", () => {
    const path = "/community/practices";
    expect(getPathWithoutParams(path)).toEqual(path);
  });

  it("returns the path without params when given a path with params", () => {
    const basePath = "/community/practices";
    expect(getPathWithoutParams(`${basePath}/office-a`)).toEqual(basePath);
  });

  it("returns the path without params when given a path with params", () => {
    const basePath = "/operations";
    expect(getPathWithoutParams(`${basePath}/office-a`)).toEqual(basePath);
  });

  it("returns the path without params when given a path with params", () => {
    const basePath = "/system/prison";
    expect(getPathWithoutParams(`${basePath}/anythingElse`)).toEqual(basePath);
  });
});

describe("convertToSlug", () => {
  it("returns the id with dashes instead of underscore and lower case", () => {
    const id = "123_OFFICER_JONES";
    expect(convertToSlug(id)).toEqual("123-officer-jones");
  });

  it("returns a slug for text", () => {
    expect(convertToSlug("Over-Time Calculations: ")).toEqual(
      "over-time-calculations"
    );
  });
});

describe("convertSlugToId", () => {
  it("returns the id with underscores instead of dashes and upper case", () => {
    const id = "123-officer-jones";
    expect(convertSlugToId(id)).toEqual("123_OFFICER_JONES");
  });
});
