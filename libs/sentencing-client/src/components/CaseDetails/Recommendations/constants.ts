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

import { NeedsToDisplayName, Pronouns } from "./types";

export enum RecommendationOptionType {
  SentenceLength = "sentenceLength",
  SentenceType = "recommendationType",
}

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

/** A map of need to display name overrides */
export const needToDisplayNameMap: NeedsToDisplayName = {
  DomesticViolenceIssues: "Domestic Violence Training",
  FamilyServices: "Family Support",
  FinancialAssistance: "Financial Support",
  HousingOpportunities: "Housing",
  JobTrainingOrOpportunities: "Vocational Training",
};

export const PROTECTIVE_FACTORS_NEEDS_LIST_LIMIT = 8;
