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

const content: StateSpecificPageCopy = {
  prison: {
    title: "Population Under Custody",
    summary:
      "Individuals who are under custody of New York State DOCCS prison facilities. Data is uploaded from DOCCS's systems monthly.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "Facility",
      countByRace: "Race",
      countByGender: "Gender Identity",
      countBySex: "Sex",
      countByAgeGroup: "Age",
      personLevelDetail: "People",
      countByEthnicity: "Ethnicity",
      countBySentenceLengthMin: "Min Sentence",
      countBySentenceLengthMax: "Max Sentence",
      countByChargeCountyCode: "Conviction County",
      countByOffenseType: "Crime group",
      countByAdmissionReason: "Admission type",
      countByChargeDescription: "Specific crime",
      countByReligion: "Religion",
      countByMaritalStatus: "Marital Status",
      countByTimeAtFacility: "Time at Facility",
    },
    methodology:
      "This dashboard shows data on individuals who are under the custody of New York State Department of Corrections and Community Supervision (DOCCS) at a point in time. First of the month snapshot data is uploaded from DOCCS's systems monthly.\n\nFor more reports on DOCCS's population, please see: https://doccs.ny.gov/research-and-reports \n\n<br/>\n<strong>Notes:</strong>\n- Please note that data labeled May 1, 2024 was actually generated May 4, 2024.\n- Individuals labeled with \"Not Coded\" for some dimensions (such as offense type) are primarily individuals who are newly admitted to the Department's custody and haven't yet had all information entered on the computer system. Those are generally resolved within 1 month.\n- If the label at the top of a chart is listing out all of the individual facilities instead of\n\"Facilities: ALL\", click on Reset Filters from the Filter menu.\n- Clicking Download exports the currently displayed chart as a CSV with your active filters\napplied. For example, if you're viewing 'Population By Facility' with one facility selected, the\nCSV will contain data for that facility only.",
  },
};

export default content;
