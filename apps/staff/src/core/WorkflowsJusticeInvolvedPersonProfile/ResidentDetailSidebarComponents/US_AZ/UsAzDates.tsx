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

import { Icon, palette, Sans14, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { UsAzResidentMetadata } from "../../../../FirestoreStore";
import { optionalFieldToDate } from "../../../../WorkflowsStore/utils";
import { DateInfo, DatesTable } from "../../DatesTable";
import { DetailsHeading, DetailsSection } from "../../styles";
import { ResidentProfileProps } from "../../types";

const DateCalculationInfo = styled(Sans14)`
  color: ${palette.slate70};
  &:hover {
    color: ${palette.slate};
  }
`;

const DateMethodologyText = styled(Sans14)`
  display: inline;

  border-bottom: 1px dashed ${palette.pine3};
  padding-bottom: ${rem(spacing.xxs)};
`;

export function metadataToDates(
  metadata: UsAzResidentMetadata,
  useDtp: boolean,
  inTableTooltip: string,
): DateInfo[] {
  const hasAcisDates = useDtp ? !!metadata.acisDtpDate : !!metadata.acisTprDate;

  // Show all dates (TPR/DTP, CSBD, ERCD) if we have a date from ACIS
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
    ...acisDate,
    { label: "CSBD / TR to ADD", date: optionalFieldToDate(metadata.csbdDate) },
    { label: "ERCD", date: optionalFieldToDate(metadata.ercdDate) },
  ];

  // If we don't have a date from ACIS, only show the projected TPR/DTP date
  const projectedDates = useDtp
    ? [
        {
          label: "Projected DTP",
          date: optionalFieldToDate(metadata.projectedDtpDate),
          tooltip: inTableTooltip,
          highlight: true,
        },
      ]
    : [
        {
          label: "Projected TPR",
          date: optionalFieldToDate(metadata.projectedTprDate),
          tooltip: inTableTooltip,
          highlight: true,
        },
      ];

  return [
    ...(hasAcisDates ? realDates : projectedDates),
    { label: "SED", date: optionalFieldToDate(metadata.sedDate) },
    { label: "CSED", date: optionalFieldToDate(metadata.csedDate) },
  ];
}

export function UsAzDates({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { metadata } = resident;

  if (metadata.stateCode !== "US_AZ") return null;

  // Only show a DTP date for people with a DTP opportunity; by default show TPR
  const useDtp = Boolean(
    resident.flattenedOpportunities.find(
      (opp) =>
        opp.type === "usAzReleaseToDTP" || opp.type === "usAzOverdueForACISDTP",
    ),
  );

  const inTableTooltip =
    "In cases where Time Comp has not yet assigned a date for STP or DTP release, Recidiviz uses ADCRR policy to project the release date. We include this projected date here to help CO IIIs prioritize home plans and other release planning. Time Comp will make the final determination on release date once all transition release criteria have been met. As such, this date should not be shared with inmates.  For more details on how Recidiviz projects release dates, please click on “How are these dates calculated?” below.";

  const dates = metadataToDates(metadata, useDtp, inTableTooltip);
  const hasAcisDates = useDtp ? !!metadata.acisDtpDate : !!metadata.acisTprDate;

  return (
    <DetailsSection>
      <DetailsHeading>Dates to Keep Track of</DetailsHeading>

      <DatesTable dates={dates} highlightPastDates />

      {!hasAcisDates && (
        <Link
          to={
            "https://drive.google.com/file/d/13sj_5uRGKNEw1J9O-E3h-ohivKyv2k2k/view"
          }
          target="_blank"
        >
          <DateCalculationInfo>
            <DateMethodologyText>
              {"How are these dates calculated? "}
            </DateMethodologyText>
            <Icon kind="Info" size={12} />
          </DateCalculationInfo>
        </Link>
      )}
    </DetailsSection>
  );
}
