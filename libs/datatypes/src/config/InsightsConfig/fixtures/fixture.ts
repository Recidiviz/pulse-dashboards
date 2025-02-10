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

import dedent from "dedent";

import {
  ADVERSE_METRIC_IDS,
  CASELOAD_CATEGORY_IDS,
  FAVORABLE_METRIC_IDS,
  VITALS_METRIC_IDS,
} from "../../../metrics/utils/constants";
import { rawActionStrategyCopyFixture } from "../../ActionStrategyCopy/fixture";
import {
  InsightsConfig,
  insightsConfigSchema,
  RawInsightsConfig,
} from "../schema";
import { US_CA } from "./US_CA";
import { US_ID } from "./US_ID";
import { US_MI } from "./US_MI";
import { US_ND } from "./US_ND";
import { US_PA } from "./US_PA";
import { US_TN } from "./US_TN";

export const rawInsightsConfigFixture: RawInsightsConfig = {
  supervisionOfficerLabel: "officer",
  supervisionDistrictLabel: "unit",
  supervisionDistrictManagerLabel: "district manager",
  supervisionJiiLabel: "client",
  supervisorHasNoOutlierOfficersLabel:
    "Nice! No officers are outliers on any metrics this month.",
  officerHasNoOutlierMetricsLabel: "Nice! No outlying metrics this month.",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  officerHasNoEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "team",
  atOrBelowRateLabel: "At or below statewide rate",
  atOrAboveRateLabel: "At or above statewide rate",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  worseThanRateLabel: "Far worse than statewide rate",
  noneAreOutliersLabel: "are outliers",
  learnMoreUrl: "https://recidiviz.org",
  exclusionReasonDescription: dedent`We've excluded officers from this list with particularly large or small average caseloads (larger than 175 or smaller than 10). 
  We also excluded officers who didn’t have a caseload of at least 10 clients for at least 75% of the observation period.`,
  docLabel: "DOC",
  metrics: [
    {
      name: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      bodyDisplayName: "absconsion rate",
      titleDisplayName: "Absconsion Rate",
      eventName: "absconsions",
      eventNameSingular: "absconsion",
      eventNamePastTense: "were absconded",
      outcomeType: "ADVERSE",
      descriptionMarkdown: dedent`**All reported absconsions and warrants for the time period**, as captured in the data we receive by supervision levels "9AB", "ZAB", "ZAC", "ZAP" or supervision type “ABS” for absconsions, and “9WR", "NIA", "WRT", "ZWS" for warrants, in a given time period.
     
      <br />
      **Denominator** is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.`,
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have had more than one absconsion under this officer in the time period.",
    },
    {
      name: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      bodyDisplayName: "incarceration rate",
      titleDisplayName: "Incarceration Rate",
      eventName: "incarcerations",
      eventNameSingular: "incarceration",
      eventNamePastTense: "were incarcerated",
      outcomeType: "ADVERSE",
      descriptionMarkdown: dedent`“Incarcerations” include:
      * All transitions to incarceration (state prison or county jail) from supervision in the past 12 months, regardless of whether the final decision was a revocation or sanction admission
      * Transitions from probation to the Special Alternative for Incarceration (SAI)
      * Transitions from supervision to incarceration due to any “New Commitment” movement reasons in OMNI

      <br />
      “Incarcerations” does not include:
      * Absconsions and bench warrants`,
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have been incarcerated more than once under this officer in the time period.",
    },
    {
      name: ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      bodyDisplayName: "technical incarceration rate",
      titleDisplayName: "Technical Incarceration Rate",
      eventName: "technical incarcerations",
      eventNameSingular: "technical incarceration",
      eventNamePastTense:
        "were incarcerated with a technical violation as their most severe violation",
      outcomeType: "ADVERSE",
      descriptionMarkdown: dedent`“Technical Incarcerations” include:
      * All transitions to incarceration from supervision (regardless of whether the final decision was a revocation or sanction admission) where the movement reason in OMNI was “Technical” <br>
      * All transitions to incarceration from supervision (regardless of whether the final decision was a revocation or sanction admission) where the most serious violation type among all violations occurring within the past 24 months was a technical violation <br><br>
      
      <br />
      Note: There are situations where we are unable to associate an incarceration with a violation type, especially if the revocation leads to time in county jail. We may also associate an incorrect violation type, if for example, there are no violations due to poor data entry.`,
      topXPct: null,
      listTableText: null,
    },
    {
      name: FAVORABLE_METRIC_IDS.enum.treatment_starts,
      bodyDisplayName: "program/treatment start rate",
      titleDisplayName: "Program/Treament Start Rate",
      eventName: "program/treatment starts",
      eventNameSingular: "program start",
      eventNamePastTense: "program started",
      outcomeType: "FAVORABLE",
      descriptionMarkdown: dedent`**All reported program starts that exist in PVDTS**, as captured in the data we receive for all supervision levels except for CATEGORY D, DEPORTED and PENDING DEPORT, in a given time period.
      
      <br />
      **Denominator** is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.`,
      topXPct: 10,
      listTableText: null,
    },
  ],
  clientEvents: [
    {
      displayName: "Violations",
      name: "violations",
    },
    {
      displayName: "Sanctions",
      name: "violation_responses",
    },
  ],
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  caseloadCategories: [
    {
      id: CASELOAD_CATEGORY_IDS.enum.ALL,
      displayName: "General Or Other Caseloads",
    },
    {
      id: CASELOAD_CATEGORY_IDS.enum.SEX_OFFENSE,
      displayName: "Sex Offense Caseloads",
    },
  ],
  vitalsMetrics: [
    {
      metricId: VITALS_METRIC_IDS.enum.timely_contact,
      titleDisplayName: "Timely Contact",
    },
    {
      metricId: VITALS_METRIC_IDS.enum.timely_risk_assessment,
      titleDisplayName: "Timely Risk Assessment",
    },
  ],
  actionStrategyCopy: rawActionStrategyCopyFixture,
};

export const InsightsConfigFixture: InsightsConfig = insightsConfigSchema.parse(
  rawInsightsConfigFixture,
);

export const getMockConfigsByTenantId = (): Record<string, InsightsConfig> => ({
  US_CA,
  US_ID,
  US_MI,
  US_PA,
  US_ND,
  US_TN,
});
