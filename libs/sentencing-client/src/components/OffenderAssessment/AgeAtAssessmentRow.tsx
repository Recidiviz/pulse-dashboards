// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { palette } from "~design-system";

import * as DomainCardStyled from "./DomainCard.styles";
import { Chip } from "./RiskScoreChip.styles";
import { AGE_POINT_MAX } from "./utils";

interface AgeAtAssessmentRowProps {
  ageLevel: number;
  note: string;
}

/** Shows the ORAS-SRT age point that counts toward the Criminal History score. */
export const AgeAtAssessmentRow: React.FC<AgeAtAssessmentRowProps> = ({
  ageLevel,
  note,
}) => (
  <DomainCardStyled.HeaderRow>
    <DomainCardStyled.DomainEntryLabel>
      <DomainCardStyled.Title as="h4">Age at Assessment</DomainCardStyled.Title>
      <DomainCardStyled.HelperText>{note}</DomainCardStyled.HelperText>
    </DomainCardStyled.DomainEntryLabel>
    <Chip color={palette.slate10}>
      {ageLevel}/{AGE_POINT_MAX}
    </Chip>
  </DomainCardStyled.HeaderRow>
);
