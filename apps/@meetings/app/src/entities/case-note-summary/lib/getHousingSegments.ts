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

import { compact } from "lodash";

import { CaseNoteSummarySegment } from "../model/types";
import {
  citedFragment,
  citedValue,
  CniWarn,
  usableField,
} from "./segmentBuilders";

const TEMPORARY_HOUSING = "temporary_housing";

const HOUSED_TYPE_FRAGMENTS = {
  renting: "in a residence that they rent",
  own: "in a residence that they own",
  dependent: "and dependent on others for housing",
  [TEMPORARY_HOUSING]: "in temporary housing",
};

const TEMPORARY_HOUSING_TYPE_FRAGMENTS = {
  sober_living: "in sober living",
  treatment_program: "in a treatment program",
  transitional_program: "in a transitional program",
  shelter: "at a shelter",
  hotel_motel: "in a hotel/motel",
};

const DEPENDENT_HOUSING_TYPE_FRAGMENTS = {
  with_family: "staying with family",
  with_partner: "staying with a partner",
  with_friend: "staying with a friend",
};

const UNHOUSED_LOCATION_FRAGMENTS = {
  vehicle: "living in a vehicle",
  encampment: "in an encampment",
  street: "on the street",
  abandoned_building: "in an abandoned building",
};

function getHousedSegments(
  cniFields: PrismaJson.CNIHousingFields,
  primaryStatus: PrismaJson.CNIField,
  warn: CniWarn,
): CaseNoteSummarySegment[] {
  const {
    housedType,
    temporaryHousingName,
    temporaryHousingType,
    dependentHousingType,
    address,
  } = cniFields;

  const temporaryHousingTypeSegment = citedFragment(
    temporaryHousingType,
    TEMPORARY_HOUSING_TYPE_FRAGMENTS,
    { fieldKey: "temporaryHousingType", warn },
  );

  // "in temporary housing" is redundant once we can name the program or its type,
  // "is housed in sober living" rather than "is housed in temporary housing in sober living".
  const hasTemporaryDetail =
    !!usableField(temporaryHousingName) || !!temporaryHousingTypeSegment;
  const skipHousedType =
    housedType?.fieldValue === TEMPORARY_HOUSING && hasTemporaryDetail;

  return compact([
    citedValue(primaryStatus, () => "is housed"),
    skipHousedType
      ? undefined
      : citedFragment(housedType, HOUSED_TYPE_FRAGMENTS, {
          fieldKey: "housedType",
          warn,
        }),
    citedValue(temporaryHousingName, (value) => ` at ${value}`),
    temporaryHousingTypeSegment,
    citedFragment(
      dependentHousingType,
      DEPENDENT_HOUSING_TYPE_FRAGMENTS,
      { fieldKey: "dependentHousingType", warn },
      (fragment) => `, ${fragment}`,
    ),
    citedValue(address, (value) => ` at ${value}`),
  ]);
}

export function getHousingSegments(
  cniFields: PrismaJson.CNIHousingFields,
  warn: CniWarn,
): CaseNoteSummarySegment[] | null {
  const primaryStatus = usableField(cniFields.primaryStatus);

  if (!primaryStatus) {
    warn("housing summary has no primaryStatus");
    return null;
  }

  switch (primaryStatus.fieldValue) {
    case "in_custody":
      return compact([
        citedValue(primaryStatus, () => "is currently in custody"),
      ]);

    case "unhoused":
      return compact([
        citedValue(primaryStatus, () => "is currently unhoused"),
        citedFragment(
          cniFields.unhousedLocation,
          UNHOUSED_LOCATION_FRAGMENTS,
          { fieldKey: "unhousedLocation", warn },
          (fragment) => `, ${fragment}`,
        ),
      ]);

    case "housed":
      return getHousedSegments(cniFields, primaryStatus, warn);

    default:
      warn(`unrecognized housing primaryStatus="${primaryStatus.fieldValue}"`);
      return null;
  }
}
