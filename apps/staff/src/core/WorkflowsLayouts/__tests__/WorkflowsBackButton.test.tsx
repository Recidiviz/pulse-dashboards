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

import { parentOf } from "../WorkflowsBackButton";

describe("parentOf", () => {
  it("returns opportunity clients page for opportunity action pages", () => {
    expect(parentOf(["someOpportunity", "personId", "opportunityId"])).toEqual(
      "/workflows/someOpportunity",
    );
  });

  it("returns /tasks for route planner", () => {
    expect(parentOf(["tasks", "route-planner"])).toEqual("/workflows/tasks");
  });

  it("returns /clients and /residents for client/resident profile", () => {
    expect(parentOf(["clients", "personId"])).toEqual("/workflows/clients");
    expect(parentOf(["residents", "personId"])).toEqual("/workflows/residents");
  });
});
