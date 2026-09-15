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

import { ParoleCase } from "~datatypes";

/**
 * A complete, minimal ParoleCase for tests that need a valid case detail but
 * don't care about most of its fields. Pass `overrides` for whatever the
 * test under it actually varies; everything else falls back to this shared
 * baseline rather than being copy-pasted per test file.
 */
export function buildParoleCase(
  overrides: Partial<ParoleCase> = {},
): ParoleCase {
  return {
    docId: "45821",
    displayId: "945821",
    name: "Anderson, Michael",
    dob: "1986-07-27",
    gender: "Male",
    currentFacility: "Western State Prison",
    custodyLevel: "Minimum",
    caseManagerName: "Jennifer Martinez",
    hearingType: "Parole Grant Hearing",
    sentenceStartDate: "2022-07-27",
    paroleEligibilityDate: "2026-08-16",
    mandatoryReleaseDate: "2028-06-26",
    parolePlan: { onFile: false, documents: [] },
    attachments: [],
    conductHistory: [],
    docPrograms: [],
    edovoPrograms: [],
    offenseHistory: {
      offenses: [
        {
          county: "Sangamon County",
          docket: "2021-CF-0489",
          conviction: "Armed Robbery",
          classFelony: "Class X Felony",
          sentence: "8 years",
          dateOfOffense: "2021-07-30",
          convictionDate: "2022-07-30",
          offenseNarrative: "Defendant entered convenience store with firearm.",
        },
      ],
      priorConvictions: [],
      victimInvolved: false,
      victimAttendingHearing: false,
    },
    riskAssessments: [],
    riskAndNeedsFactors: [],
    communitySupervisionPlan: [],
    ...overrides,
  };
}
