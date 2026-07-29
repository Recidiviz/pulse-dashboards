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

import { addDays, format } from "date-fns";

import { ParoleHearing, paroleHearingSchema } from "./schema";

// US_CO has no Parole backend yet (TODO(OBT-41775): replace this fixture with real
// data once one exists). This is the same fixture data used in the Parole
// POC (pulse-dashboards#14777) so it's easier to cross-test against that
// reference. It's generated relative to whenever the module is loaded (rather
// than anchored to a fixed historical date) so that "upcoming hearings"
// always look current in a demo, regardless of when `nx offline staff` is run.
const iso = (date: Date): string => format(date, "yyyy-MM-dd");

const RAW_HEARINGS: Array<
  Omit<ParoleHearing, "hearingDate"> & { daysFromNow: number }
> = [
  {
    docId: "DOC-45821",
    individualName: "Anderson, Michael",
    hearingType: "Parole Grant Hearing",
    facility: "Central State Correctional Facility",
    daysFromNow: 5,
  },
  {
    docId: "DOC-52903",
    individualName: "Brooks, Sarah",
    hearingType: "Parole Grant Hearing",
    facility: "North River Correctional Center",
    daysFromNow: 8,
  },
  {
    docId: "DOC-61247",
    individualName: "Chen, David",
    hearingType: "Revocation Hearing",
    facility: "Western State Prison",
    daysFromNow: 12,
  },
  {
    docId: "DOC-48392",
    individualName: "Davis, Jennifer",
    hearingType: "Parole Grant Hearing",
    facility: "Central State Correctional Facility",
    daysFromNow: 15,
  },
  {
    docId: "DOC-71458",
    individualName: "Evans, Robert",
    hearingType: "Parole Grant Hearing",
    facility: "South Bay Detention Center",
    daysFromNow: 19,
  },
  {
    docId: "DOC-55729",
    individualName: "Foster, Maria",
    hearingType: "Parole Grant Hearing",
    facility: "North River Correctional Center",
    daysFromNow: 23,
  },
  {
    docId: "DOC-63184",
    individualName: "Garcia, Carlos",
    hearingType: "Parole Grant Hearing",
    facility: "Western State Prison",
    daysFromNow: 26,
  },
  {
    docId: "DOC-59402",
    individualName: "Harris, Patricia",
    hearingType: "Modification Hearing",
    facility: "Central State Correctional Facility",
    daysFromNow: 30,
  },
];

export const paroleHearingsFixture: Array<ParoleHearing> = RAW_HEARINGS.map(
  ({ daysFromNow, ...hearing }) =>
    paroleHearingSchema.parse({
      ...hearing,
      hearingDate: iso(addDays(new Date(), daysFromNow)),
    }),
);
