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

import { targetStatusSchema } from "../../../models/schemaHelpers";
import { calculateSwarm } from "../calculateSwarm";
import { InputPoint } from "../types";

// these are not actually relevant to the swarm calcs but are used for display
const DEFAULT_FILL_PROPS = {
  opacity: 1,
  targetStatus: targetStatusSchema.enum.FAR,
};

test("placement without fixed spread", () => {
  const testData: InputPoint[] = [
    { position: 2, radius: 5, ...DEFAULT_FILL_PROPS },
    { position: 4, radius: 5, ...DEFAULT_FILL_PROPS },
    { position: 16, radius: 5, ...DEFAULT_FILL_PROPS },
  ];
  expect(calculateSwarm(testData)).toMatchInlineSnapshot(`
    Object {
      "swarmPoints": Array [
        Object {
          "opacity": 1,
          "position": 2,
          "radius": 5,
          "spreadOffset": 0,
          "targetStatus": "FAR",
        },
        Object {
          "opacity": 1,
          "position": 4,
          "radius": 5,
          "spreadOffset": 9.797958971132712,
          "targetStatus": "FAR",
        },
        Object {
          "opacity": 1,
          "position": 16,
          "radius": 5,
          "spreadOffset": 0,
          "targetStatus": "FAR",
        },
      ],
      "swarmSpread": 29.595917942265423,
    }
  `);
});

test("placement fits within fixed spread", () => {
  const testData: InputPoint[] = [
    { position: 2, radius: 5, ...DEFAULT_FILL_PROPS },
    { position: 4, radius: 5, ...DEFAULT_FILL_PROPS },
    { position: 7, radius: 5, ...DEFAULT_FILL_PROPS },
  ];
  expect(calculateSwarm(testData, 100)).toMatchInlineSnapshot(`
    Object {
      "swarmPoints": Array [
        Object {
          "opacity": 1,
          "position": 2,
          "radius": 5,
          "spreadOffset": 0,
          "targetStatus": "FAR",
        },
        Object {
          "opacity": 1,
          "position": 4,
          "radius": 5,
          "spreadOffset": -9.797958971132712,
          "targetStatus": "FAR",
        },
        Object {
          "opacity": 1,
          "position": 7,
          "radius": 5,
          "spreadOffset": 8.660254037844387,
          "targetStatus": "FAR",
        },
      ],
      "swarmSpread": 100,
    }
  `);
});

test("placement constrained by fixed spread", () => {
  const testData: InputPoint[] = [
    { position: 2, radius: 5, ...DEFAULT_FILL_PROPS },
    { position: 4, radius: 5, ...DEFAULT_FILL_PROPS },
    { position: 7, radius: 5, ...DEFAULT_FILL_PROPS },
  ];
  expect(calculateSwarm(testData, 25)).toMatchInlineSnapshot(`
    Object {
      "swarmPoints": Array [
        Object {
          "opacity": 1,
          "position": 2,
          "radius": 5,
          "spreadOffset": 0,
          "targetStatus": "FAR",
        },
        Object {
          "opacity": 1,
          "position": 4,
          "radius": 5,
          "spreadOffset": 5.2020410288672885,
          "targetStatus": "FAR",
        },
        Object {
          "opacity": 1,
          "position": 7,
          "radius": 5,
          "spreadOffset": -6.339745962155611,
          "targetStatus": "FAR",
        },
      ],
      "swarmSpread": 25,
    }
  `);
});
