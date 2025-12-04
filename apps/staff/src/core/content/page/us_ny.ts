// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { StateSpecificPageCopy } from "../types";

const content: StateSpecificPageCopy = {
  prison: {
    summary:
      "This dashboard shows data on individuals who are admitted to New York State DOCCS prison facilities. Data is uploaded from DOCCS's systems monthly.",
    sections: {
      countOverTime: "Prison population over time",
      countByLocation: "Prison population by facility",
      countByRace: "Prison population by race",
      countByGender: "Prison population by gender identity",
      countByAgeGroup: "Prison population by age group",
      personLevelDetail: "List of people in prison",
    },
    methodology:
      "This dashboard shows data on individuals who are admitted to New York State DOCCS prison facilities. Data is uploaded from DOCCS's systems monthly. \n- For more reports, please see: https://doccs.ny.gov/research-and-reports \n- For questions, please contact NYS DOCCS. \n",
  },
};

export default content;
