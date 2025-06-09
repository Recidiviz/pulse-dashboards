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

import { Sans14 } from "@recidiviz/design-system";
import { add } from "date-fns";
import pluralize from "pluralize";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { fractionalDateBetweenTwoDates } from "../../../WorkflowsStore/utils";
import { DateInfo, DatesTable } from "../DatesTable";
import { DetailsHeading, DetailsSection } from "../styles";
import { ClientProfileProps } from "../types";

type OptionalDateInfo = DateInfo & {
  shouldDisplay: boolean;
};

const TableHeading = styled(Sans14)`
  color: ${palette.slate80};
`;

// TODO(#8691) Add tests for this function
function utDates({
  startDate,
  endDate,
  isEligibleForET,
}: {
  startDate?: Date;
  endDate?: Date;
  isEligibleForET: boolean;
}): DateInfo[] {
  // In case the data has issues, don't try to calculate dates based on a wrong order
  if (endDate && startDate && endDate < startDate) {
    endDate = undefined;
  }

  const halfTime = fractionalDateBetweenTwoDates(startDate, endDate, 0.5);
  const reportDue = halfTime ? add(halfTime, { days: -30 }) : undefined;
  const finalReportDue = endDate ? add(endDate, { days: -30 }) : undefined;

  // If the report due date was in the past, we only show that date for people who are
  // Eligible for ET, not Almost Eligible or ineligible
  const reportDueInFuture = reportDue && reportDue >= new Date();
  const displayReportDueDate =
    reportDue && (isEligibleForET || reportDueInFuture);

  const optionalDates: OptionalDateInfo[] = [
    { shouldDisplay: true, label: "Start", date: startDate },
    {
      shouldDisplay: !!displayReportDueDate,
      label: "Early Term Report Due",
      date: reportDue,
      tooltip:
        "Equivalent to 30 days before the client's half-time date for this sentence",
    },
    {
      shouldDisplay: !!halfTime,
      label: "Early Term Review",
      date: halfTime,
      tooltip: "Equivalent to the client's half-time date for this sentence",
    },
    {
      shouldDisplay: !!finalReportDue,
      label: "Final Report Due",
      date: finalReportDue,
      tooltip:
        "Equivalent to 30 days before the client's scheduled termination date for this sentence",
    },
    { shouldDisplay: true, label: "Scheduled Termination", date: endDate },
  ];

  return optionalDates
    .filter(({ shouldDisplay }) => shouldDisplay)
    .map(({ shouldDisplay, ...rest }) => rest);
}

export function UsUtDates({
  client,
}: ClientProfileProps): React.ReactElement | null {
  const { metadata, supervisionStartDate } = client;

  if (metadata.stateCode !== "US_UT") return null;

  const earlyTermOpp = client.opportunities.usUtEarlyTermination;
  const isEligibleForET =
    earlyTermOpp?.length === 1 && earlyTermOpp[0].record.isEligible;

  // Fallback in case we don't have any dates to display
  if (metadata.sentences.length === 0) {
    const dates = utDates({
      startDate: supervisionStartDate,
      endDate: client.expirationDate,
      isEligibleForET,
    });
    return (
      <DetailsSection>
        <DetailsHeading>Supervision Dates</DetailsHeading>
        <dd>
          <DatesTable dates={dates} highlightPastDates={false} />
        </dd>
      </DetailsSection>
    );
  }

  // Show one table of dates per sentence
  return (
    <DetailsSection>
      <DetailsHeading>Supervision Dates</DetailsHeading>
      <dd>
        {metadata.sentences.map(
          ({ courtCaseNumber, projectedCompletionDate, statutes }) => {
            const dates = utDates({
              startDate: supervisionStartDate,
              endDate: projectedCompletionDate,
              isEligibleForET,
            });

            return (
              <>
                <TableHeading className="fs-exclude">
                  Court Case #{courtCaseNumber}:{" "}
                  {pluralize("Statute", statutes.length)} {statutes.join(", ")}
                </TableHeading>
                <DatesTable dates={dates} highlightPastDates={false} />
              </>
            );
          },
        )}
      </dd>
    </DetailsSection>
  );
}
