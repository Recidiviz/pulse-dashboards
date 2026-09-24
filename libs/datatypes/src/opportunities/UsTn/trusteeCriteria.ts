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

/**
 * The Trustee custody criteria: the list, the sections and groups it prints
 * under, and the Annex sub-question that hangs off criterion 3.
 */

import { TrusteeFormSchema } from "./utils";

/** The two headings the criteria are printed under, in display order. */
export const TRUSTEE_CRITERIA_SECTIONS = [
  "Trustee Custody and Annex Housing Criteria",
  "Additional Trustee Custody Criteria",
] as const;

export type TrusteeCriterionSection =
  (typeof TRUSTEE_CRITERIA_SECTIONS)[number];

type TrusteeCriterionGroupDefinition = {
  section: TrusteeCriterionSection;
  label: string;
  /** Printed under the group label; declared on every group so reads need no narrowing. */
  note?: string;
};

export const TRUSTEE_CRITERIA_GROUPS: Record<
  "A" | "B" | "C" | "D" | "E",
  TrusteeCriterionGroupDefinition
> = {
  A: { section: TRUSTEE_CRITERIA_SECTIONS[0], label: "Sentence and offense" },
  B: {
    section: TRUSTEE_CRITERIA_SECTIONS[0],
    label: "Clinical / MAT (Medication Assisted Treatment)",
  },
  C: {
    section: TRUSTEE_CRITERIA_SECTIONS[1],
    label: "Custody and behavior history",
  },
  D: { section: TRUSTEE_CRITERIA_SECTIONS[1], label: "Legal holds" },
  E: {
    section: TRUSTEE_CRITERIA_SECTIONS[1],
    label: "Requires additional approval if not met",
    note: "False in this group does not disqualify the inmate. It adds a required approver: the Assistant Commissioner for Prison Operations or their designee.",
  },
};

export type TrusteeCriterionGroup = keyof typeof TRUSTEE_CRITERIA_GROUPS;

/** The shape each TRUSTEE_CRITERIA entry must have; consumers want `TrusteeCriterion`. */
type TrusteeCriterionShape = {
  key: keyof TrusteeFormSchema;
  text: string;
  helper?: string;
  group: TrusteeCriterionGroup;
  /** False disqualifies outright; False on a non-hard-bar adds a required approver. */
  isHardBar: boolean;
  affectsAnnex: boolean;
};

/**
 * The fifteen criteria in display order. List position is the criterion number,
 * so read it with `getTrusteeCriterionNumber`. `text` is verbatim TDOC policy
 * and must not be reworded; `**` delimits the segments rendered bold.
 */
export const TRUSTEE_CRITERIA = [
  {
    key: "trusteeHas10YearsOrLessRemaining",
    text: "Inmate has **10 years or less** remaining on their sentence AND is **not** serving a life or death sentence.",
    group: "A",
    isHardBar: true,
    affectsAnnex: true,
  },
  {
    key: "trusteeNotConvictedOfFirstDegreeMurder",
    text: "Inmate has **no** conviction for First Degree Murder, or for facilitation, solicitation, attempt, or conspiracy to commit First Degree Murder.",
    group: "A",
    isHardBar: true,
    affectsAnnex: true,
  },
  {
    key: "trusteeNotServingForSexualOffense",
    text: "Inmate is **not** a sex offender.",
    group: "A",
    isHardBar: true,
    affectsAnnex: true,
  },
  {
    key: "trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody",
    text: "If inmate's current offense is a violent/assaultive offense, the inmate has been in TDOC custody for a **minimum** of 12 months.",
    // Resolved to True upstream in us_tn_trustee_checklist when the current
    // offense is not violent, since the 12-month requirement does not apply.
    helper: "See Offense Severity List for assaultive offenses.",
    group: "A",
    isHardBar: true,
    affectsAnnex: true,
  },
  {
    key: "trusteeNotOnClinicalAlertStatus",
    text: "Inmate is **not** currently on clinical alert status.",
    group: "B",
    isHardBar: true,
    affectsAnnex: true,
  },
  {
    key: "trusteeNotOnLevelOfCare3Or4Or5",
    // Names level 6, which the policy text does not: only LVL1 and LVL2 clear
    // the criterion upstream.
    text: "Inmate is **not** on a level of care (LOC) of 3, 4, 5, or 6.",
    group: "B",
    isHardBar: true,
    affectsAnnex: true,
  },
  {
    key: "trusteeNoViolentFelonyConvictionPast5YearsIncarceration",
    text: "Inmate has **no** court-prosecuted felony convictions for a violent/assaultive offense committed during the past 5 years of incarceration.",
    group: "C",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoEscapeFromMediumCloseMaxPast10Years",
    text: "Inmate has **no** escape or attempted escape from medium, close, or maximum custody within the last 10 years of incarceration.",
    group: "C",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoEscapeFromLowTrusteePast5Years",
    text: "Inmate has **no** escape on record from low or Trustee custody within the last 5 years of incarceration.",
    helper:
      '"Low custody" includes prior placements at minimum direct, minimum restrict, or minimum Trustee custody levels.',
    group: "C",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years",
    text: "Inmate has **no** disciplinary convictions for assaultive conduct that resulted in serious injury or the death of another individual within the past 5 years of incarceration.",
    group: "C",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoDetainersOrWarrants",
    text: "Inmate has **no** felony or misdemeanor detainers and/or active warrants.",
    group: "D",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoPendingFelonyCharges",
    text: "Inmate has **no** pending felony charges.",
    group: "D",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoPendingImmigrationActions",
    text: "Inmate has **no** pending immigration deportation actions.",
    group: "D",
    isHardBar: true,
    affectsAnnex: false,
  },
  {
    key: "trusteeNoAssaultiveDisciplinaryWithSeriousInjuryMoreThan5YearsAgo",
    text: "Inmate has **no** disciplinary convictions for assaultive conduct that resulted in serious injury or the death of another individual more than 5 years ago.",
    group: "E",
    isHardBar: false,
    affectsAnnex: false,
  },
  {
    key: "trusteeNotScoredHighForViolence",
    text: "Inmate has **not** scored high for violence on the risk assessment.",
    group: "E",
    isHardBar: false,
    affectsAnnex: false,
  },
] as const satisfies readonly TrusteeCriterionShape[];

export type TrusteeCriterionKey = (typeof TRUSTEE_CRITERIA)[number]["key"];

/** A criterion with `key` narrowed to the keys that exist, so reads need no cast. */
export type TrusteeCriterion = TrusteeCriterionShape & {
  key: TrusteeCriterionKey;
};

/** The Annex-only sub-question revealed when the sex offender criterion is False. */
export const TRUSTEE_ANNEX_SUB_QUESTION = {
  key: "trusteeHas7YearsOrLessRemaining",
  text: "Inmate has **7 years or less** remaining on their sentence.",
  parentKey: "trusteeNotServingForSexualOffense",
} as const satisfies {
  key: keyof TrusteeFormSchema;
  text: string;
  parentKey: TrusteeCriterionKey;
};

/**
 * The criterion's position in the list, which is its number everywhere it is
 * referenced. Throws on a key that is not a criterion.
 */
export function getTrusteeCriterionNumber(key: TrusteeCriterionKey): number {
  const index = TRUSTEE_CRITERIA.findIndex((c) => c.key === key);

  if (index === -1) {
    throw new Error(`${key} is not a Trustee criterion`);
  }

  return index + 1;
}

/**
 * The fixed wording a failed criterion is reported with. The eligibility block
 * renders it as JSX with the heading bold, and the DOCX builds it as plain
 * text, so the two cannot share a rendering; sharing the words keeps a copy
 * change from having to be made in both places.
 */
export function trusteeCriterionNotMetHeading(
  key: TrusteeCriterionKey,
): string {
  return `Criterion ${getTrusteeCriterionNumber(key)} not met.`;
}

/** Introduces the criterion's own text, after the heading. */
export const TRUSTEE_REQUIREMENT_LABEL = "Requirement:";
