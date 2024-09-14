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

import { faker } from "@faker-js/faker";

import {
  FIXTURE_SEED_DEFAULT,
  hasDifferentValuesAtKeys,
} from "~fixture-generator";

import { clientEventSchema } from "../schema";
import { rawClientEventFactory } from "./factory";

faker.seed(FIXTURE_SEED_DEFAULT);

const TEST_DATE = "2023-01-01";
const TEST_METRIC_ID = "ALL";

describe.each(["US_MI", "US_XX"])(
  `function: ClientEventRawFactory`,
  (stateCode) => {
    beforeAll(() => {
      faker.seed(FIXTURE_SEED_DEFAULT);
    });

    it.each([
      "violation_responses",
      "treatment_referrals",
      "violations",
      TEST_METRIC_ID,
    ])(`should generate a valid client event for ${stateCode}`, (metricId) => {
      const clientEvent = rawClientEventFactory(
        TEST_DATE,
        metricId,
        stateCode,
      ).build();
      expect(() => clientEventSchema.parse(clientEvent)).not.toThrow();
    });

    it.each([
      "violation_responses",
      "treatment_referrals",
      "violations",
      TEST_METRIC_ID,
    ])(
      `should generate realistic client event entries for %s in ${stateCode}`,
      (metricId) => {
        const clientEvents = rawClientEventFactory(
          TEST_DATE,
          metricId,
          stateCode,
        ).buildList(3);
        expect(
          clientEvents.map((e) => clientEventSchema.parse(e)),
        ).toMatchSnapshot();
      },
    );

    it.each([
      "violation_responses",
      "treatment_referrals",
      "violations",
      TEST_METRIC_ID,
    ])(
      `should produce objects with variation at the values in ${stateCode}`,
      (metricId) => {
        const clientEvents = rawClientEventFactory(
          TEST_DATE,
          metricId,
          stateCode,
        ).buildList(30);
        expect(
          hasDifferentValuesAtKeys(
            clientEvents.map((e) => clientEventSchema.parse(e)),
            ["metricId", "eventDate"],
          ),
        ).toBeTrue();
      },
    );
  },
);
