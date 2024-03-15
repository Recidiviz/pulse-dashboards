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
import simplur from "simplur";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsMiEarlyDischargeOpportunity } from "./UsMiEarlyDischargeOpportunity";

export const usMiEarlyDischargeConfig: OpportunityConfig<UsMiEarlyDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "earlyDischarge",
    label: "Early Discharge",
    hydratedHeader: (formattedCount) => ({
      eligibilityText: simplur`${formattedCount} client[|s] may be `,
      opportunityText: "eligible for early discharge",
      callToAction:
        "Review clients who may be eligible for early discharge and complete discharge paperwork in COMS.",
    }),
    firestoreCollection: "US_MI-earlyDischargeReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    eligibilityDateText: "Earliest Eligibility Date for Early Discharge",
    sidebarComponents: [
      "UsMiEarlyDischargeIcDetails",
      "ClientProfileDetails",
      "EligibilityDate",
    ],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    denialReasons: {
      "CHILD ABUSE ORDER":
        "CHILD ABUSE ORDER: Child abuse prevention order filed during supervision period",
      "SUSPECTED OFFENSE":
        "SUSPECTED OFFENSE: Suspected of a felony, assaultive misdemeanor, OWI, or offense requiring SORA registration",
      "FELONY/STATE PROBATION":
        "FELONY/STATE PROBATION: On parole and also on other state or federal probation supervision for an offense committed during the current period",
      NEEDS:
        "NEEDS: On parole and all criminogenic needs have not been addressed",
      NONCOMPLIANT: "NONCOMPLIANT: Not compliant with the order of supervision",
      PROGRAMMING: "PROGRAMMING: Has not completed all required programming",
      "PRO-SOCIAL": "PRO-SOCIAL: Has not demonstrated pro-social behavior",
      RESTITUTION:
        "RESTITUTION: Has not completed court-ordered restitution payments",
      "FINES & FEES":
        "FINES & FEES: Willful nonpayment of restitution, fees, court costs, fines, and other monetary obligations despite clear ability to pay",
      "PENDING CHARGES": "PENDING CHARGES: Pending felony charges/warrant",
      "ORDERED TREATMENT":
        "ORDERED TREATMENT: Has not completed all required treatment",
      "EXCLUDED OFFENSE":
        "EXCLUDED OFFENSE: On parole for an offense resulting in death or serious bodily injury or an offense involving the discharge of a firearm",
      JUDGE: "JUDGE: County Judge declined client for consideration",
      Other: "Other: please specify a reason",
    },
    eligibleCriteriaCopy: {
      supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
        text: 'Completed at least half of {{#if eq record.metadata.supervisionType "Parole"}}parole{{else}}probation{{/if}} term',
        tooltip:
          '{{#if eq record.metadata.supervisionType "Parole"}}A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more{{else}}An offender may be considered for discharge prior to the expiration of the original term of probation if they have completed at least one-half of the probation term{{/if}}',
      },
      servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: {
        text: "Serving a parole term of 12 months or more",
        tooltip:
          "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more",
      },
      usMiParoleDualSupervisionPastEarlyDischargeDate: {
        text: "Served mandatory period of parole",
        tooltip:
          "The parolee has served any mandatory period of parole as set forth in Paragraph F. ",
      },
      usMiNoActivePpo: {
        text: 'No active PPO ordered during the {{#if eq record.metadata.supervisionType "Parole"}}parole{{else}}probation{{/if}} term',
        tooltip:
          'The {{#if eq record.metadata.supervisionType "Parole"}}parolee{{else}}offender{{/if}} does not have an active PPO […] that was ordered against him/her during the {{#if eq record.metadata.supervisionType "Parole"}}parole{{else}}probation{{/if}} term.',
      },
      usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
        text: 'Not involved in a felony, assaultive misdemeanor, or offense requiring SORA registration while on {{#if eq record.metadata.supervisionType "Parole"}}parole{{else}}probation{{/if}}',
        tooltip:
          '{{#if eq record.metadata.supervisionType "Parole"}}The parolee is not known to have been involved in […] felonious behavior, assaultive misdemeanor behavior (as set forth in Attachment A) […] or an offense that requires registration under the Sex Offender Registration Act while on parole.{{else}}The offender is not known to have been involved in […] felonious behavior or assaultive misdemeanor behavior as set forth in Attachment A “OP 06.01.145B Assaultive Misdemeanor List” which occurred while on probation or any offense that requires registration under the Sex Offender Registration Act (SORA), which occurred while on probation.{{/if}}',
      },
      usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
        {
          text: "Not serving for an offense excluded from early discharge eligibility by policy.",
          tooltip:
            "The parolee is not serving for an offense […] required to be registered under the Sex Offender Registration Act.",
        },
      usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision:
        {
          text: "Not serving for an offense excluded from early discharge eligibility by policy.",
          tooltip:
            "The offender is not currently serving for an offense that requires a mandatory term of probation as identified in Paragraph H. The offender is not currently serving for MCL 750.81 or MCL 750.84 (Assault with Intent to commit Great Bodily Harm Less than Murder).",
        },
      usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai: {
        text: "Not paroled from SAI on current term",
        tooltip:
          "The parolee was not paroled from the Special Alternative Incarceration (SAI) program on the current term (see definition).",
      },
      supervisionOrSupervisionOutOfStateLevelIsNotHigh: {
        text: "Not on intensive supervision",
      },
      usMiNoOwiViolationOnParoleDualSupervision: {
        text: "Not involved in an OWI offense while on parole.",
        tooltip:
          "The parolee is not known to have been involved in […] a violation of MCL 257.625 (OWI) […] while on parole.",
      },
      usMiNoPendingDetainer: {
        text: "No pending detainers",
      },
    },
  };
