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

import {
  ResidentRecord,
  UsNdResidentMetadata,
  usNdResidents,
} from "~datatypes";

import { ResidentHomepagePresenter } from "./ResidentHomepagePresenter";

describe("sentence dates", () => {
  test("with data present", () => {
    expect(
      new ResidentHomepagePresenter(
        usNdResidents[1].metadata as UsNdResidentMetadata,
        {} as ResidentRecord,
      ).sentenceDatesData,
    ).toMatchInlineSnapshot(`
      {
        "dates": [
          {
            "date": 2022-02-16T00:00:00.000Z,
            "id": "initialReview",
          },
          {
            "date": 2022-04-16T00:00:00.000Z,
            "id": "paroleReview",
          },
          {
            "date": 2022-07-16T00:00:00.000Z,
            "id": "goodTime",
          },
          {
            "date": 2022-05-30T00:00:00.000Z,
            "id": "eightyFivePercent",
          },
          {
            "date": 2022-10-16T00:00:00.000Z,
            "id": "finalSentExp",
          },
        ],
      }
    `);
  });

  test("with data missing", () => {
    expect(
      new ResidentHomepagePresenter(
        usNdResidents[0].metadata as UsNdResidentMetadata,
        {} as ResidentRecord,
      ).sentenceDatesData,
    ).toMatchInlineSnapshot(`
      {
        "dates": [
          {
            "date": undefined,
            "id": "initialReview",
          },
          {
            "date": undefined,
            "id": "paroleReview",
          },
          {
            "date": undefined,
            "id": "goodTime",
          },
          {
            "date": undefined,
            "id": "eightyFivePercent",
          },
          {
            "date": undefined,
            "id": "finalSentExp",
          },
        ],
      }
    `);
  });
});
