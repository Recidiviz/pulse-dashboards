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

import { CardFrame } from "../shared/styles";
import { CasePlanList } from "./CasePlanList";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ maxWidth: 520, width: "100%" }}>
    <CardFrame>{children}</CardFrame>
  </div>
);

// Pinned "now" so the due-status is deterministic (matches currentDate).
const NOW = parseISO("2026-06-23");

// Goals demonstrating overdue (2026-04-10), due-soon (2026-06-26), and no date.
const CASE_PLAN: UsMoClientMetadata["casePlan"] = [
  {
    goal: "RS02A-Maintain Pro-Social Housing",
    objectivesAndTechniques: [
      {
        objective: "RS01.001-Research viable/ stable home plan options",
        objectiveEndDate: parseISO("2026-04-10"),
        techniques: ["IC01-Verbal Affirmation/admonishment as needed"],
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

export const WithGoals = () => (
  <Frame>
    <CasePlanList casePlan={CASE_PLAN} now={NOW} />
  </Frame>
);

export const Empty = () => (
  <Frame>
    <CasePlanList casePlan={[]} now={NOW} />
  </Frame>
);
