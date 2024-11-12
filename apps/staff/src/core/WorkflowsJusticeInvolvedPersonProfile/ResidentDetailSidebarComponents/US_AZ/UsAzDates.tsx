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

import {
  Icon,
  palette,
  Sans14,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { formatDueDateFromToday, formatWorkflowsDate } from "../../../../utils";
import { optionalFieldToDate } from "../../../../WorkflowsStore/utils";
import { InfoButton } from "../../InfoButton";
import {
  DetailsHeading,
  DetailsSection,
  InfoTooltipWrapper,
} from "../../styles";
import { ResidentProfileProps } from "../../types";

const DateTable = styled.table`
  ${typography.Sans14};
  color: ${palette.slate80};
  border-spacing: 0;
  border-collapse: separate;
  margin: ${rem(spacing.md)} 0;
  width: 100%;
`;

const DateTableCell = styled.td`
  border: 1px ${palette.slate20};

  border-top-style: solid;
  border-left-style: solid;
  padding: ${rem(spacing.sm)};
`;

const ShadedDateTableCell = styled(DateTableCell)`
  background-color: ${palette.marble3};
  white-space: nowrap;
`;

const DateTableRow = styled.tr`
  /* last column: right border */
  & ${DateTableCell}:last-child {
    border-right-style: solid;
  }

  /* first row: round corners */
  &:first-child {
    & ${DateTableCell} {
      &:first-child {
        border-top-left-radius: 4px;
      }
      &:last-child {
        border-top-right-radius: 4px;
        border-right-style: solid;
      }
    }
  }

  /* last row: bottom border, round corners */
  &:last-child {
    & ${DateTableCell} {
      border-bottom-style: solid;

      &:first-child {
        border-bottom-left-radius: 4px;
      }
      &:last-child {
        border-bottom-right-radius: 4px;
      }
    }
  }
`;

const DateCalculationInfo = styled(Sans14)`
  color: ${palette.slate70};
`;

const DateExplainer = styled(Sans14)<{ $datePast: boolean }>`
  display: inline-block;
  color: ${(props) =>
    props.$datePast ? palette.signal.error : palette.slate60};
`;

const DateMethodologyText = styled(Sans14)`
  display: inline;

  color: ${palette.slate70};
  &:hover {
    color: ${palette.slate};
  }

  border-bottom: 1px dashed ${palette.pine3};
  padding-bottom: ${rem(spacing.xxs)};
`;

type DateInfo = {
  label: string;
  date?: Date;
  tooltip?: string;
};

export function UsAzDates({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { metadata } = resident;

  if (metadata.stateCode !== "US_AZ") return null;

  const inTableTooltip =
    "In cases where Time Comp has not yet assigned a date for STP or DTP release, Recidiviz uses ADCRR policy to project the release date. We include this projected date here to help CO IIIs prioritize home plans and other release planning. Time Comp will make the final determination on release date once all transition release criteria have been met. As such, this date should not be shared with inmates.  For more details on how Recidiviz projects release dates, please click on “How are these dates calculated?” below.";

  // Only show a DTP date for people with a DTP opportunity; by default show TPR
  const useDtp = resident.flattenedOpportunities.find(
    (opp) =>
      opp.type === "usAzReleaseToDTP" || opp.type === "usAzOverdueForACISDTP",
  );
  const hasAcisDates = useDtp ? !!metadata.acisDtpDate : !!metadata.acisTprDate;

  // Show all dates (ERCD, CSBD, TPR/DTP) if we have a date from ACIS
  const acisDate = useDtp
    ? [
        {
          label: "DTP",
          date: optionalFieldToDate(metadata.acisDtpDate),
        },
      ]
    : [
        {
          label: "TPR",
          date: optionalFieldToDate(metadata.acisTprDate),
        },
      ];

  const realDates = [
    { label: "ERCD", date: optionalFieldToDate(metadata.ercdDate) },
    { label: "CSBD", date: optionalFieldToDate(metadata.csbdDate) },
    ...acisDate,
  ];

  // If we don't have a date from ACIS, only show the projected TPR/DTP date
  const projectedDates = useDtp
    ? [
        {
          label: "Projected DTP",
          date: optionalFieldToDate(metadata.projectedDtpDate),
          tooltip: inTableTooltip,
        },
      ]
    : [
        {
          label: "Projected TPR",
          date: optionalFieldToDate(metadata.projectedTprDate),
          tooltip: inTableTooltip,
        },
      ];

  const dates: DateInfo[] = [
    { label: "SED", date: optionalFieldToDate(metadata.sedDate) },
    ...(hasAcisDates ? realDates : projectedDates),
  ];

  const today = new Date();

  return (
    <DetailsSection>
      <DetailsHeading>Dates to Keep Track of</DetailsHeading>

      <DateTable>
        <tbody>
          {dates.map(({ label, date, tooltip }) => (
            <DateTableRow key={label}>
              <ShadedDateTableCell>
                {label}
                {tooltip && (
                  <>
                    {" "}
                    <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                      <InfoButton infoUrl={undefined} />
                    </InfoTooltipWrapper>
                  </>
                )}
              </ShadedDateTableCell>
              <DateTableCell>
                {formatWorkflowsDate(date)}
                {date && (
                  <>
                    {" "}
                    <DateExplainer $datePast={new Date(date) < today}>
                      {`(${formatDueDateFromToday(new Date(date))})`}
                    </DateExplainer>
                  </>
                )}
              </DateTableCell>
            </DateTableRow>
          ))}
        </tbody>
      </DateTable>

      <DateCalculationInfo>
        <Link
          to={
            "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view"
          }
          target="_blank"
        >
          <DateMethodologyText>
            {"How are these dates calculated? "}
            <Icon kind="Info" size={12} />
          </DateMethodologyText>
        </Link>
      </DateCalculationInfo>
    </DetailsSection>
  );
}
