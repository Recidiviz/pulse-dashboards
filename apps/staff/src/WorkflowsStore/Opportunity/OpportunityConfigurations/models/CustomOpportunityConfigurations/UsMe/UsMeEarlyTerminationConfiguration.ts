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

export class UsMeEarlyTerminationConfiguration extends ApiOpportunityConfiguration {
  get nonOMSCriteria() {
    return [
      {
        text: "Must have fulfilled all proactive conditions of probation",
        tooltip:
          "The Probation Officer shall determine whether the probationer has satisfactorily fulfilled all of the proactive conditions of his or her probation",
      },
      {
        text: "Must have not engaged in conduct prohibited by conditions of probation",
        tooltip:
          "The Probation Officer shall determine whether the probationer has not engaged in conduct prohibited by his or her conditions of probation and in the opinion of the supervising Probation Officer continuation on probation would not benefit the community (including the victim, if any) or the probationer",
      },
    ];
  }
}
