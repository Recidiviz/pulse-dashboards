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

import { PersonalHistoryInput } from "~datatypes";

import {
  ResolvedSection,
  resolveSection,
  SectionConfig,
} from "./resolveSection";

export type PersonalHistoryFields = {
  socialHistory: string;
  relationships: string;
  education: string;
  occupation: string;
  military: string;
  residentComments: string;
};

// One substance the resident has used.
export type SubstanceUseFields = {
  substance: string;
  ageOfFirstUse: number;
  // A month, YYYY-MM.
  lastUse: string;
  heaviestUse: string;
};

export type ResolvedPersonalHistory = ResolvedSection<
  PersonalHistoryFields,
  SubstanceUseFields
>;

// Atlas has no current source for Personal History, so no field reads from
// it and every row is one the PHI added. With no compare, rows stay in the
// order the PHI added them.
const personalHistoryConfig: SectionConfig<
  undefined,
  never,
  PersonalHistoryFields,
  SubstanceUseFields
> = {
  fields: {
    socialHistory: {},
    relationships: {},
    education: {},
    occupation: {},
    military: {},
    residentComments: {},
  },
  rows: {
    fields: {
      substance: {},
      ageOfFirstUse: {},
      lastUse: {},
      heaviestUse: {},
    },
  },
};

/**
 * Returns the Personal History the report shows: the PHI's text for each box,
 * null until the PHI writes it, and the substance use rows in the order the
 * PHI added them.
 *
 * For example, if the PHI wrote about the resident's education and added
 * these substances in this order (ids, editors, and times abridged):
 *
 *   id         substance        ageOfFirstUse  lastUse  heaviestUse
 *   phi_..832  Alcohol          16             2023-10  Most weekends
 *   phi_..901  Methamphetamine  19
 *
 * the section resolves to:
 *
 *   fields:  education            "Finished the 10th grade..."  source PHI
 *            the other five boxes  null                          source ATLAS
 *   rows:    phi_..832  Alcohol          16  2023-10  Most weekends
 *            phi_..901  Methamphetamine  19  null     null
 *
 * @param input - The report's Personal History input, or undefined if the PHI
 *   has entered nothing in the section.
 */
export function resolvePersonalHistory(
  input: PersonalHistoryInput | undefined,
): ResolvedPersonalHistory {
  return resolveSection(personalHistoryConfig, undefined, input);
}
