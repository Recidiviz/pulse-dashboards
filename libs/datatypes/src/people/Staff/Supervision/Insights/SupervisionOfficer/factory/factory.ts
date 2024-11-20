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
import { each, makeFactory } from "factory.ts";
import { difference, pick } from "lodash";

import { FIXTURE_SEED_DEFAULT } from "~fixture-generator";

import { fullNameFactory } from "../../../../../utils/factories";
import { SupervisionOfficerSupervisor } from "../../SupervisionOfficerSupervisor/schema";
import { RawSupervisionOfficer } from "../schema";
import {
  randDistrictAndSupervisors,
  randRawSupervisionOfficerMetricFixture,
  RawSupervisionOfficerMetricAndIdInfo,
  SUPERVISION_OFFICER_METRIC_PROPERTIES,
} from "./factories";

const { person, helpers } = faker;

faker.seed(FIXTURE_SEED_DEFAULT);

// NOTE: TenantIds do not exist in the datatypes.
export const rawSupervisionOfficerFactory = (
  s: SupervisionOfficerSupervisor[],
  stateCode = "US_XX",
) =>
  makeFactory<RawSupervisionOfficer>(() => {
    const { supervisors } = randDistrictAndSupervisors(helpers.shuffle(s));

    const hasOutliers = supervisors.some((s) => s.hasOutliers);
    const metricInfo: RawSupervisionOfficerMetricAndIdInfo =
      randRawSupervisionOfficerMetricFixture(hasOutliers, stateCode);

    return {
      fullName: each(() => fullNameFactory(person.sexType()).build()),
      supervisorExternalIds: [...supervisors.map((s) => s.externalId)],
      ...metricInfo,
    };
  });

export const rawExcludedSupervisionOfficerFactory = (
  s: SupervisionOfficerSupervisor[],
  stateCode = "US_XX",
) =>
  makeFactory(() => {
    const officer = rawSupervisionOfficerFactory(s, stateCode).build();
    return pick(
      officer,
      difference(Object.keys(officer), SUPERVISION_OFFICER_METRIC_PROPERTIES),
    );
  });
