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

import React from "react";

import {
  CaseNoteTitle,
  DetailsHeading,
  DetailsSection,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsTnCommonlyUsedOverrideCodes({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const overrideCodes = {
    C1DEC: "Maximum to Close decrease",
    C2DEC: "Non-assaultive disciplinary",
    C3DEC: "Parole grant / SAIU / TCWC",
    C4DEC: "Medium to Minimum-R w/ detainer",
    C5DEC: "Revise sev. of offense scale",
    C6DEC: "Close to medium decrease",
    C7DEC: "Close to medium decrease",
  };

  const overrideCodesList = Object.entries(overrideCodes).map(
    ([key, value]) => (
      <SecureDetailsContent key={key}>
        <CaseNoteTitle>{key}: </CaseNoteTitle>
        {value}
      </SecureDetailsContent>
    )
  );

  return (
    <DetailsSection>
      <DetailsHeading>Commonly Used Override Codes</DetailsHeading>
      <SecureDetailsList>{overrideCodesList}</SecureDetailsList>
    </DetailsSection>
  );
}
