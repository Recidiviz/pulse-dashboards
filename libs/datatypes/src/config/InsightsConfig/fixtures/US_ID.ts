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

import { RawInsightsConfig } from "../schema";

const US_ID: RawInsightsConfig = {
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or below statewide rate",
  caseloadCategories: [
    { displayName: "Sex Offense Caseload", id: "SEX_OFFENSE" },
    { displayName: "General + Other Caseloads", id: "NOT_SEX_OFFENSE" },
  ],
  clientEvents: [],
  docLabel: "IDOC",
  exclusionReasonDescription:
    "We've excluded officers from this list who have particularly large or small average caseloads (larger than 175 or smaller than 10). We've also excluded officers who didn't have a caseload of at least 10 clients for at least 75% of the observation period. Lastly, we exclude P&P specialists, as events that occur while clients are assigned to them are attributed to the previous officer.",
  learnMoreUrl:
    "https://drive.google.com/file/d/1alpje96AHyWsRxKwtIPwQE7UYFS3Ob0h/view",
  metrics: [
    {
      bodyDisplayName: "incarceration rate",
      descriptionMarkdown:
        "The numerator represents the number of transitions to incarceration from supervision in the given time period, regardless of whether the final decision was a revocation or sanction admission. A client is considered to be in a period of incarceration if their location during that time is within a correctional facility or county jail, or if their supervision level at the time indicates an ICE detainer or federal custody. We exclude incarcerations for which the most serious violation was an absconsion, because we count absconsion violations separately, as outlined below. We associate violations with incarcerations by looking for the most severe violation between two years before and 14 days after the incarceration period started. Client location is pulled from the transfer records in Atlas.\n\n<br />\nThe denominator is the average daily caseload for the officer over the given time period. Clients on Unsupervised/Court Probation or clients who are supervised out of state with respect to an Interstate Compact are excluded from an officer's active caseload.",
      eventName: "incarcerations",
      eventNamePastTense: "were incarcerated",
      eventNameSingular: "incarceration",
      name: "incarceration_starts_most_severe_violation_type_not_absconsion",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have been incarcerated more than once under this officer in the time period.",
    },
    {
      bodyDisplayName: "absconsion rate",
      descriptionMarkdown:
        "The numerator represents the number of all reported absconsion violations in the given time period, which could include multiple absconsion violations for the same client. Absconsion violations are calculated based on the number of Violation Surveys entered into Atlas with “Absconding” selected as one of its violation types. The time period of each absconsion violation is determined using the date the Violation Survey was completed. If the absconsion violation is filed after the incarceration event, neither the violation nor the incarceration event will be included in our metrics.\n\n<br />\nThe denominator is the average daily caseload for the officer over the given time period. Clients on Unsupervised/Court Probation or clients who are supervised out of state with respect to an Interstate Compact are excluded from an officer's active caseload.",
      eventName: "absconsions",
      eventNamePastTense: "absconded",
      eventNameSingular: "absconsion",
      name: "violations_absconsion",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconsion Rate",
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have had more than one absconsion under this officer in the time period.",
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  officerHasNoOutlierMetricsLabel: "Nice! No outlying metrics this month.",
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "district director",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "officer",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  supervisorHasNoOutlierOfficersLabel:
    "Nice! No officers are outliers on any metrics this month.",
  worseThanRateLabel: "Far above the statewide rate",
};

export default US_ID;
