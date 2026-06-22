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
  rawUsArResidents,
  rawUsAzResidents,
  rawUsCoResidents,
  rawUsIdResidents,
  rawUsMaResidents,
  rawUsNcResidents,
  rawUsNdResidents,
  rawUsNeResidents,
  rawUsTnResidents,
  RawWorkflowsResidentRecord,
} from "~datatypes";

import { usMeResidents } from "./residents/usMeResidents";
import { usMiResidents } from "./residents/usMiResidents";
import { usMoResidents } from "./residents/usMoResidents";
import { usUtResidents } from "./residents/usUtResidents";
import { FirestoreFixture, PersonFixture } from "./utils";

export type ResidentFixture = PersonFixture<RawWorkflowsResidentRecord>;

// RawWorkflowsResidentRecords is a superset of ResidentFixture
const data: Array<ResidentFixture | RawWorkflowsResidentRecord> = [
  ...rawUsAzResidents,
  ...rawUsArResidents,
  ...rawUsCoResidents,
  ...rawUsIdResidents,
  ...rawUsMaResidents,
  ...usMeResidents,
  ...usMiResidents,
  ...usMoResidents,
  ...rawUsNdResidents,
  ...rawUsNcResidents,
  ...rawUsNeResidents,
  ...rawUsTnResidents,
  ...usUtResidents,
];

export const residentsData: FirestoreFixture<
  ResidentFixture | RawWorkflowsResidentRecord
> = {
  data,
  idFunc: (r) => r.personExternalId,
};
