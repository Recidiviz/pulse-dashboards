// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { ClientEvent, clientEventSchema, RawClientEvent } from "../ClientEvent";

export const rawClientEventFixture: Array<RawClientEvent> = [
  {
    metricId: "violations",
    eventDate: "2023-07-22",
    attributes: {
      code: "149",
      description: "NOT ASSOCIATE WITH ANYONE YOU KNOW TO HAVE A FELONY RECORD",
    },
  },
  {
    metricId: "violation_responses",
    eventDate: "2023-05-12",
    attributes: {
      description: "PAROLE REINSTATED",
    },
  },
  {
    metricId: "violations",
    eventDate: "2023-05-01",
    attributes: {
      code: "148",
      description:
        "COMPLY WITH ALCOHOL AND DRUG TESTING ORDERED BY FIELD AGENT",
    },
  },
];

export const clientEventFixture: Array<ClientEvent> = rawClientEventFixture.map(
  (e) => clientEventSchema.parse(e)
);
