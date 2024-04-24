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

import { OpportunityConfig } from "../types";
import aboutBody1 from "./aboutBody1.md?raw";
import aboutBody2 from "./aboutBody2.md?raw";
import aboutBody3 from "./aboutBody3.md?raw";
import nextStepsBody from "./nextStepsBody.md?raw";

export const config: OpportunityConfig = {
  copy: {
    eligibilityHeadingPhrase:
      "you could be eligible to apply for the Supervised Community Confinement Program",
    about: {
      sections: [
        {
          heading: "About the program",
          body: aboutBody1,
        },
        {
          heading: "Quick facts",
          body: aboutBody2,
        },
        { heading: "How to apply", body: aboutBody3 },
      ],
      linkText: "Learn more about how the program works",
    },
    eligibility: {
      untrackedCriteria: [
        "Have a safe and healthy place to live for the entire time you are on SCCP",
        "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
        "Completed required programs, following your case plan, and showing positive change",
      ],
      linkText: "Get details about each requirement",
    },
    nextSteps: {
      body: nextStepsBody,
      linkText: "How to put together a strong application",
    },
  },
};
