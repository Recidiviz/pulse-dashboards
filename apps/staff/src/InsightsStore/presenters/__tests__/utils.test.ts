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

import {
  supervisionOfficerFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";

import { getBreadcrumbsPages } from "../utils";

const testSupervisorInfo = supervisionOfficerSupervisorsFixture[0];
const testSupervisionOfficerRecord = supervisionOfficerFixture[0];
const testLabels = { supervisionSupervisorLabel: "supervisor" };
let testCanAccessAllSupervisors = false;

describe("getBreadcrumbsPages", () => {
  it("excludes the supervisor list page when userCanAccessAllSupervisors is true", () => {
    expect(getBreadcrumbsPages(testCanAccessAllSupervisors)).toEqual([]);
  });

  it("includes supervisor list page when canAccessAllSupervisors is true", () => {
    testCanAccessAllSupervisors = true;
    expect(getBreadcrumbsPages(testCanAccessAllSupervisors)).toEqual([
      {
        title: "All Supervisors",
        url: "/insights/supervision/supervisors-list",
      },
    ]);
  });

  it("includes the supervisor page when labels and supervisor info are included", () => {
    const testPages = getBreadcrumbsPages(
      testCanAccessAllSupervisors,
      testLabels,
      testSupervisorInfo,
    );
    expect(testPages).toEqual([
      {
        title: "All Supervisors",
        url: "/insights/supervision/supervisors-list",
      },
      {
        title: "Alejandro D Gonzalez Overview",
        url: "/insights/supervision/supervisor/hashed-agonzalez123",
      },
    ]);
  });

  it("includes the officer page when officer info is included", () => {
    expect(
      getBreadcrumbsPages(
        testCanAccessAllSupervisors,
        testLabels,
        testSupervisorInfo,
        testSupervisionOfficerRecord,
      ),
    ).toEqual([
      {
        title: "All Supervisors",
        url: "/insights/supervision/supervisors-list",
      },
      {
        title: "Alejandro D Gonzalez Overview",
        url: "/insights/supervision/supervisor/hashed-agonzalez123",
      },
      {
        title: "Walter Harris Profile",
        url: "/insights/supervision/staff/hashed-so1",
      },
    ]);
  });
});
