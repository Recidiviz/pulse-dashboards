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

import { StateSpecificPageCopy } from "../types";

const isPublicPathways = !!import.meta.env["VITE_PUBLIC_PATHWAYS_API_URL_BASE"];

const content: StateSpecificPageCopy = {
  prison: {
    title: "NYS DOCCS Population Under Custody",
    summary:
      "This dashboard shows data on individuals who are under custody of New York State DOCCS prison facilities. Data is uploaded from DOCCS's systems monthly.",
    sections: {
      countOverTime: isPublicPathways
        ? "Overview"
        : "Prison population over time",
      countByLocation: isPublicPathways
        ? "Facility"
        : "Prison population by facility",
      countByGender: isPublicPathways
        ? "Gender Identity"
        : "Prison population by gender identity",
      countByAgeGroup: isPublicPathways
        ? "Age Group"
        : "Prison population by age group",
      countByRace: isPublicPathways ? "Race" : "Prison population by race",
      countBySex: isPublicPathways ? "Sex" : "Prison population by sex",
      countByEthnicity: isPublicPathways
        ? "Ethnicity"
        : "Prison population by ethnic status",
      personLevelDetail: isPublicPathways
        ? "People"
        : "List of people in prison",
      countBySentenceLengthMin: isPublicPathways
        ? "Min Sentence"
        : "Prison population by min sentence",
      countBySentenceLengthMax: isPublicPathways
        ? "Max Sentence"
        : "Prison population by max sentence",
      countByChargeCountyCode: isPublicPathways
        ? "Conviction County"
        : "Prison population by conviction county",
      countByOffenseType: isPublicPathways
        ? "Offense Type"
        : "Prison population by offense type",
    },
    methodology:
      "This dashboard shows data on individuals who are admitted to New York State DOCCS prison facilities. Data is uploaded from DOCCS's systems monthly. \n- For more reports, please see: https://doccs.ny.gov/research-and-reports \n- For questions, please contact NYS DOCCS. \n",
  },
};

export default content;
