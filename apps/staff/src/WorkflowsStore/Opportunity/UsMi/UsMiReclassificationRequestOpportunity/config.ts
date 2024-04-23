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

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { usMiReclassificationRequestOpportunity } from "./UsMiReclassificationRequestOpportunity";

export const usMiReclassificationRequestConfig: OpportunityConfig<usMiReclassificationRequestOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_MI",
    urlSection: "reclassificationRequest",
    label: "Reclassification to General Population",
    initialHeader:
      "Return residents eligible for reclassification to general population.",
    dynamicEligibilityText:
      "resident[|s] in temporary segregation or detention [is|are] eligible for reclassification to general population",
    callToAction:
      "Return residents eligible for reclassification to general population",
    firestoreCollection: "US_MI-reclassificationRequest",
    denialReasons: {
      ALJ: "Administrative Law Judge found reasonable cause for delay at a hearing conducted on a Class I misconduct violation or on proposed placement in administrative segregation",
      "HIGHER SECURITY":
        "Classified to ad seg or higher security level but awaiting transfer to a facility with such housing [LOS should not exceed 30 days]",
      TRANSFER:
        "Awaiting transfer to a facility that can meet protection or physical/mental health needs",
      PREA: "Part of a PREA investigation",
      DETENTION:
        "Awaiting transfer to a facility with detention cells to serve a sanction",
      MEDICAL: "Medically quarantined, no single cells available",
      PAROLEE: "Parolee at DRC awaiting parole revocation hearings",
      Other: "Other, please specify a reason",
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    sidebarComponents: ["Incarceration"],
    eligibleCriteriaCopy: {
      usMiEligibleForReclassificationFromSolitaryToGeneral: {
        text: `{{#if (eq record.metadata.solitaryConfinementType "DISCIPLINARY_SOLITARY_CONFINEMENT")}}Length of stay in detention {{record.metadata.daysInSolitary}} days, {{daysPast sanctionExpirationDate}} days beyond original detention sanction{{else}}Length of stay in temporary segregation {{record.metadata.daysInSolitary}} days, exceeding 30-day policy requirement{{/if}}`,
        tooltip: `{{#if (eq record.metadata.solitaryConfinementType "DISCIPLINARY_SOLITARY_CONFINEMENT")}}A prisoner shall not remain on detention status for longer than the period of time ordered by the ALJ{{else}}Wardens shall ensure that prisoners are not confined in temporary segregation for more than seven business days except under the circumstances listed in 1-7 below{{/if}}`,
      },
    },
    ineligibleCriteriaCopy: {
      usMiEligibleForReclassificationFromSolitaryToGeneral: {
        text: "Length of stay in temporary segregation {{record.metadata.daysInSolitary}} days, exceeding 7-day policy requirement",
        tooltip:
          "Wardens shall ensure that prisoners are not confined in temporary segregation for more than seven business days except under the circumstances listed in 1-7 below",
      },
    },
  };
