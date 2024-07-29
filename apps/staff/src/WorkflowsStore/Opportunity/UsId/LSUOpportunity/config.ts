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
import { LSUOpportunity } from "./LSUOpportunity";

export const usIdLSUConfig: OpportunityConfig<LSUOpportunity> = {
  systemType: "SUPERVISION",
  stateCode: "US_ID",
  urlSection: "LSU",
  label: "Limited Supervision Unit",
  dynamicEligibilityText:
    "client[|s] may be eligible for the Limited Supervision Unit",
  callToAction: `Review clients who may be eligible for LSU and complete a pre-filled transfer chrono.`,
  subheading:
    "The Limited Supervision Unit is the lowest level of supervision available in Idaho. LSU offers web-based reporting to low-risk clients.",
  firestoreCollection: "US_ID-LSUReferrals",
  snooze: {
    defaultSnoozeDays: 30,
    maxSnoozeDays: 90,
  },
  methodologyUrl:
    "http://forms.idoc.idaho.gov/WebLink/0/edoc/273717/Limited%20Supervision%20Unit.pdf",
  denialReasons: {
    SCNC: "SCNC: Not compliant with all court-ordered conditions and special conditions",
    FFR: "FFR: Failure to make payments toward fines, fees, and restitution despite ability to pay",
    "NCO/CPO": "NCO/CPO: Has an active NCO, CPO, or restraining order",
    INTERLOCK: "INTERLOCK: Has an active interlock device",
    MIS: "Has had a violent misdemeanor conviction in the past 12 months",
    Other: "Other, please specify a reason",
  },
  sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
  tooltipEligibilityText: "Eligible for transfer to LSU",
  homepagePosition: 3,
};
