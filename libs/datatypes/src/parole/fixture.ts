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

import {
  addDays,
  format,
  parseISO,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

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

// The two Parole-enabled tenants, each with its own conduct classification
// scheme (see US_CO.ts/US_ID.ts paroleConfig.conductClassificationColors) --
// used to vary conduct history severities below so both states' schemes are
// demoable via `nx offline staff`.
export type ParoleFixtureStateCode = "US_CO" | "US_ID";

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
    docId: "45821",
    individualName: "Anderson, Michael",
    hearingType: "Parole Grant Hearing",
    facility: "Central State Correctional Facility",
    daysFromNow: 5,
  },
  {
    docId: "52903",
    individualName: "Brooks, Sarah",
    hearingType: "Parole Grant Hearing",
    facility: "North River Correctional Center",
    daysFromNow: 8,
  },
  {
    docId: "61247",
    individualName: "Chen, David",
    hearingType: "Revocation Hearing",
    facility: "Western State Prison",
    daysFromNow: 12,
  },
  {
    docId: "48392",
    individualName: "Davis, Jennifer",
    hearingType: "Parole Grant Hearing",
    facility: "Central State Correctional Facility",
    daysFromNow: 15,
  },
  {
    docId: "71458",
    individualName: "Evans, Robert",
    hearingType: "Parole Grant Hearing",
    facility: "South Bay Detention Center",
    daysFromNow: 19,
  },
  {
    docId: "55729",
    individualName: "Foster, Maria",
    hearingType: "Parole Grant Hearing",
    facility: "North River Correctional Center",
    daysFromNow: 23,
  },
  {
    docId: "63184",
    individualName: "Garcia, Carlos",
    hearingType: "Parole Grant Hearing",
    facility: "Western State Prison",
    daysFromNow: 26,
  },
  {
    docId: "59402",
    individualName: "Harris, Patricia",
    hearingType: "Modification Hearing",
    facility: "Central State Correctional Facility",
    daysFromNow: 30,
  },
];

const SHARED_HEARINGS: Array<ParoleHearing> = RAW_HEARINGS.map(
  ({ daysFromNow, ...hearing }) =>
    paroleHearingSchema.parse({
      ...hearing,
      hearingDate: iso(addDays(new Date(), daysFromNow)),
    }),
);

// Real Colorado DOC records (CO Parole Board MVP Sample, "Real Resident
// Mapping #1"/#2/etc.) used to validate the profile page against actual
// resident data ahead of the US_CO Parole MVP launch. Entries here belong
// only on US_CO's docket -- US_ID must never show a real CO resident's data.
// Add each newly extracted real resident's hearing to this array, and their
// case-profile detail to CO_REAL_CASE_PROFILES below (a resident may appear
// more than once here across separate hearings, each with its own docId).
const CO_HEARINGS: Array<ParoleHearing> = [
  paroleHearingSchema.parse({
    docId: "454321",
    individualName: "BANNER, BRUCE",
    hearingType: "Parole Grant Hearing",
    facility: "Fremont Correctional Facility",
    hearingDate: "2026-10-01",
  }),
  paroleHearingSchema.parse({
    docId: "980332",
    individualName: "ROGERS, STEVE",
    hearingType: "Parole Grant Hearing",
    facility: "Colorado State Penitentiary",
    hearingDate: "2026-10-01",
  }),
];

// Keyed by state so `nx offline staff` can serve each Parole-enabled tenant
// its own docket -- unlike the case data below (which varies only by
// severity scheme), US_CO's docket carries extra, real resident records
// that US_ID's must not.
export const paroleHearingsFixtureByState: Record<
  ParoleFixtureStateCode,
  Array<ParoleHearing>
> = {
  US_ID: SHARED_HEARINGS,
  US_CO: [...SHARED_HEARINGS, ...CO_HEARINGS],
};

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
  "52903": "10:30 AM",
  "61247": "1:00 PM",
  "48392": "9:30 AM",
  "71458": "11:00 AM",
  "55729": "2:00 PM",
  "63184": "10:00 AM",
};

// Keyed by docId (rather than derived from `individualName`) so it stays
// correct even if a fixture name is ever reworded.
const GENDER_BY_DOC_ID: Record<string, string> = {
  "45821": "Male", // Anderson, Michael
  "52903": "Female", // Brooks, Sarah
  "61247": "Male", // Chen, David
  "48392": "Female", // Davis, Jennifer
  "71458": "Male", // Evans, Robert
  "55729": "Female", // Foster, Maria
  "63184": "Male", // Garcia, Carlos
  "59402": "Female", // Harris, Patricia
};

const NO_HEARING_SCHEDULED_DOC_ID = "59402";

// Brooks: parole plan on file, but not updated in over 90 days.
const STALE_PAROLE_PLAN_DOC_ID = "52903";
// Chen: no parole plan on file at all.
const NO_PAROLE_PLAN_DOC_ID = "61247";
// Chen is also the fixture's parole-return case, so the General Info banner
// has coverage alongside his other flagged states above.
const PAROLE_RETURN_DOC_ID = "61247";

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

// Each record's severity varies by state -- CO uses its Class 1/2/3 scheme,
// ID uses Major/Minor -- but the underlying incident (facility, violation,
// description, disposition) is the same fixture "story" either way. The 4
// Major / 2 Minor split under US_ID matches the OBT-41634 design mock this
// was originally hand-authored against.
const ANDERSON_CONDUCT_RECORDS: Array<{
  monthsAgo: number;
  facility: string;
  violation: string;
  description: string;
  disposition: string;
  severityByState: Record<ParoleFixtureStateCode, string>;
}> = [
  {
    monthsAgo: 0,
    facility: "Western State Prison",
    violation: "Refusal to Submit to Drug Test",
    description:
      "Refused random urinalysis screening without valid medical exemption.",
    disposition: "30 days disciplinary segregation, loss of good time",
    severityByState: { US_CO: "Class 1", US_ID: "Major" },
  },
  {
    monthsAgo: 2,
    facility: "Western State Prison",
    violation: "Unauthorized Area",
    description:
      "Found in restricted maintenance corridor without authorization.",
    disposition: "Loss of privileges - 7 days",
    severityByState: { US_CO: "Class 3", US_ID: "Minor" },
  },
  {
    monthsAgo: 14,
    facility: "Western State Prison",
    violation: "Threatening Behavior",
    description: "Verbal threats toward staff member.",
    disposition: "30 days disciplinary segregation, anger management referral",
    severityByState: { US_CO: "Class 2", US_ID: "Major" },
  },
  {
    monthsAgo: 21,
    facility: "Western State Prison",
    violation: "Fighting",
    description: "Physical altercation in dining hall.",
    disposition: "45 days disciplinary segregation",
    severityByState: { US_CO: "Class 1", US_ID: "Major" },
  },
  {
    monthsAgo: 29,
    facility: "Western State Prison",
    violation: "Disobeying Orders",
    description: "Refused work assignment.",
    disposition: "Loss of privileges - 14 days",
    severityByState: { US_CO: "Class 3", US_ID: "Minor" },
  },
  {
    monthsAgo: 34,
    facility: "Western State Prison",
    violation: "Possession of Contraband",
    description: "Found with an unauthorized cell phone during a cell search.",
    disposition: "60 days disciplinary segregation, loss of good time",
    severityByState: { US_CO: "Class 2", US_ID: "Major" },
  },
];

function buildAndersonConductHistory(
  stateCode: ParoleFixtureStateCode,
): Array<ParoleConductRecord> {
  return ANDERSON_CONDUCT_RECORDS.map(
    ({ monthsAgo, severityByState, ...fields }) =>
      buildConductRecord(monthsAgo, {
        ...fields,
        severity: severityByState[stateCode],
      }),
  );
}

// Generic docket entries cycle through three conduct patterns by index so
// the profile page's empty state, single-record state, and "See Older
// Disciplinaries" toggle all get exercised across the fixture docket without
// hand-authoring every case.
function buildGenericConductHistory(
  index: number,
  facility: string,
  stateCode: ParoleFixtureStateCode,
): Array<ParoleConductRecord> {
  const classOne = stateCode === "US_CO" ? "Class 1" : "Major";
  const classThree = stateCode === "US_CO" ? "Class 3" : "Minor";

  const pattern = index % 3;
  if (pattern === 0) return [];
  if (pattern === 1) {
    return [
      buildConductRecord(1, {
        facility,
        violation: "Failure to Report",
        description: "Missed scheduled headcount.",
        severity: classThree,
        disposition: "Loss of privileges - 3 days",
      }),
    ];
  }
  return [
    buildConductRecord(1, {
      facility,
      violation: "Insubordination",
      description: "Refused a direct order from a correctional officer.",
      severity: classOne,
      disposition: "14 days disciplinary segregation",
    }),
    buildConductRecord(16, {
      facility,
      violation: "Unauthorized Area",
      description: "Found in a restricted area without authorization.",
      severity: classThree,
      disposition: "Loss of privileges - 7 days",
    }),
  ];
}

function buildAndersonCaseProfile(
  hearingDate: string,
  stateCode: ParoleFixtureStateCode,
): ParoleCase {
  const today = new Date();
  // LSI/PIT/SRT/CARAS each have a fixed most-recent assessment date (matching
  // verified real assessment dates, OBT-43413) rather than one relative to
  // `today` like the rest of this file. Their earlier history points are
  // anchored to that same fixed date -- not to `today` -- so they're
  // guaranteed to stay chronologically before it forever, regardless of how
  // far `today` drifts forward; anchoring to `today` instead would eventually
  // put a "historical" point after the fixed date it's supposed to precede.
  const lsiPitAnchor = parseISO("2025-06-26");
  const srtAnchor = parseISO("2026-03-19");
  const carasAnchor = parseISO("2026-04-16");
  return paroleCaseSchema.parse({
    docId: "45821",
    name: "Anderson, Michael",
    dob: iso(subYears(today, 40)),
    gender: GENDER_BY_DOC_ID["45821"],
    currentFacility: "Central State Correctional Facility",
    custodyLevel: "Minimum",
    caseManagerName: "Jennifer Martinez",
    hearingDate,
    hearingTime: "9:00 AM",
    isParoleReturn: false,
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
    conductHistory: buildAndersonConductHistory(stateCode),
    // Full assessment history per tool -- the most recent entry per tool
    // carries the real subcategory/CARAS-factor breakdown; earlier entries
    // are bare score/date pairs, matching what a real historical record
    // would actually have on file. The trajectory chart and the "current"
    // per-tool detail are both derived from this single array (see
    // RiskAssessmentSection.utils.ts), so there's nothing else to keep in
    // sync.
    riskAssessments: [
      // LSI: fixed most-recent date (matching a verified real assessment,
      // OBT-43413), so its history is anchored to `lsiPitAnchor` rather than
      // `today`.
      {
        tool: "LSI",
        score: 32,
        maxScore: 54,
        date: iso(subYears(lsiPitAnchor, 3)),
      },
      {
        tool: "LSI",
        score: 24,
        maxScore: 54,
        date: iso(subYears(lsiPitAnchor, 2)),
      },
      {
        tool: "LSI",
        score: 17,
        maxScore: 54,
        date: iso(subMonths(lsiPitAnchor, 2)),
      },
      {
        tool: "LSI",
        score: 31,
        maxScore: 54,
        date: "2025-06-26",
        subcategories: [
          { name: "Criminal History", score: 9, maxScore: 10 },
          { name: "Education/Employment", score: 7, maxScore: 10 },
          { name: "Financial", score: 1, maxScore: 2 },
          { name: "Family/Marital", score: 3, maxScore: 4 },
          { name: "Accommodation", score: 1, maxScore: 3 },
          { name: "Leisure/Recreation", score: 2, maxScore: 2 },
          { name: "Companions", score: 4, maxScore: 5 },
          { name: "Alcohol/Drug", score: 2, maxScore: 9 },
          { name: "Emotional/Personal", score: 0, maxScore: 5 },
          { name: "Attitude/Orientation", score: 2, maxScore: 4 },
        ],
      },
      // PIT: same verified assessment day as LSI, so it shares `lsiPitAnchor`.
      {
        tool: "PIT",
        score: 20,
        maxScore: 39,
        date: iso(subYears(lsiPitAnchor, 3)),
      },
      {
        tool: "PIT",
        score: 12,
        maxScore: 39,
        date: iso(subYears(lsiPitAnchor, 2)),
      },
      {
        tool: "PIT",
        score: 14,
        maxScore: 39,
        date: iso(subMonths(lsiPitAnchor, 2)),
      },
      {
        tool: "PIT",
        score: 28,
        maxScore: 39,
        date: "2025-06-26",
        subcategories: [
          { name: "Criminal History", score: 9, maxScore: 10 },
          {
            name: "Education, Employment, and Financial Situation",
            score: 7,
            maxScore: 6,
          },
          { name: "Family and Social Support", score: 4, maxScore: 6 },
          {
            name: "Substance Abuse and Mental Health",
            score: 1,
            maxScore: 5,
          },
          {
            name: "Criminal Attitudes and Behavioral Patterns",
            score: 7,
            maxScore: 11,
          },
        ],
      },
      // CARAS: fixed most-recent date (matching the reference CARAS v7
      // sample assessment), so its history is anchored to `carasAnchor`.
      {
        tool: "CARAS",
        score: 52,
        maxScore: 100,
        date: iso(subYears(carasAnchor, 3)),
      },
      {
        tool: "CARAS",
        score: 40,
        maxScore: 100,
        date: iso(subMonths(carasAnchor, 18)),
      },
      {
        tool: "CARAS",
        score: 26,
        maxScore: 100,
        date: iso(subMonths(carasAnchor, 6)),
      },
      {
        tool: "CARAS",
        score: 16,
        maxScore: 100,
        date: iso(subMonths(carasAnchor, 1)),
      },
      buildCarasAssessment([1, 3, 44, 0, 4, 0, 1, 0, 0, 0, 0, 1], "2026-04-16"),
      // SRT: fixed most-recent date, anchored to `srtAnchor`.
      {
        tool: "SRT",
        score: 18,
        maxScore: 44,
        date: iso(subYears(srtAnchor, 2)),
      },
      {
        tool: "SRT",
        score: 12,
        maxScore: 44,
        date: iso(subMonths(srtAnchor, 9)),
      },
      {
        tool: "SRT",
        score: 30,
        maxScore: 44,
        date: "2026-03-19",
        subcategories: [
          { name: "Criminal History", score: 11, maxScore: 12 },
          {
            name: "Education, Employment, and Financial Situation",
            score: 8,
            maxScore: 9,
          },
          {
            name: "Substance Abuse and Mental Health",
            score: 3,
            maxScore: 4,
          },
          {
            name: "Criminal Attitudes and Behavioral Patterns",
            score: 8,
            maxScore: 19,
          },
        ],
      },
      // Placeholder data (OBT-43413) -- US_CO has no real RT/CST source yet,
      // so these mirror the shape of the verified LSI/PIT/SRT data above
      // rather than real assessment values. RT/CST have no fixed reference
      // date, so -- unlike LSI/PIT/SRT/CARAS above -- their history is
      // anchored to `today` throughout, which keeps every entry for a given
      // tool consistently ordered relative to each other no matter when
      // `today` is.
      { tool: "RT", score: 16, maxScore: 28, date: iso(subMonths(today, 10)) },
      {
        tool: "RT",
        score: 12,
        maxScore: 28,
        date: iso(subMonths(today, 4)),
        subcategories: [
          { name: "Criminal History", score: 5, maxScore: 10 },
          { name: "Employment/Education", score: 4, maxScore: 10 },
          { name: "Social Support", score: 3, maxScore: 8 },
        ],
      },
      { tool: "CST", score: 22, maxScore: 49, date: iso(subMonths(today, 6)) },
      {
        tool: "CST",
        score: 18,
        maxScore: 49,
        date: iso(subMonths(today, 2)),
        subcategories: [
          { name: "Criminal History", score: 6, maxScore: 15 },
          { name: "Employment/Education", score: 5, maxScore: 14 },
          { name: "Substance Abuse", score: 4, maxScore: 10 },
          { name: "Social Support", score: 3, maxScore: 10 },
        ],
      },
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
      offenses: [
        {
          county: "Sangamon County",
          docket: "2021-CF-0489",
          conviction: "Armed Robbery",
          classFelony: "Class X Felony",
          sentence: "8 years",
          dateOfOffense: iso(subYears(today, 5)),
          convictionDate: iso(subYears(today, 4)),
          offenseNarrative:
            "Defendant entered convenience store with firearm and demanded cash from register. No injuries occurred. Defendant apprehended two blocks from scene.",
        },
        {
          county: "Sangamon County",
          docket: "2021-CF-0490",
          conviction:
            "Possession of a Controlled Substance With Intent to Deliver",
          classFelony: "Class 2 Felony",
          sentence: "5 years",
          dateOfOffense: iso(subYears(today, 5)),
          convictionDate: iso(subYears(today, 4)),
          offenseNarrative:
            "Defendant was found in possession of a controlled substance in a quantity indicating intent to distribute.",
        },
        {
          county: "Sangamon County",
          docket: "2021-CF-0491",
          conviction: "Escape",
          classFelony: "Class 4 Felony",
          sentence: "2 years",
          dateOfOffense: iso(subYears(today, 5)),
          convictionDate: iso(subYears(today, 4)),
          offenseNarrative:
            "Defendant left a work-release assignment without authorization and was apprehended the following day.",
        },
      ],
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
): Pick<ParoleCase, "riskAssessments"> {
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
  };
}

function buildOffenseHistory(
  index: number,
  today: Date,
): ParoleCase["offenseHistory"] {
  return {
    offenses: [
      {
        county: "Sample County",
        docket: `2022-CF-0${100 + index}`,
        conviction: "Burglary",
        classFelony: "Class 2 Felony",
        sentence: "6 years",
        dateOfOffense: iso(subYears(today, 4)),
        convictionDate: iso(subYears(today, 3 + (index % 4))),
        offenseNarrative:
          "Defendant entered an unoccupied residence and removed property without consent.",
      },
    ],
    // No prior convictions for the generic cases -- Anderson's hand-authored
    // profile above is the one that exercises the "Prior Convictions" list.
    priorConvictions: [],
    victimInvolved: false,
  };
}

function buildGenericCaseProfile(
  hearing: ParoleHearing,
  index: number,
  stateCode: ParoleFixtureStateCode,
): ParoleCase {
  const today = new Date();
  const hasScheduledHearing = hearing.docId !== NO_HEARING_SCHEDULED_DOC_ID;
  // Harris also anchors the "no disciplinary infractions" empty state, so her
  // conduct history is deliberately empty rather than pattern-derived.
  const conductHistory = hasScheduledHearing
    ? buildGenericConductHistory(index, hearing.facility, stateCode)
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
    isParoleReturn: hearing.docId === PAROLE_RETURN_DOC_ID,
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

// Case-profile detail for each real Colorado DOC record in CO_HEARINGS
// above, keyed by docId. Hand-authored from the CO Parole Board MVP
// Sample's "Real Resident Mapping #1"/#2/etc. column rather than
// generically derived, so the fixture matches an actual intake record. Add
// each newly extracted real resident's case profile here, not a new builder
// function -- this record is meant to grow as more real residents are
// added. Fields the source spreadsheet marked "#N/A" (no data on file) are
// set to this schema's empty/no-data value for that field's type.
// criminogenicNeed is blank for every docProgram in the source records, but
// paroleDocProgramSchema requires a non-null string, so it is set to "" here
// rather than widening the shared schema for one fixture's real-world gap.
const CO_REAL_CASE_PROFILES: Record<string, ParoleCase> = {
  "454321": paroleCaseSchema.parse({
    docId: "454321",
    name: "BANNER, BRUCE",
    dob: "1992-04-01",
    gender: "Male",
    currentFacility: "Fremont Correctional Facility",
    custodyLevel: "Medium",
    caseManagerName: "JANE WESTON",
    hearingDate: "2026-10-01",
    isParoleReturn: false,
    sentenceStartDate: "2023-06-16",
    paroleEligibilityDate: "2027-01-03",
    mandatoryReleaseDate: "2033-01-03",
    parolePlan: { onFile: false, documents: [] },
    attachments: [],
    conductHistory: [
      {
        date: "2025-01-14",
        facility: "Fremont Correctional Facility",
        violation: "THEFT",
        description:
          "OFFENDER WAS WITNESSED REACHING INTO A CANTEEN CRATE REMOVING AN ITEM THAT DID NOT BELONG TO THEM AND WAS LATER FOUND IN THEIR CELL.",
        severity: "Class 2",
        disposition: "LOST PRIVILEGES",
      },
    ],
    docPrograms: [
      {
        name: "Pathways - Break Through",
        completionDate: "2025-12-10",
        type: "Mental Health",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Financial Literacy",
        completionDate: "2025-08-26",
        type: "Educational/Vocational",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Dream Initiative",
        completionDate: "2025-08-12",
        type: "Educational/Vocational",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "INTRODUCTION TO COMPUTER INFORMATION SYSTEMS 52.0101",
        completionDate: "2025-07-10",
        type: "Educational/Vocational",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Lifeskills - Sim Venture",
        completionDate: "2025-06-19",
        type: "Educational/Vocational",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "MORAL RECONATION THERAPY",
        completionDate: "2025-05-06",
        type: "Mental Health",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Cert OSHA 30-Hr Haz-Gen Ind",
        completionDate: "2025-02-27",
        type: "Educational/Vocational",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Seven Habits of Highly Effective People",
        completionDate: "2024-10-30",
        type: "Mental Health",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Custodial Training CIP Code 190699",
        completionDate: "2024-06-06",
        type: "Educational/Vocational",
        criminogenicNeed: "",
        status: "completed",
      },
      {
        name: "Mental Health (CBT)",
        completionDate: null,
        type: "Mental Health",
        criminogenicNeed: "",
        status: "recommended",
      },
      {
        name: "Mental Health (IMR)",
        completionDate: null,
        type: "Mental Health",
        criminogenicNeed: "",
        status: "recommended",
      },
      {
        name: "Mental Health (Program 04)",
        completionDate: null,
        type: "Mental Health",
        criminogenicNeed: "",
        status: "recommended",
      },
    ],
    edovoPrograms: [],
    offenseHistory: {
      offenses: [
        {
          county: "Jefferson County",
          docket: "31CR9989",
          conviction: "Assault",
          classFelony: "Felony Class 4",
          sentence: "12 years",
          dateOfOffense: "2021-06-24",
          convictionDate: "2023-05-11",
          offenseNarrative:
            'Per PSIR, On 06/24/2021 at about 6:27 p.m., your affiant, hereby referred to as, "I" or, "Me" was dispatched to 7701 W Tower Ave for a report of a domestic. The reporting party (RP), who was later identified as Banner, Martine (DOB/09/22/1 993), reported that her husband tried to kill her by strangling her with a chord. She further reported that she had escaped and was across the street at 7700 W Tower Ave. She advised of multiple children in the residence and further stated that her husband, the suspect, is leaving in a silver Ford F150 with a temporary license plate on the back of the truck.',
        },
      ],
      priorConvictions: [],
      victimInvolved: true,
    },
    riskAssessments: [
      { tool: "SRT", score: 8, maxScore: 44, date: "2025-01-17" },
      { tool: "SRT", score: 16, maxScore: 44, date: "2024-01-25" },
      { tool: "PIT", score: 14, maxScore: 39, date: "2023-06-22" },
    ],
  }),
  "980332": paroleCaseSchema.parse({
    docId: "980332",
    name: "ROGERS, STEVE",
    dob: "1985-10-11",
    gender: "Male",
    currentFacility: "Colorado State Penitentiary",
    custodyLevel: "Close",
    caseManagerName: "GEORGE GEORGESON",
    hearingDate: "2026-10-01",
    isParoleReturn: true,
    sentenceStartDate: "2018-01-19",
    paroleEligibilityDate: "2027-01-07",
    mandatoryReleaseDate: "2039-12-16",
    parolePlan: {
      onFile: false,
      documents: [],
    },
    attachments: [],
    conductHistory: [
      {
        date: "2025-05-20",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "UNAUTHORIZED/INCIDENTAL CONTACT",
        description: "INMATE THREW WATER ON STAFF.",
        severity: "Class 2",
        disposition: "LOST TIME",
      },
      {
        date: "2025-05-20",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "THREATS",
        description: "INMATE MAKE THREATS TOWARDS STAFF.",
        severity: "Class 2",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2025-05-14",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "HAZARDOUS LIQUID ASSAULT ON STAFF",
        description:
          "INMATER ATTEMTED TO CAUSE INJURY TO STAFF BY THROWING AN UNKNOWN LIQUID ON THEM.",
        severity: "Class 1",
        disposition: "LOST TIME",
      },
      {
        date: "2025-05-08",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "HAZARDOUS LIQUID ASSAULT ON STAFF",
        description: "INMATE THREW HAZARDOUS LIQUID AND HIT STAFF.",
        severity: "Class 1",
        disposition: "LOST PRIVILEGES",
      },
      {
        date: "2025-04-25",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "THREATS",
        description: "INMATE MADE THREATS TOWARDS STAFF.",
        severity: "Class 2",
        disposition: "LOST PRIVILEGES",
      },
      {
        date: "2025-03-06",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "DAMAGE TO PROPERTY (OLD:>$50)",
        description:
          "INMATE DAMAGED ITEMS ASSIGNED TO HIM REQUIRING REPLACEMENT OR REPAIR. RESTITUTION $3.96 TP CSP LAUNDRY",
        severity: "Class 2",
        disposition: "RESTITUTION",
      },
      {
        date: "2025-02-08",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "UNAUTHORIZED POSSESSION",
        description:
          "DO LT DOE HO LT NIGHT. INMATE WS FOIUND IN POSSESSION OF UNAUTHORIZED ITEMS.",
        severity: "Class 2",
        disposition: "LOST TIME",
      },
      {
        date: "2024-10-29",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "HAZARDOUS LIQUID ASSAULT ON STAFF",
        description:
          "OFFENDER ROGERS THREW A LIQUID FECES MIXTURE AT STAFF THROUGH THE TRAY SLOT. 15 DYS RH, 30 DYS LOGT.",
        severity: "Class 1",
        disposition: "SEGREGATION",
      },
      {
        date: "2024-10-29",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "HAZARDOUS LIQUID ASSAULT ON STAFF",
        description:
          "OFFENDER ROGERS THREW A LIQUID FECES MIXTURE AT STAFF THROUGH THE TRAY SLOT. 15 DYS RH, 30 DYS LOGT.",
        severity: "Class 1",
        disposition: "LOST TIME",
      },
      {
        date: "2024-10-28",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "OFFENDER ROGERS MADE STATEMENTS TO ASSAULT ANOTHER OFFENDER. 15 DYS RH, 15 DYS LOGT.",
        severity: "Class 2",
        disposition: "SEGREGATION",
      },
      {
        date: "2024-10-28",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "OFFENDER ROGERS MADE STATEMENTS TO HARM STAFF. 15 DYS RH, 15 DYS LOGT.",
        severity: "Class 2",
        disposition: "LOST TIME",
      },
      {
        date: "2024-10-28",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "OFFENDER ROGERS MADE STATEMENTS TO ASSAULT ANOTHER OFFENDER. 15 DYS RH, 15 DYS LOGT.",
        severity: "Class 2",
        disposition: "LOST TIME",
      },
      {
        date: "2024-10-28",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "OFFENDER ROGERS MADE STATEMENTS TO HARM STAFF. 15 DYS RH, 15 DYS LOGT.",
        severity: "Class 2",
        disposition: "SEGREGATION",
      },
      {
        date: "2024-09-07",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "OFFENDER MADE STATEMENTS THAT PLACED A PERSON IN FEAR OF INJURY. WAIVED RIGHT TO A FORMAL HEARING.",
        severity: "Class 2",
        disposition: "LOST PRIVILEGES",
      },
      {
        date: "2024-04-20",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "POSSESSION SYRINGE/DRUG PARAPHERNALIA",
        description:
          "OFFENDER ROGERS. IT WAS FOUND THE ITEM WAS NOT A HYPODERMIC NEEDLE AND NOT CAPABLE OF ADMINISTERING DANGEROUS DRUGS. NOTHING IMPOSED.",
        severity: "Class 2",
        disposition: "NOT GUILTY",
      },
      {
        date: "2024-01-14",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "POSSESION OR USE OF DANGEROUS DRUGS",
        description:
          "OFFENDER ROGERS IN POSSESSION OF ITEMS COMMONLY USED IN THE CORRECTION SETTTING TO MAKE HOMEMADE ALCOHOL. 20 DYS LOP PROBATED. OFFENDER WAIVED RIGHT TO A FORMAL HEARING.",
        severity: "Class 2",
        disposition: "LOST PRIVILEGES",
      },
      {
        date: "2023-09-28",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "OFFENDER MADE THREATENING STATEMENTS TO A STAFF MEMBER. OFFENDER WAIVED RIGHT TO A FORMAL HEARING.",
        severity: "Class 2",
        disposition: "SEGREGATION",
      },
      {
        date: "2023-09-25",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "VERBAL ABUSE",
        description:
          "OFFENDER ROGERS INTERFERRED WITH A DOC STAFF SEARCH, MAKING OFFENSIVE STATEMENTS AND POSSESSING UNAUTHORIZED ITEMS. 8 DYS RH. OFFENDER WAVIED RIGHT TO A FORMAL HEARING.",
        severity: "Class 2",
        disposition: "SEGREGATION",
      },
      {
        date: "2023-09-25",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "INTERFERENCE WITH SEARCH",
        description:
          "OFFENDER ROGERS INTERFERRED WITH A DOC STAFF SEARCH, MAKING OFFENSIVE STATEMENTS AND POSSESSING UNAUTHORIZED ITEMS. 8 DYS RH. OFFENDER WAVIED RIGHT TO A FORMAL HEARING.",
        severity: "Class 2",
        disposition: "SEGREGATION",
      },
      {
        date: "2023-09-25",
        facility: "STERLING CORRECTIONAL FACILITY",
        violation: "UNAUTHORIZED POSSESSION",
        description:
          "OFFENDER ROGERS INTERFERRED WITH A DOC STAFF SEARCH, MAKING OFFENSIVE STATEMENTS AND POSSESSING UNAUTHORIZED ITEMS. 8 DYS RH. OFFENDER WAVIED RIGHT TO A FORMAL HEARING.",
        severity: "Class 2",
        disposition: "SEGREGATION",
      },
      {
        date: "2023-06-07",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "TAMPERING WITH LOCKS/SECURITY",
        description:
          "HO KLINGON DO KYPROT: OFFENDER ROGERS HAD THE WINDOW OF THEIR CELL AND REFUSED DIRECTIVES TO UNCOVER THE WINDOW. THEY THEN THREATENED TO THROW WATER ON STAFF.",
        severity: "Class 1",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2023-06-06",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "DISOBEYING A LAWFUL ORDER - CHARGE A",
        description:
          "HO KLINGON DO KYPROT: OFFENDER COVERED THEIR WINDOW DURING COUNT AND REFUSED DIRECTIVES TO SUBMIT TO RESTRAINTS. OFFENDER MADE MULTIPLE THREATS TO STAFF.",
        severity: "Class 2",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2023-06-06",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "THREATS",
        description:
          "HO KLINGON DO KYPROT: OFFENDER ROGERS MADE THREATS TO KILL STAFF UPON THEIR RELEASE FROM CUSTODY OF THE DEPARTMENT OF CORRECTIONS",
        severity: "Class 2",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2023-06-06",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "COUNT INTERFERENCE",
        description:
          "HO KLINGON DO KYPROT: OFFENDER COVERED THEIR WINDOW DURING COUNT AND REFUSED DIRECTIVES TO SUBMIT TO RESTRAINTS. OFFENDER MADE MULTIPLE THREATS TO STAFF.",
        severity: "Class 2",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2023-06-06",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "TAMPERING WITH LOCKS/SECURITY",
        description:
          "HO KLINGON DO KYPROT: OFFENDER ROGERS MADE THREATS TO KILL STAFF UPON THEIR RELEASE FROM CUSTODY OF THE DEPARTMENT OF CORRECTIONS",
        severity: "Class 1",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2023-06-06",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "TAMPERING WITH LOCKS/SECURITY",
        description:
          "HO KLINGON DO KYPROT: OFFENDER COVERED THEIR WINDOW DURING COUNT AND REFUSED DIRECTIVES TO SUBMIT TO RESTRAINTS. OFFENDER MADE MULTIPLE THREATS TO STAFF.",
        severity: "Class 1",
        disposition: "SEGREGATION",
      },
      {
        date: "2023-06-05",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "BODY MODIFICATION",
        description:
          "HO KLINGON DO KYPROT: OFFENDER ROGERS WAS FOUND IN POSSESSION OF TATTOO PARAPHERNALIA",
        severity: "Class 2",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2023-06-05",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "UNAUTHORIZED POSSESSION",
        description:
          "HO KLINGON DO KYPROT: OFFENDER ROGERS WAS FOUND IN POSSESSION OF TATTOO PARAPHERNALIA",
        severity: "Class 2",
        disposition: "NO SANCTION - CMNTS",
      },
      {
        date: "2022-12-27",
        facility: "CENTENNIAL CORRECTIONAL FACILITY",
        violation: "ASSAULT ON OFFENDER",
        description:
          "HO KLINGON, DO KYPROT: OFFENDER WAS IN A FIGHT WITH ANOTHER OFFENDER",
        severity: "Class 1",
        disposition: "SEGREGATION",
      },
      {
        date: "2020-01-25",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "POSSESSION OF DANGEROUS CONTRABAND",
        description:
          "D.O. LT ASTRUD.  H.O. TIP ZAYOOS.  OFFENDER FOUND GUILTY OF COMPLICIT IN ATTEMPTING TO AID TWO OTHERS DURING A MURDER ATTEMPT.  WEAPON FOUND IN THIS OFFENDER'S POSSESSION.",
        severity: "Class 1",
        disposition: "LOST TIME",
      },
      {
        date: "2020-01-25",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "MURDER",
        description:
          "D.O. LT ASTRUD.  H.O. TIP ZAYOOS.  OFFENDER FOUND GUILTY OF COMPLICIT IN ATTEMPTING TO AID TWO OTHERS DURING A MURDER ATTEMPT.  WEAPON FOUND IN THIS OFFENDER'S POSSESSION.",
        severity: "Class 1",
        disposition: "SEGREGATION",
      },
      {
        date: "2020-01-25",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "ASSAULT ON OFFENDER",
        description:
          "D.O. LT ASTRUD- OFFENDER AIDED OR ASSISTED WITH OTHER OFFENDERS IN A PHYSICAL ALTERCATION, ASSAULTING ANOTHER OFFENDER WITH WEAPONS.  OFFENDER WAS FOUND IN POSSESSION OF A HOMEMADE WEAPON.",
        severity: "Class 1",
        disposition: "LOST TIME",
      },
      {
        date: "2020-01-25",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "POSSESSION OF DANGEROUS CONTRABAND",
        description:
          "D.O. LT ASTRUD.  H.O. TIP ZAYOOS.  OFFENDER FOUND GUILTY OF COMPLICIT IN ATTEMPTING TO AID TWO OTHERS DURING A MURDER ATTEMPT.  WEAPON FOUND IN THIS OFFENDER'S POSSESSION.",
        severity: "Class 1",
        disposition: "SEGREGATION",
      },
      {
        date: "2020-01-25",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "POSSESSION OF DANGEROUS CONTRABAND",
        description:
          "D.O. LT ASTRUD- OFFENDER AIDED OR ASSISTED WITH OTHER OFFENDERS IN A PHYSICAL ALTERCATION, ASSAULTING ANOTHER OFFENDER WITH WEAPONS.  OFFENDER WAS FOUND IN POSSESSION OF A HOMEMADE WEAPON.",
        severity: "Class 1",
        disposition: "LOST TIME",
      },
      {
        date: "2019-06-11",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "THREATS",
        description:
          'D.O. BILL LION. OFFENDER VERBALLY COMMUNICATED AN INTENT TO JEOPARDIZE SAFETY /SECURITY OF FACILITY WHEN HE TOLD OFFICER HE WAS NOT GOING TO FOLLOW THE RULES "SEE WHAT HAPPENS". OFFICER TOOK THIS AS A THREAT.',
        severity: "Class 2",
        disposition: "HOUSING RESTRICTION",
      },
      {
        date: "2018-02-07",
        facility: "COLORADO STATE PENITENTIARY",
        violation: "THREATS",
        description:
          "D.O. SAREN.  OFFENDER VERBALLY AND PHYSICALLY COMMUNICATED A DETERMINATION TO HARM ANOTHER PERSON AND WAS OBSERVED TAMPERING WITH A FIRE ALARM.",
        severity: "Class 2",
        disposition: "LOST PRIVILEGES",
      },
    ],
    docPrograms: [
      {
        name: "Why Try 7.1",
        completionDate: "2021-07-08",
        type: "Mental Health",
        criminogenicNeed: "",
        status: "completed",
      },
    ],
    edovoPrograms: [],
    offenseHistory: {
      offenses: [
        {
          county: "El Paso County",
          docket: "77CR9088",
          conviction: "Assault",
          classFelony: "Felony Class 4",
          sentence: "24 years",
          dateOfOffense: "2017-07-26",
          convictionDate: "2017-12-06",
          offenseNarrative:
            "A PSI was not available for programming, according to a Probable Cause Affidavit, on 07/26/2017, while several El Paso County Deputies were attempting to stop offender Rogers from harming himself, offender Rogers spit saliva at the deputies, hitting one in the face, right eye and shoulder.",
        },
      ],
      priorConvictions: [
        {
          charge: "Assault",
          date: "2012-02-14",
        },
        {
          charge: "Menacing",
          date: "2008-02-21",
        },
        {
          charge: "Menacing",
          date: "2017-09-12",
        },
      ],
      victimInvolved: true,
    },
    riskAssessments: [
      {
        tool: "CARAS",
        score: 0.61,
        maxScore: 1,
        date: "2026-07-14",
      },
      {
        tool: "SRT",
        score: 17,
        maxScore: 44,
        date: "2026-04-07",
      },
      {
        tool: "CARAS",
        score: 0.63,
        maxScore: 1,
        date: "2025-10-29",
      },
      {
        tool: "CARAS",
        score: 0.71,
        maxScore: 1,
        date: "2025-09-13",
      },
      {
        tool: "RT",
        score: 14,
        maxScore: 27,
        date: "2025-03-31",
      },
      {
        tool: "RT",
        score: 13,
        maxScore: 27,
        date: "2024-03-19",
      },
      {
        tool: "SRT",
        score: 17,
        maxScore: 44,
        date: "2023-03-20",
      },
      {
        tool: "SRT",
        score: 24,
        maxScore: 44,
        date: "2021-04-26",
      },
      {
        tool: "SRT",
        score: 23,
        maxScore: 44,
        date: "2020-04-22",
      },
      {
        tool: "SRT",
        score: 25,
        maxScore: 44,
        date: "2019-04-24",
      },
      {
        tool: "SRT",
        score: 19,
        maxScore: 44,
        date: "2018-04-23",
      },
      {
        tool: "PIT",
        score: 28,
        maxScore: 39,
        date: "2018-01-24",
      },
      {
        tool: "SRT",
        score: 19,
        maxScore: 44,
        date: "2015-12-06",
      },
      {
        tool: "SRT",
        score: 18,
        maxScore: 44,
        date: "2015-04-09",
      },
    ],
  }),
};

function buildParoleCasesFixture(
  stateCode: ParoleFixtureStateCode,
): Record<string, ParoleCase> {
  return Object.fromEntries(
    paroleHearingsFixtureByState[stateCode].map((hearing, index) => {
      if (hearing.docId === "45821") {
        return [
          hearing.docId,
          buildAndersonCaseProfile(hearing.hearingDate, stateCode),
        ];
      }
      if (hearing.docId in CO_REAL_CASE_PROFILES) {
        return [hearing.docId, CO_REAL_CASE_PROFILES[hearing.docId]];
      }
      return [
        hearing.docId,
        buildGenericCaseProfile(hearing, index, stateCode),
      ];
    }),
  );
}

// Keyed by state so `nx offline staff` can serve each Parole-enabled
// tenant its own conduct classification scheme (see ParoleOfflineAPIClient)
// -- the rest of the case data (offense history, risk assessments, etc.) is
// identical across states, only conductHistory severities differ.
export const paroleCasesFixtureByState: Record<
  ParoleFixtureStateCode,
  Record<string, ParoleCase>
> = {
  US_CO: buildParoleCasesFixture("US_CO"),
  US_ID: buildParoleCasesFixture("US_ID"),
};
