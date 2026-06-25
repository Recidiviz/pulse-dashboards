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

import { parseISO } from "date-fns";
import React from "react";

import { UsMoClientMetadata } from "~datatypes";

import { UsMoCasePlanningView } from "./UsMoCasePlanning";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

// The module lives in the profile's right column; constrain to ~520px so the
// examples render at the design's density.
const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ maxWidth: 520, width: "100%" }}>{children}</div>
);

// Pinned "now" so the due-status (overdue / due-soon) is deterministic. This
// matches the project's `currentDate` of 2026-06-23.
const NOW = parseISO("2026-06-23");

const ORAS: UsMoClientMetadata["orasAssessment"] = {
  assessmentScore: 23,
  assessmentType: "ORAS_COMMUNITY_SUPERVISION",
  assessmentAdministeredBy: "MaryAnn Harper",
  assessmentDate: parseISO("2026-04-10"),
};

// Goals with a mix of objective end dates: an overdue date (2026-04-10), a
// due-soon date (2026-06-26, within 7 days of NOW), and a null date.
const CASE_PLAN: UsMoClientMetadata["casePlan"] = [
  {
    goal: "RS02A-Maintain Pro-Social Housing",
    objectivesAndTechniques: [
      {
        objective: "RS01.001-Research viable/ stable home plan options",
        objectiveEndDate: parseISO("2026-04-10"),
        techniques: ["IC01-Verbal Affirmation/admonishment as needed"],
      },
      {
        objective:
          "RS01.002-Submit selected home plan to Probation and Parole Officer",
        objectiveEndDate: null,
        techniques: [
          "IC01-Verbal Affirmation",
          "IC01-Verbal Affirmation/admonishment as needed",
        ],
      },
    ],
  },
  {
    goal: "SU02A-Maintain a Sober Lifestyle",
    objectivesAndTechniques: [
      {
        objective: "SU01.001-No violations for drug use",
        objectiveEndDate: parseISO("2026-06-26"),
        techniques: ["IC01-Verbal Affirmation"],
      },
      {
        objective: "SU01.005-Attend the support group of my choosing",
        objectiveEndDate: null,
        techniques: ["SV04-Service Referral: Other"],
      },
    ],
  },
];

export const FullData = () => (
  <Frame>
    <UsMoCasePlanningView
      orasAssessment={ORAS}
      casePlan={CASE_PLAN}
      lastUpdated={parseISO("2026-06-01")}
      now={NOW}
    />
  </Frame>
);

export const NoOras = () => (
  <Frame>
    <UsMoCasePlanningView
      orasAssessment={null}
      casePlan={CASE_PLAN}
      now={NOW}
    />
  </Frame>
);

export const NoCasePlan = () => (
  <Frame>
    <UsMoCasePlanningView
      orasAssessment={ORAS}
      casePlan={[]}
      lastUpdated={parseISO("2026-06-01")}
      now={NOW}
    />
  </Frame>
);

export const Empty = () => (
  <Frame>
    <UsMoCasePlanningView orasAssessment={null} casePlan={[]} now={NOW} />
  </Frame>
);
