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
import { Navigation, RoutePermission } from "../../core/types/navigation";
import {
  convertSlugToId,
  convertToSlug,
  getAllowedNavigation,
  getPathsFromNavigation,
  getPathWithoutParams,
} from "../navigation";

jest.mock("../../flags", () => ({
  enablePracticesDashboard: true,
  enableProjectionsDashboard: true,
}));

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
      "/methodology/practices",
      "/facilities/explore",
    ];
    expect(allowedPaths).toEqual(expected);
  });
});

describe("getAllowedNavigation", () => {
  let tenantAllowedNavigation: Navigation | undefined;
  let pagesWithRestrictions: string[] | undefined;
  let routes: RoutePermission[];

  beforeEach(() => {
    tenantAllowedNavigation = {
      goals: [],
      community: ["explore", "practices", "projections"],
      methodology: ["practices", "projections"],
      facilities: ["explore"],
      practices: [],
      pathways: ["prison", "supervision"],
      prison: ["countOverTime"],
      "pathways-methodology": ["pathways", "practices"],
    };
    pagesWithRestrictions = ["practices", "prison"];
  });

  it("returns the navigation object minus pagesWithRestrictions when user routes array is empty", () => {
    routes = [];
    const expected = {
      goals: [],
      community: ["explore", "projections"],
      facilities: ["explore"],
      methodology: ["projections"],
      pathways: ["supervision"],
      prison: ["countOverTime"],
      "pathways-methodology": [],
    };
    const allowedNavigation = getAllowedNavigation(
      tenantAllowedNavigation,
      pagesWithRestrictions,
      routes
    );
    expect(allowedNavigation).toEqual(expected);
  });

  it("returns the navigation object with restricted page when user routes array includes a restricted page", () => {
    routes = [
      ["community_practices", true],
      ["community_bogus", false],
      ["pathways_prison", true],
      ["practices", true],
    ];
    const expected = {
      goals: [],
      community: ["explore", "practices", "projections"],
      facilities: ["explore"],
      methodology: ["practices", "projections"],
      practices: [],
      pathways: ["prison", "supervision"],
      prison: ["countOverTime"],
      "pathways-methodology": ["pathways", "practices"],
    };
    const allowedNavigation = getAllowedNavigation(
      tenantAllowedNavigation,
      pagesWithRestrictions,
      routes
    );
    expect(allowedNavigation).toEqual(expected);
  });

  it("returns the navigation object without the restricted view when the view permission is false", () => {
    routes = [
      ["community_practices", true],
      ["community_bogus", false],
      ["practices", false],
      ["pathways_prison", true],
    ];
    const expected = {
      goals: [],
      community: ["explore", "practices", "projections"],
      facilities: ["explore"],
      methodology: ["practices", "projections"],
      pathways: ["prison", "supervision"],
      prison: ["countOverTime"],
      "pathways-methodology": ["pathways"],
    };
    const allowedNavigation = getAllowedNavigation(
      tenantAllowedNavigation,
      pagesWithRestrictions,
      routes
    );
    expect(allowedNavigation).toEqual(expected);
  });

  it("returns the original navigation object when page not in pagesWithRestrictions is empty", () => {
    routes = [
      ["community_practices", true],
      ["community_projections", false],
      ["pathways_prison", true],
      ["practices", true],
    ];
    const allowedPaths = getAllowedNavigation(
      tenantAllowedNavigation,
      [],
      routes
    );
    expect(allowedPaths).toEqual(tenantAllowedNavigation);
  });

  it("returns the correct pathways-methodology object for practices only", () => {
    routes = [["practices", true]];
    const expected = {
      goals: [],
      community: ["explore", "projections"],
      facilities: ["explore"],
      methodology: ["projections"],
      pathways: ["supervision"],
      practices: [],
      prison: ["countOverTime"],
      "pathways-methodology": ["practices"],
    };
    const allowedPaths = getAllowedNavigation(
      tenantAllowedNavigation,
      pagesWithRestrictions,
      routes
    );
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
    const basePath = "/practices";
    expect(getPathWithoutParams(`${basePath}/office-a`)).toEqual(basePath);
  });

  it("returns the path without params when given a path with params", () => {
    const basePath = "/pathways/prison";
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
