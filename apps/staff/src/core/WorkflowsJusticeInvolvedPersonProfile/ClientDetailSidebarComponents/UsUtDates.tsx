// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { add } from "date-fns";

import { fractionalDateBetweenTwoDates } from "../../../WorkflowsStore/utils";
import { DatesTable } from "../DatesTable";
import { DetailsHeading, DetailsSection } from "../styles";
import { ClientProfileProps } from "../types";

export function UsUtDates({
  client,
}: ClientProfileProps): React.ReactElement | null {
  if (client.stateCode !== "US_UT") return null;

  const startDate = client.supervisionStartDate;
  const endDate = client.expirationDate;
  const halfTime = fractionalDateBetweenTwoDates(startDate, endDate, 0.5);
  const reportDue = halfTime ? add(halfTime, { days: -30 }) : undefined;
  const finalReportDue = endDate ? add(endDate, { days: -30 }) : undefined;

  // If the report due date was in the past, we only show that date for people who are
  // Eligible for ET, not Almost Eligible or ineligible
  const earlyTermOpp = client.opportunities.usUtEarlyTermination;
  const isEligibleForET =
    !!earlyTermOpp &&
    earlyTermOpp.length === 1 &&
    earlyTermOpp[0].record.isEligible;
  const reportDueInFuture = reportDue && reportDue >= new Date();
  const displayReportDueDate = isEligibleForET || reportDueInFuture;
  const optionalReportDueDate = displayReportDueDate
    ? [
        {
          label: "ET Report Due",
          date: reportDue,
          tooltip:
            "Early Termination report due date, equivalent to 30 days before the client's half-time date",
        },
      ]
    : [];

  const dates = [
    { label: "Start", date: startDate },
    ...optionalReportDueDate,
    {
      label: "ET Review",
      date: halfTime,
      tooltip:
        "Early Termination review date, equivalent to the client's half-time date",
    },
    {
      label: "Final Report Due",
      date: finalReportDue,
      tooltip:
        "Equivalent to 30 days before the client's scheduled termination date",
    },
    { label: "Scheduled Termination", date: endDate },
  ];

  return (
    <DetailsSection>
      <DetailsHeading>Supervision Dates</DetailsHeading>
      <DatesTable dates={dates} highlightPastDates={false} />
    </DetailsSection>
  );
}
