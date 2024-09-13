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
import { groupBy, pick } from "lodash";

import { FAVORABLE_METRIC_IDS } from "../../../../../../metrics/utils/constants";
import { SupervisionOfficerSupervisor } from "../../SupervisionOfficerSupervisor/schema";
import { rawSupervisionOfficerFixture } from "../fixture";
import { RawSupervisionOfficer } from "../schema";

const { helpers } = faker;

export const SUPERVISION_OFFICER_METRIC_PROPERTIES = [
  "outlierMetrics",
  "avgDailyPopulation",
  "caseloadCategory",
  "topXPctMetrics",
] as const;

export type RawSupervisionOfficerMetricAndIdInfo = Pick<
  RawSupervisionOfficer,
  | "externalId"
  | "pseudonymizedId"
  | (typeof SUPERVISION_OFFICER_METRIC_PROPERTIES)[number]
>;

export const rawSupervisionOfficerMetricFixture: RawSupervisionOfficerMetricAndIdInfo[] =
  rawSupervisionOfficerFixture.map((o) =>
    pick(o, [
      "externalId",
      "pseudonymizedId",
      ...SUPERVISION_OFFICER_METRIC_PROPERTIES,
    ]),
  );

export const randRawSupervisionOfficerMetricFixture = (
  hasOutliers: boolean,
  stateCode: string,
) => {
  const metricsInfo = !hasOutliers
    ? rawSupervisionOfficerMetricFixture.filter((o) => !o.outlierMetrics.length)
    : rawSupervisionOfficerMetricFixture;

  const selectedMetrics =
    stateCode !== "US_CA"
      ? metricsInfo.filter(
          (o) =>
            // Non-US_CA states have no favorable treatment_starts metrics
            !o.outlierMetrics.length ||
            o.outlierMetrics.some(
              (m) => m.metricId !== FAVORABLE_METRIC_IDS.enum.treatment_starts,
            ),
        )
      : metricsInfo;
  return faker.helpers.arrayElement(selectedMetrics);
};

export const randDistrictAndSupervisors = (
  s: SupervisionOfficerSupervisor[],
) => {
  const supervisorsBySupervisionDistrict = groupBy(s, "supervisionDistrict");
  const [supervisionDistrict, districtSupervisors] = helpers.arrayElement(
    Object.entries(supervisorsBySupervisionDistrict),
  );

  return {
    supervisors: helpers.arrayElements(districtSupervisors, {
      min: 1,
      max: districtSupervisors.length,
    }),
    supervisionDistrict,
  };
};
