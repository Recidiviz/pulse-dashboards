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

import {
  excludedSupervisionOfficerSchema,
  RawExcludedSupervisionOfficer,
} from "../SupervisionOfficer";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

export const rawExcludedSupervisionOfficerFixture: RawExcludedSupervisionOfficer[] =
  [
    {
      externalId: "so6",
      pseudonymizedId: "hashed-so6",
      fullName: {
        givenNames: "John",
        surname: "Harris",
      },
      district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
      supervisorExternalIds: [
        supervisionOfficerSupervisorsFixture[0].externalId,
      ],
    },
    {
      externalId: "so7",
      pseudonymizedId: "hashed-so7",
      fullName: {
        givenNames: "Larry",
        surname: "Hernandez",
      },
      district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
      supervisorExternalIds: [
        supervisionOfficerSupervisorsFixture[0].externalId,
      ],
    },
  ];

export const excludedSupervisionOfficerFixture =
  rawExcludedSupervisionOfficerFixture.map((officer) =>
    excludedSupervisionOfficerSchema.parse(officer),
  );
