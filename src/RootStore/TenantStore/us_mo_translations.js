// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
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

// Note: Each time you add a translation you will need to restart your dev
// server before you will see the translation rendered properly

export default {
  District: "District",
  officer: "officer",
  Officer: "Officer",
  gender: "gender",
  Gender: "Gender",
  violationReports: "violation reports and notices of citation",
  revocationsByDistrictChartTitle: "Admissions by district",
  revocationsOverTimeXAxis: "Number of admissions per month",
  revoked: "revoked",
  Revocation: "Revocation",
  revocations: "revocations",
  revocation: "revocation",
  Revocations: "Revocations",
  percentOfPopulationRevoked: "Percent of standing population revoked",
  matrixExplanationP1: `This chart plots all people who were revoked to prison
during the selected time period, according to their most serious violation
and the total number of violation reports and notices of citation that
were filed within one year prior to the last reported violation before
the person was revoked. (See methodology for more details.)`,
  matrixExplanationP2: `The numbers inside the bubbles represent the number of
people who were revoked, whose most serious violation matches the violation at
the head of that row, and who have the number of prior violations at the head
of that column.`,
  Technical: "Technical",
  lastRecommendation: "Last Rec. (Incl. Supplementals)",
  riskLevelsMap: {
    OVERALL: "Overall",
    NOT_ASSESSED: "No Score",
    LOW: "Low Risk",
    MEDIUM: "Moderate Risk",
    HIGH: "High Risk",
    VERY_HIGH: "Very High Risk",
  },
  populationChartAttributes: {
    REVOKED: "Admitted Population",
    SUPERVISION_POPULATION: "Supervision Population",
    STATE_POPULATION: "Missouri Population",
  },
  raceLabelMap: {
    WHITE: "Caucasian",
    BLACK: "African American",
    HISPANIC: "Hispanic",
    ASIAN: "Asian",
    AMERICAN_INDIAN_ALASKAN_NATIVE: "Native American",
  },
  violationTypes: [
    "TECHNICAL",
    "SUBSTANCE_ABUSE",
    "MUNICIPAL",
    "ABSCONDED",
    "MISDEMEANOR",
    "FELONY",
  ],
  violationsBySeverity: [
    "fel",
    "misd",
    "law_cit",
    "esc",
    "absc",
    "muni",
    "subs",
    "tech",
  ],
};
