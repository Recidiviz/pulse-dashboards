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

import { addDays, format, subYears } from "date-fns";

import {
  ParoleCase,
  paroleCaseSchema,
  ParoleHearing,
  paroleHearingSchema,
} from "./schema";

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

// US_CO has no Parole backend yet (TODO(OBT-41775): replace this fixture with
// real data once one exists). Case-profile detail for each individual on the
// docket above, keyed by docId. Anderson's case is hand-authored to match the
// OBT-41624 design mock 1:1; the rest are generically derived from their
// docket row so every docket link resolves to a valid profile. Harris (below)
// has no hearing scheduled on her case profile -- despite appearing on the
// docket -- so the profile page's "not scheduled" / no-badge states have
// fixture coverage.
const HEARING_TIME_BY_DOC_ID: Record<string, string> = {
  "DOC-52903": "10:30 AM",
  "DOC-61247": "1:00 PM",
  "DOC-48392": "9:30 AM",
  "DOC-71458": "11:00 AM",
  "DOC-55729": "2:00 PM",
  "DOC-63184": "10:00 AM",
};

const NO_HEARING_SCHEDULED_DOC_ID = "DOC-59402";

const GENERIC_CASE_MANAGER_NAMES = [
  "David Thompson",
  "Robert Johnson",
  "Maria Gonzalez",
  "Kevin Park",
  "Angela Wright",
  "Brian Lee",
  "Nicole Adams",
];

const CUSTODY_LEVELS = ["Minimum", "Medium", "Maximum"] as const;

function buildAndersonCaseProfile(hearingDate: string): ParoleCase {
  const today = new Date();
  return paroleCaseSchema.parse({
    docId: "DOC-45821",
    name: "Anderson, Michael",
    dob: iso(subYears(today, 40)),
    currentFacility: "Central State Correctional Facility",
    custodyLevel: "Minimum",
    caseManagerName: "Jennifer Martinez",
    hearingDate,
    hearingTime: "9:00 AM",
    sentenceStartDate: iso(subYears(today, 4)),
    paroleEligibilityDate: iso(addDays(today, 20)),
    mandatoryReleaseDate: iso(addDays(today, 700)),
  });
}

function buildGenericCaseProfile(
  hearing: ParoleHearing,
  index: number,
): ParoleCase {
  const today = new Date();
  const hasScheduledHearing = hearing.docId !== NO_HEARING_SCHEDULED_DOC_ID;
  return paroleCaseSchema.parse({
    docId: hearing.docId,
    name: hearing.individualName,
    dob: iso(subYears(today, 30 + index)),
    currentFacility: hearing.facility,
    custodyLevel: CUSTODY_LEVELS[index % CUSTODY_LEVELS.length],
    caseManagerName:
      GENERIC_CASE_MANAGER_NAMES[index % GENERIC_CASE_MANAGER_NAMES.length],
    hearingDate: hasScheduledHearing ? hearing.hearingDate : undefined,
    hearingTime: hasScheduledHearing
      ? HEARING_TIME_BY_DOC_ID[hearing.docId]
      : undefined,
    sentenceStartDate: iso(subYears(today, 3 + (index % 4))),
    paroleEligibilityDate: iso(addDays(today, 10 + index * 5)),
    mandatoryReleaseDate: iso(addDays(today, 600 + index * 30)),
  });
}

export const paroleCasesFixture: Record<string, ParoleCase> =
  Object.fromEntries(
    paroleHearingsFixture.map((hearing, index) => [
      hearing.docId,
      hearing.docId === "DOC-45821"
        ? buildAndersonCaseProfile(hearing.hearingDate)
        : buildGenericCaseProfile(hearing, index),
    ]),
  );
