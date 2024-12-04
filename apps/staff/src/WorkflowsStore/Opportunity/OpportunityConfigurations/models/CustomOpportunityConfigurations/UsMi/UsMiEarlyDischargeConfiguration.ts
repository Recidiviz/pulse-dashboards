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

export class UsMiEarlyDischargeConfiguration extends ApiOpportunityConfiguration {
  get nonOmsCriteria() {
    return [
      {
        text: "Must have completed all required programming and treatment",
      },
      {
        text: "Must have completed court-ordered restitution payments",
        tooltip:
          "The client has not willfully failed to pay restitution or crime victim assessment(s)",
      },
      {
        text: "Must have paid or made a good faith effort to pay restitution, fees, court costs, fines, and other monetary obligations",
        tooltip:
          "The client has not willfully failed to pay monetary obligations. Unless another standard is prescribed by the court, the Agent shall not regard the offender's failure to pay as willful if any of the following apply: 1. The client provides documentation of disability and has little or no income. 2. The client is on public assistance. 3. The client has been unemployed for the majority of the probation term despite earnest job-seeking efforts and has little or no income from any other source. 4. The client annual income is at or below the federal poverty guidelines (refer to the information at https://aspe.hhs.gov). 5. The client net income is above federal poverty guidelines but has been and remains insufficient to satisfy the terms of the obligations ordered. 6. The client has made earnest efforts to fulfill payment obligations, but the amount owed is such that complete payment within the scheduled probation term is unrealistic.",
      },
      { text: "Must have no pending felony charges or warrants" },
    ];
  }
}
