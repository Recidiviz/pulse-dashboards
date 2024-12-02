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

import { Case } from "@prisma/client";

import { OTHER_OPTION } from "../Form/constants";
import { NeedsToDisplayName, Pronouns } from "./types";

const neutralPronouns = {
  subject: "they",
  possessive: "their",
  object: "them",
  salutation: "",
};

const malePronouns = {
  subject: "he",
  possessive: "his",
  object: "him",
  salutation: "Mr.",
};

const femalePronouns = {
  subject: "she",
  possessive: "her",
  object: "her",
  salutation: "Ms.",
};

export const pronouns: Pronouns = {
  MALE: malePronouns,
  FEMALE: femalePronouns,
  NON_BINARY: neutralPronouns,
  TRANS: neutralPronouns,
  TRANS_MALE: malePronouns,
  TRANS_FEMALE: femalePronouns,
  INTERNAL_UNKNOWN: neutralPronouns,
  EXTERNAL_UNKNOWN: neutralPronouns,
  UNKNOWN: neutralPronouns,
};

/** Needs to be excluded for all recommendations */
export const defaultExclusionList: Case["needsToBeAddressed"] = [
  "ClothingAndToiletries",
  "GeneralReEntrySupport",
  OTHER_OPTION,
];

/** Needs to be excluded from Rider or Term recommendations */
export const riderOrTermExclusionList: Case["needsToBeAddressed"] = [
  "CaseManagement",
  "FamilyServices",
  "FinancialAssistance",
  "FoodInsecurity",
  "HousingOpportunities",
  "JobTrainingOrOpportunities",
  "Transportation",
  ...defaultExclusionList,
];

/** A map of need to display name overrides */
export const needToDisplayNameMap: NeedsToDisplayName = {
  DomesticViolenceIssues: "Domestic Violence Training",
  FamilyServices: "Family Support",
  FinancialAssistance: "Financial Support",
  HousingOpportunities: "Housing",
  JobTrainingOrOpportunities: "Vocational Training",
};

/**
 * A map of recommendation type and exclusion list
 */
export const needsListExclusions: {
  [key: string]: Case["needsToBeAddressed"];
} = {
  Rider: riderOrTermExclusionList,
  Term: riderOrTermExclusionList,
  Probation: defaultExclusionList,
  None: defaultExclusionList,
};
