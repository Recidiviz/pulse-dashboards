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

import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsMeSCCPConfiguration extends ApiOpportunityConfiguration {
  get nonOmsCriteria() {
    return [
      {
        text: "Must have completed assigned core programs",
        tooltip: "The resident must have completed assigned core programs",
      },
      {
        text: "Must be currently case plan compliant",
        tooltip: "The resident must be currently case plan compliant",
      },
      {
        text: "Resident has a stable home to be released to",
        tooltip:
          "Suitable housing in the community may consist of: a. a home; b. a full-time treatment facility, such as a residential substance use disorder treatment facility or mental health facility; c. transitional housing that provides support services for targeted groups, e.g., veterans, domestic violence victims, persons with mental illness, persons with substance use disorder problems, etc.; d. temporary housing associated with education or vocational training or employment; e. a hospital or other appropriate care facility, such as a nursing facility, residential care facility or a facility that is a licensed hospice program pursuant to Title 22, Section 8622; or\n f. any other approved housing in the community.",
      },
    ];
  }

  get supportsAlmostEligible() {
    return true;
  }
}
