// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { isEqual } from "date-fns";

import { Client } from "../../../PracticesStore/Client";
import { formatDate } from "../../../utils";
import { formatRelativeToNow } from "../../utils/timePeriod";

export function getEligibilityCriteria(
  client: Client
): { text: string; tooltip?: string }[] {
  if (!client.compliantReportingEligible) return [];

  const {
    supervisionLevel,
    supervisionLevelStart,
    compliantReportingEligible: {
      eligibleLevelStart,
      sanctionsPastYear,
      drugScreensPastYear,
      currentOffenses,
      lifetimeOffensesExpired,
      mostRecentArrestCheck,
    },
    nextSpecialConditionsCheck,
  } = client;

  // current level by default
  let requiredSupervisionLevel = `${supervisionLevel.toLowerCase()} supervision`;
  // if eligible start is not the same as current level start,
  // this indicates they moved up or down a level but qualify under medium
  if (
    supervisionLevelStart &&
    !isEqual(supervisionLevelStart, eligibleLevelStart)
  ) {
    requiredSupervisionLevel = "medium supervision or less";
  }

  return [
    {
      text: `Current supervision level: ${supervisionLevel}`,
      tooltip:
        "Policy requirement: Currently on medium or minimum supervision.",
    },
    {
      text: `Time on ${requiredSupervisionLevel}: ${formatRelativeToNow(
        eligibleLevelStart
      )}`,
      tooltip: `Policy requirement: On minimum supervision level for 1 year 
        or medium level for 18 months.`,
    },
    {
      text: `Arrests: ${
        mostRecentArrestCheck
          ? ` Last ARRN on ${formatDate(mostRecentArrestCheck)}`
          : "N/A"
      }`,
      tooltip: "Policy requirement: No arrest in the last 1 year",
    },
    {
      text: `Sanctions in the past year: ${
        sanctionsPastYear.map((s) => s.type).join(", ") || "None"
      }`,
      tooltip:
        "Policy requirement: No sanctions higher than Level 1 in the last 1 year.",
    },
    {
      text: `Fees payments: Balance less than $500 or “permanent” exception`,
    },
    {
      text: `Negative drug screens in last 12 months: ${
        drugScreensPastYear
          .map(({ result, date }) => `${result} – ${formatDate(date)}`)
          .join(", ") || "None"
      }`,
      tooltip: `Policy requirement: Passed drug screen in the last 12 months for non drug offenders. 
        Passed 2 drug screens in last 12 months for drug offenders, most recent is negative.`,
    },
    {
      text: `Special conditions: SPE not overdue (${
        nextSpecialConditionsCheck ? "" : "No "
      }SPE note due${
        nextSpecialConditionsCheck
          ? ` ${formatDate(nextSpecialConditionsCheck)}`
          : ""
      })`,
      tooltip: "Policy requirement: Special conditions are current.",
    },
    {
      text:
        "Reporting requirements: No DECF, DEDF, DEDU, DEIO, DEIR codes in the last 3 months",
      tooltip: `Policy requirement: Has reported as instructed without incident unless excused
        and documented by the officer.`,
    },
    {
      text: `Current offense${currentOffenses.length !== 1 ? "s" : ""}: ${
        currentOffenses.join("; ") || "None"
      }`,
      tooltip: `Policy requirement: Offense type not domestic abuse or sexual assault, 
        DUI in past 5 years, not crime against person that resulted in physical bodily harm, 
        not crime where victim was under 18.`,
    },
    {
      text: `Lifetime offense${
        lifetimeOffensesExpired.length !== 1 ? "s" : ""
      } expired 10+ years ago: ${lifetimeOffensesExpired.join("; ") || "None"}`,
      tooltip: `Policy requirement: If the offender has a previous conviction for one of
        the crimes listed in Section VI.(A)(3) but is not currently on supervision for one
        of those crimes, then the  DD shall make a case by case determination as to whether
        an offender is suitable for CR. The DD review process is waived if the expiration date
        is more than ten years old.`,
    },
  ];
}
