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

import { addDays, format, subDays, subMonths, subYears } from "date-fns";

import {
  ParoleCase,
  paroleCaseSchema,
  ParoleConductRecord,
  paroleConductRecordSchema,
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
// fixture coverage. Brooks and Chen are similarly steered to cover the
// Attachments section's stale-parole-plan and no-parole-plan-on-file banners
// (see STALE_PAROLE_PLAN_DOC_ID / NO_PAROLE_PLAN_DOC_ID below), matching the
// same two individuals used for this in the Parole POC.
const HEARING_TIME_BY_DOC_ID: Record<string, string> = {
  "DOC-52903": "10:30 AM",
  "DOC-61247": "1:00 PM",
  "DOC-48392": "9:30 AM",
  "DOC-71458": "11:00 AM",
  "DOC-55729": "2:00 PM",
  "DOC-63184": "10:00 AM",
};

const NO_HEARING_SCHEDULED_DOC_ID = "DOC-59402";

// Brooks: parole plan on file, but not updated in over 90 days.
const STALE_PAROLE_PLAN_DOC_ID = "DOC-52903";
// Chen: no parole plan on file at all.
const NO_PAROLE_PLAN_DOC_ID = "DOC-61247";

const GENERIC_CASE_MANAGER_NAMES = [
  "David Thompson",
  "Robert Johnson",
  "Maria Gonzalez",
  "Kevin Park",
  "Angela Wright",
  "Brian Lee",
  "Nicole Adams",
];

const GENERIC_ATTACHMENT_AUTHORS = [
  "Family Member",
  "Employer",
  "Community Sponsor",
  "Clergy",
  "Case Worker",
];

const CUSTODY_LEVELS = ["Minimum", "Medium", "Maximum"] as const;

// Institutional conduct records, keyed by how many months before the module
// loads they occurred (see the `iso`/relative-date rationale above). Anderson
// is hand-authored to match the OBT-41634 design mock 1:1 -- six records
// split 4 Major / 2 Minor, with the two most recent falling within the past
// year and the rest older, so the mock's "2 shown, 4 under 'See Older
// Disciplinaries'" split always renders as designed.
function buildConductRecord(
  monthsAgo: number,
  fields: Omit<ParoleConductRecord, "date">,
): ParoleConductRecord {
  return paroleConductRecordSchema.parse({
    ...fields,
    date: iso(subMonths(new Date(), monthsAgo)),
  });
}

function buildAndersonConductHistory(): Array<ParoleConductRecord> {
  return [
    buildConductRecord(0, {
      facility: "Western State Prison",
      violation: "Refusal to Submit to Drug Test",
      description:
        "Refused random urinalysis screening without valid medical exemption.",
      severity: "Major",
      disposition: "30 days disciplinary segregation, loss of good time",
    }),
    buildConductRecord(2, {
      facility: "Western State Prison",
      violation: "Unauthorized Area",
      description:
        "Found in restricted maintenance corridor without authorization.",
      severity: "Minor",
      disposition: "Loss of privileges - 7 days",
    }),
    buildConductRecord(14, {
      facility: "Western State Prison",
      violation: "Threatening Behavior",
      description: "Verbal threats toward staff member.",
      severity: "Major",
      disposition:
        "30 days disciplinary segregation, anger management referral",
    }),
    buildConductRecord(21, {
      facility: "Western State Prison",
      violation: "Fighting",
      description: "Physical altercation in dining hall.",
      severity: "Major",
      disposition: "45 days disciplinary segregation",
    }),
    buildConductRecord(29, {
      facility: "Western State Prison",
      violation: "Disobeying Orders",
      description: "Refused work assignment.",
      severity: "Minor",
      disposition: "Loss of privileges - 14 days",
    }),
    buildConductRecord(34, {
      facility: "Western State Prison",
      violation: "Possession of Contraband",
      description:
        "Found with an unauthorized cell phone during a cell search.",
      severity: "Major",
      disposition: "60 days disciplinary segregation, loss of good time",
    }),
  ];
}

// Generic docket entries cycle through three conduct patterns by index so
// the profile page's empty state, single-record state, and "See Older
// Disciplinaries" toggle all get exercised across the fixture docket without
// hand-authoring every case.
function buildGenericConductHistory(
  index: number,
  facility: string,
): Array<ParoleConductRecord> {
  const pattern = index % 3;
  if (pattern === 0) return [];
  if (pattern === 1) {
    return [
      buildConductRecord(1, {
        facility,
        violation: "Failure to Report",
        description: "Missed scheduled headcount.",
        severity: "Minor",
        disposition: "Loss of privileges - 3 days",
      }),
    ];
  }
  return [
    buildConductRecord(1, {
      facility,
      violation: "Insubordination",
      description: "Refused a direct order from a correctional officer.",
      severity: "Major",
      disposition: "14 days disciplinary segregation",
    }),
    buildConductRecord(16, {
      facility,
      violation: "Unauthorized Area",
      description: "Found in a restricted area without authorization.",
      severity: "Minor",
      disposition: "Loss of privileges - 7 days",
    }),
  ];
}

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
    parolePlan: {
      onFile: true,
      lastUpdated: iso(subDays(today, 20)),
      documents: [
        {
          url: "/documents/parole-plan-45821-v1.pdf",
          uploadDate: iso(subDays(today, 20)),
        },
        {
          url: "/documents/parole-plan-45821-v2.pdf",
          uploadDate: iso(subDays(today, 25)),
        },
      ],
    },
    attachments: [
      {
        name: "Letter of Support - Rev. Thomas Mills",
        type: "Letter of Support",
        url: "/documents/support-letter-mills-45821.pdf",
        uploadDate: iso(subDays(today, 22)),
      },
      {
        name: "Letter of Support - Mary Anderson (Sister)",
        type: "Letter of Support",
        url: "/documents/support-letter-anderson-45821.pdf",
        uploadDate: iso(subDays(today, 24)),
      },
      {
        name: "Victim Impact Statement",
        type: "Victim Impact Letter",
        url: "/documents/victim-impact-45821.pdf",
        uploadDate: iso(subDays(today, 40)),
      },
    ],
    conductHistory: buildAndersonConductHistory(),
  });
}

function buildParolePlan(
  docId: string,
  index: number,
  today: Date,
): ParoleCase["parolePlan"] {
  if (docId === NO_PAROLE_PLAN_DOC_ID) {
    return { onFile: false, documents: [] };
  }

  const lastUpdated = iso(
    subDays(today, docId === STALE_PAROLE_PLAN_DOC_ID ? 130 : 10 + index * 4),
  );
  return {
    onFile: true,
    lastUpdated,
    documents: [
      { url: `/documents/parole-plan-${docId}.pdf`, uploadDate: lastUpdated },
    ],
  };
}

function buildAttachments(
  docId: string,
  index: number,
  today: Date,
): ParoleCase["attachments"] {
  const author =
    GENERIC_ATTACHMENT_AUTHORS[index % GENERIC_ATTACHMENT_AUTHORS.length];
  return [
    {
      name: `Letter of Support - ${author}`,
      type: "Letter of Support",
      url: `/documents/support-letter-${docId}.pdf`,
      uploadDate: iso(subDays(today, 5 + index * 3)),
    },
  ];
}

function buildGenericCaseProfile(
  hearing: ParoleHearing,
  index: number,
): ParoleCase {
  const today = new Date();
  const hasScheduledHearing = hearing.docId !== NO_HEARING_SCHEDULED_DOC_ID;
  // Harris also anchors the "no disciplinary infractions" empty state, so her
  // conduct history is deliberately empty rather than pattern-derived.
  const conductHistory = hasScheduledHearing
    ? buildGenericConductHistory(index, hearing.facility)
    : [];
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
    conductHistory,
    mandatoryReleaseDate: iso(addDays(today, 600 + index * 30)),
    parolePlan: buildParolePlan(hearing.docId, index, today),
    attachments: buildAttachments(hearing.docId, index, today),
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
