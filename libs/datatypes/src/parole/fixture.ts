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
  ParoleCarasFactor,
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

// CARAS v7's 12 items and their logistic-regression coefficients are fixed
// properties of the tool itself, not per-person, so this pairs them with each
// case's own raw item values rather than repeating the name/coefficient list
// at every call site. Order matches the tool's published item order.
const CARAS_FACTOR_COEFFICIENTS: Array<Omit<ParoleCarasFactor, "value">> = [
  { name: "Age Group at First Arrest/Charge", coefficient: 0.32 },
  { name: "Offense Degree", coefficient: 0.16 },
  { name: "Offender Age", coefficient: -0.03 },
  { name: "Escape Count", coefficient: 0.25 },
  { name: "Substance Abuse Needs Level", coefficient: 0.18 },
  { name: "Gang Membership", coefficient: 0.11 },
  { name: "Prior Case Count", coefficient: 0.08 },
  { name: "Offense Category", coefficient: 0.26 },
  { name: "Criminal Attitude", coefficient: 0.18 },
  { name: "COPD Count", coefficient: 0.09 },
  { name: "Technical Violation Count", coefficient: 0.09 },
  { name: "Custody Level", coefficient: 0.16 },
];

function buildCarasFactors(values: Array<number>): Array<ParoleCarasFactor> {
  return CARAS_FACTOR_COEFFICIENTS.map((factor, i) => ({
    ...factor,
    value: values[i],
  }));
}

// CARAS v7's overall score is a logistic-regression probability, not a sum of
// points out of a max like the other tools -- summing each factor's own
// contribution (value * coefficient) with the model's fixed intercept gives
// the log-odds, which converts to a 0-100 "risk score" via the standard
// logistic function. Deriving `score` from `carasFactors` here (rather than
// hand-typing an independent number) keeps the subcategory chart and the
// overall score mathematically consistent.
const CARAS_INTERCEPT = -2.1;

function computeCarasScore(factors: Array<ParoleCarasFactor>): number {
  const logOdds =
    CARAS_INTERCEPT +
    factors.reduce((sum, f) => sum + f.value * f.coefficient, 0);
  const probability = 1 / (1 + Math.exp(-logOdds));
  return Math.round(probability * 100);
}

function buildCarasAssessment(
  values: Array<number>,
  date: string,
): {
  tool: "CARAS";
  score: number;
  maxScore: number;
  date: string;
  carasFactors: Array<ParoleCarasFactor>;
} {
  const carasFactors = buildCarasFactors(values);
  return {
    tool: "CARAS",
    score: computeCarasScore(carasFactors),
    maxScore: 100,
    date,
    carasFactors,
  };
}

// One hand-verified value set per CARAS risk band (Very Low/Low/Medium/High/
// Very High -- see getCarasRiskLevel in RiskAssessmentSection.tsx), computed
// to land clearly inside each band rather than near a boundary.
const GENERIC_CARAS_FACTOR_VALUES_BY_BAND: Array<Array<number>> = [
  [1, 1, 45, 0, 1, 0, 0, 0, 0, 0, 0, 1], // Very Low (~7%)
  [2, 2, 36, 0, 3, 0, 2, 1, 1, 0, 0, 2], // Low (~32%)
  [2, 3, 35, 0, 4, 0, 2, 1, 2, 0, 0, 2], // Medium (~45%)
  [3, 3, 32, 0, 4, 0, 2, 1, 2, 0, 1, 3], // High (~61%)
  [4, 5, 26, 1, 5, 1, 3, 2, 3, 1, 1, 4], // Very High (~93%)
];

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

// Keyed by docId (rather than derived from `individualName`) so it stays
// correct even if a fixture name is ever reworded.
const GENDER_BY_DOC_ID: Record<string, string> = {
  "DOC-45821": "Male", // Anderson, Michael
  "DOC-52903": "Female", // Brooks, Sarah
  "DOC-61247": "Male", // Chen, David
  "DOC-48392": "Female", // Davis, Jennifer
  "DOC-71458": "Male", // Evans, Robert
  "DOC-55729": "Female", // Foster, Maria
  "DOC-63184": "Male", // Garcia, Carlos
  "DOC-59402": "Female", // Harris, Patricia
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
    gender: GENDER_BY_DOC_ID["DOC-45821"],
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
    riskAssessments: [
      {
        tool: "LSI",
        score: 14,
        maxScore: 54,
        date: iso(subMonths(today, 3)),
        subcategories: [
          { name: "Criminal History", score: 3, maxScore: 10 },
          { name: "Education/Employment", score: 3, maxScore: 10 },
          { name: "Financial", score: 1, maxScore: 2 },
          { name: "Family/Marital", score: 1, maxScore: 4 },
          { name: "Accommodation", score: 1, maxScore: 3 },
          { name: "Leisure/Recreation", score: 1, maxScore: 2 },
          { name: "Companions", score: 1, maxScore: 5 },
          { name: "Alcohol/Drug", score: 2, maxScore: 9 },
          { name: "Emotional/Personal", score: 1, maxScore: 5 },
          { name: "Attitude/Orientation", score: 0, maxScore: 4 },
        ],
      },
      {
        tool: "PIT",
        score: 8,
        maxScore: 40,
        date: iso(subMonths(today, 5)),
        subcategories: [
          { name: "Disciplinary Incidents", score: 2, maxScore: 15 },
          { name: "Substance Use History", score: 3, maxScore: 10 },
          { name: "Program Non-Compliance", score: 1, maxScore: 8 },
          { name: "Violence History", score: 2, maxScore: 7 },
        ],
      },
      // Fixed date (not relative to `today`, unlike the rest of this file) to
      // match the reference CARAS v7 sample assessment date exactly.
      buildCarasAssessment([1, 3, 44, 0, 4, 0, 1, 0, 0, 0, 0, 1], "2026-04-16"),
      {
        tool: "SRT",
        score: 7,
        maxScore: 25,
        date: iso(subMonths(today, 15)),
        subcategories: [
          { name: "Prior Record Score", score: 3, maxScore: 8 },
          { name: "Age/Criminal Onset", score: 2, maxScore: 5 },
          { name: "Social Stability", score: 1, maxScore: 6 },
          { name: "Supervision Response", score: 1, maxScore: 6 },
        ],
      },
    ],
    riskOverviewHistory: [
      // All four tools get a value at this earliest date so every
      // trajectory line in the "All" view starts from the same point,
      // rather than each line beginning wherever that tool's history
      // happens to start.
      { date: iso(subYears(today, 3)), LSI: 59, PIT: 50, CARAS: 52, SRT: 58 },
      { date: iso(subMonths(today, 30)), SRT: 40 },
      { date: iso(subMonths(today, 24)), LSI: 44, PIT: 30 },
      { date: iso(subMonths(today, 18)), CARAS: 40 },
      { date: iso(subMonths(today, 15)), SRT: 28 },
      { date: iso(subMonths(today, 6)), LSI: 31, PIT: 35 },
      { date: iso(subYears(today, 1)), CARAS: 26 },
      { date: iso(subMonths(today, 5)), PIT: 40 },
      // PIT and CARAS extend all the way to LSI's most recent point so their
      // trajectory lines span the full chart. SRT deliberately stops at 15
      // months ago (above) rather than being extended here -- that gap is
      // what demonstrates the "assessment over 12 months stale" warning, so
      // stretching it to match would undercut the scenario it's meant to show.
      { date: iso(subMonths(today, 3)), LSI: 26, PIT: 34, CARAS: 18 },
    ],
    docPrograms: [
      {
        name: "Cognitive Behavioral Therapy",
        completionDate: iso(subMonths(today, 4)),
        type: "Treatment",
        criminogenicNeed: "Antisocial Thinking",
        status: "completed",
      },
      {
        name: "Substance Abuse Treatment",
        completionDate: iso(subMonths(today, 7)),
        type: "Treatment",
        criminogenicNeed: "Substance Abuse",
        status: "completed",
      },
      {
        name: "Vocational Training - Welding",
        completionDate: null,
        type: "Education/Vocational",
        criminogenicNeed: "Employment",
        status: "in-progress",
      },
      {
        name: "Anger Management",
        completionDate: null,
        type: "Treatment",
        criminogenicNeed: "Antisocial Thinking",
        status: "recommended",
      },
    ],
    edovoPrograms: [
      {
        title: "Financial Literacy Basics",
        completionDate: iso(subMonths(today, 6)),
        status: "completed",
        result: "passed",
        startDate: iso(subMonths(today, 7)),
        durationDays: 28,
      },
      {
        title: "Resume Building Workshop",
        completionDate: iso(subMonths(today, 5)),
        status: "completed",
        result: "passed",
        startDate: iso(subMonths(today, 6)),
        durationDays: 13,
      },
      {
        title: "Mindfulness and Stress Management",
        completionDate: null,
        status: "in-progress",
        startDate: iso(subMonths(today, 2)),
      },
    ],
    offenseHistory: {
      county: "Sangamon County",
      docket: "2021-CF-0489",
      conviction: "Armed Robbery",
      classFelony: "Class X Felony",
      sentence: "8 years",
      dateOfOffense: iso(subYears(today, 5)),
      convictionDate: iso(subYears(today, 4)),
      offenseNarrative:
        "Defendant entered convenience store with firearm and demanded cash from register. No injuries occurred. Defendant apprehended two blocks from scene.",
      priorConvictions: [
        { charge: "Theft", date: iso(subYears(today, 8)) },
        { charge: "Assault", date: iso(subYears(today, 7)) },
      ],
      victimInvolved: true,
    },
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

function buildGenericRiskAssessments(
  index: number,
  today: Date,
): Pick<ParoleCase, "riskAssessments" | "riskOverviewHistory"> {
  const riskPct = 20 + ((index * 17) % 60); // varies 20-79%
  return {
    riskAssessments: [
      {
        tool: "LSI",
        score: Math.round((riskPct / 100) * 54),
        maxScore: 54,
        date: iso(subMonths(today, 4)),
      },
      {
        tool: "PIT",
        score: Math.round((riskPct / 100) * 40),
        maxScore: 40,
        date: iso(subMonths(today, 6)),
      },
      buildCarasAssessment(
        // Hand-tuned (not a smooth formula of `index`) so the generic cases
        // cycle through all 5 CARAS risk bands rather than clustering in
        // just one or two -- useful for demoing the full risk-level range.
        GENERIC_CARAS_FACTOR_VALUES_BY_BAND[index % 5],
        iso(subMonths(today, 8)),
      ),
      {
        tool: "SRT",
        score: Math.round((riskPct / 100) * 25),
        maxScore: 25,
        date: iso(subMonths(today, 10)),
      },
    ],
    riskOverviewHistory: [
      { date: iso(subMonths(today, 10)), SRT: riskPct },
      { date: iso(subMonths(today, 8)), CARAS: riskPct },
      { date: iso(subMonths(today, 6)), PIT: riskPct },
      { date: iso(subMonths(today, 4)), LSI: riskPct },
    ],
  };
}

function buildOffenseHistory(
  index: number,
  today: Date,
): ParoleCase["offenseHistory"] {
  return {
    county: "Sample County",
    docket: `2022-CF-0${100 + index}`,
    conviction: "Burglary",
    classFelony: "Class 2 Felony",
    sentence: "6 years",
    dateOfOffense: iso(subYears(today, 4)),
    convictionDate: iso(subYears(today, 3 + (index % 4))),
    offenseNarrative:
      "Defendant entered an unoccupied residence and removed property without consent.",
    // No prior convictions for the generic cases -- Anderson's hand-authored
    // profile above is the one that exercises the "Prior Convictions" list.
    priorConvictions: [],
    victimInvolved: false,
  };
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
    gender: GENDER_BY_DOC_ID[hearing.docId],
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
    // Only Anderson's profile is hand-authored with program data (see comment
    // above); the rest have none until a real backend exists.
    docPrograms: [],
    edovoPrograms: [],
    offenseHistory: buildOffenseHistory(index, today),
    ...buildGenericRiskAssessments(index, today),
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
