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

import React from "react";

import { DateInfo, DatesTable } from "../../DatesTable";
import { DetailsHeading, DetailsSection } from "../../styles";
import { ResidentProfileProps } from "../../types";

const UsMoResidentDates: React.FC<ResidentProfileProps> = ({ resident }) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_MO") return null;

  const dates: DateInfo[] = [
    {
      label: "Conditional Release",
      date: metadata.conditionalReleaseDate,
    },
    {
      label: "Presumptive Parole",
      date: metadata.presumptiveParoleDate,
    },
    {
      label: "Max Release Date",
      date: metadata.maximumReleaseDate ?? undefined,
    },
  ];

  return (
    <DetailsSection>
      <DetailsHeading>Release Dates</DetailsHeading>
      <DatesTable dates={dates} highlightPastDates={false} />
    </DetailsSection>
  );
};

export default UsMoResidentDates;
