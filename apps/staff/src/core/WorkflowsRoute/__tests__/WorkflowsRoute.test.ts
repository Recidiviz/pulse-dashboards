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

import { WORKFLOWS_PATH_SECTIONS } from "../../views";
import { parseLocation, RouterLocation } from "../WorkflowsRoute";

describe("parseLocation", () => {
  test.each(WORKFLOWS_PATH_SECTIONS.map((s) => [s]))(
    "/workflows/%s",
    (page) => {
      const location = { pathname: `/workflows/${page}` } as RouterLocation;
      expect(parseLocation(location)).toStrictEqual({
        page,
        personId: undefined,
        opportunityPseudoId: undefined,
      });
    },
  );

  test("/workflows leads to undefined page", () => {
    const location = {
      pathname: `/workflows`,
    } as RouterLocation;
    expect(parseLocation(location)).toStrictEqual({
      page: undefined,
      personId: undefined,
      opportunityPseudoId: undefined,
    });
  });

  test("/workflows/opportunityType with person and opportunity ID", () => {
    const page = "opportunityType";
    const personId = "person123";
    const opportunityPseudoId = "opportunity456";

    const location = {
      pathname: `/workflows/${page}/${personId}/${opportunityPseudoId}`,
    } as RouterLocation;
    expect(parseLocation(location)).toStrictEqual({
      page,
      personId,
      opportunityPseudoId,
    });
  });

  test.each(["residents", "clients"])(
    "/workflows/%s with person ID",
    (page) => {
      const personId = "person123";

      const location = {
        pathname: `/workflows/${page}/${personId}`,
      } as RouterLocation;
      expect(parseLocation(location)).toStrictEqual({
        page,
        personId,
        opportunityPseudoId: undefined,
      });
    },
  );
});
