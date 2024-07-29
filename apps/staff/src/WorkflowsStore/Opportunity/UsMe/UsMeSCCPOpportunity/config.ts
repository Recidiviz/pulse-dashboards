// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMeSCCPOpportunity } from "./UsMeSCCPOpportunity";

export const usMeSCCPConfig: OpportunityConfig<UsMeSCCPOpportunity> = {
  systemType: "INCARCERATION",
  stateCode: "US_ME",
  urlSection: "SCCP",
  label: "Supervised Community Confinement Program",
  initialHeader:
    "Search for case managers above to review residents in their unit who are approaching SCCP " +
    "eligibility and complete application paperwork.",
  dynamicEligibilityText:
    "resident[|s] may be eligible for the Supervised Community Confinement Program",
  callToAction:
    "Search for case managers above to review residents in their unit who are approaching " +
    "SCCP eligibility and complete application paperwork.",
  subheading:
    "SCCP provides a means of successful reentry of residents into the community. The program allows eligible residents to complete their sentence in the community rather than a facility, while remaining under the legal custody of the Department of Corrections. Review residents who are approaching SCCP eligibility and complete application paperwork.",
  firestoreCollection: "US_ME-SCCPReferrals",
  snooze: {
    defaultSnoozeDays: 30,
    maxSnoozeDays: 180,
  },
  denialReasons: {
    "CASE PLAN": "Not compliant with case plan goals",
    PROGRAM: "Has not completed required core programming",
    DISCIPLINE: "Has a Class A or B disciplinary violation pending",
    DECLINE: "Resident declined opportunity to apply for SCCP",
    OTHER_CORIS: "Other, please add a case note in CORIS",
  },
  methodologyUrl: "https://www.maine.gov/sos/cec/rules/03/201/c10s272.docx",
  sidebarComponents: ["Incarceration", "CaseNotes"],
  homepagePosition: 1,
};
