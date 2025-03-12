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

import { supervisionOfficerFixture } from "../..";
import { supervisionOfficerSupervisorsFixture } from "../../people/Staff/Supervision/Insights/SupervisionOfficerSupervisor/fixture";
import {
  rawRosterChangeRequestFixtures,
  rawRosterChangeRequestResponseFixture,
} from "./fixture";
import {
  rosterChangeRequestResponseSchema,
  rosterChangeRequestSchema,
} from "./schema";

test("rosterChangeRequest schema transformations", () => {
  Object.values(rawRosterChangeRequestFixtures).forEach((request) => {
    expect(rosterChangeRequestSchema.parse(request)).toMatchSnapshot();
  });
});

test("rosterChangeRequest schema error transformations", () => {
  [
    {
      // Empty note
      affectedOfficersExternalIds: supervisionOfficerFixture.map(
        (o) => o.externalId,
      ),
      requestChangeType: "REMOVE",
      requestNote: "",
      requesterName: supervisionOfficerSupervisorsFixture[3].displayName,
    },
    {
      // Not enough officers selected
      affectedOfficersExternalIds: [],
      requestChangeType: "REMOVE",
      requestNote:
        "Due to recent operational changes and workload rebalancing, these officers need to be reassigned.\n\n" +
        "We appreciate the quick processing of this request and will coordinate as needed to ensure a smooth transition.\n" +
        "Let us know if you have any questions.",
      requesterName: supervisionOfficerSupervisorsFixture[2].displayName,
    },
    {
      // Bad name entry
      affectedOfficersExternalIds: supervisionOfficerFixture
        .slice(5, 7)
        .map((o) => o.externalId),
      requestChangeType: "REMOVE",
      requesterName:
        "Due to recent operational changes and workload rebalancing, these officers need to be reassigned.\n\n" +
        "We appreciate the quick processing of this request and will coordinate as needed to ensure a smooth transition.\n" +
        "Let us know if you have any questions.",
    },
  ].forEach((request) => {
    expect(() =>
      rosterChangeRequestSchema.parse(request),
    ).toThrowErrorMatchingSnapshot();
  });
});

test("rosterChangeRequestResponse schema transformation", () => {
  expect(
    rosterChangeRequestResponseSchema.parse(
      rawRosterChangeRequestResponseFixture,
    ),
  ).toMatchSnapshot();
});
