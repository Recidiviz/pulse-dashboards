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

import { subYears } from "date-fns";

import { LATEST_END_DATE } from "../offlineFixtures/constants";
import { OutliersConfigFixture } from "../offlineFixtures/OutliersConfigFixture";
import {
  rawSupervisionOfficerMetricEventFixture,
  supervisionOfficerMetricEventFixture,
} from "../offlineFixtures/SupervisionOfficerMetricEventFixture";
import { supervisionOfficerMetricEventSchema } from "../SupervisionOfficerMetricEvent";

test("transformations", () => {
  rawSupervisionOfficerMetricEventFixture.forEach((b) =>
    expect(supervisionOfficerMetricEventSchema.parse(b)).toMatchSnapshot()
  );
});

test("all metrics should have events", () => {
  OutliersConfigFixture.metrics
    .map((m) => m.name)
    .forEach((metricId) => {
      expect(
        supervisionOfficerMetricEventFixture.filter(
          (e) => e.metricId === metricId
        ).length
      ).toBePositive();
    });
});

test("event dates should correspond to latest metric period", () => {
  const eventPeriodEnd = LATEST_END_DATE;
  const eventPeriodStart = subYears(LATEST_END_DATE, 1);
  supervisionOfficerMetricEventFixture.forEach(({ eventDate }) => {
    expect(eventDate).toBeAfterOrEqualTo(eventPeriodStart);
    expect(eventDate).toBeBefore(eventPeriodEnd);
  });
});
