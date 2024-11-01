// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { outputFixture, usMeResidents } from "~datatypes";

import { residentsConfigByState } from "../../../configs/residentsConfig";
import { ResidentMiniProfilePresenter } from "./ResidentMiniProfilePresenter";

const config = residentsConfigByState.US_ME;

test("profile fields 2/3", () => {
  expect(
    new ResidentMiniProfilePresenter(outputFixture(usMeResidents[0]), config)
      .profileFields,
  ).toMatchInlineSnapshot(`
    [
      {
        "label": "Current release date",
        "moreInfo": "## How is my Current Release Date calculated?

    Your Current Release Date is calculated by taking the amount of time you were sentenced to the DOC, minus the amount of good time you have earned so far and any county jail time credit you’ve been given. **It does not factor in any good time you will earn after today, so if you keep earning good time, your Current Release Date will move earlier.**

    For example, let’s say you were sentenced to 10 years, and you spent 1 year in jail before entering a DOC facility, and have earned 1 year of good time so far. If you entered the DOC facility on 1/1/2020, your Current Release Date would be 1/1/2028 (10 years minus 2 years of jail credit and good time).
    ",
        "value": "November 16, 2024",
      },
    ]
  `);
});

test("profile fields 1/2", () => {
  expect(
    new ResidentMiniProfilePresenter(outputFixture(usMeResidents[2]), config)
      .profileFields,
  ).toMatchInlineSnapshot(`
    [
      {
        "label": "Current release date",
        "moreInfo": "## How is my Current Release Date calculated?

    Your Current Release Date is calculated by taking the amount of time you were sentenced to the DOC, minus the amount of good time you have earned so far and any county jail time credit you’ve been given. **It does not factor in any good time you will earn after today, so if you keep earning good time, your Current Release Date will move earlier.**

    For example, let’s say you were sentenced to 10 years, and you spent 1 year in jail before entering a DOC facility, and have earned 1 year of good time so far. If you entered the DOC facility on 1/1/2020, your Current Release Date would be 1/1/2028 (10 years minus 2 years of jail credit and good time).
    ",
        "value": "December 16, 2023",
      },
    ]
  `);
});
