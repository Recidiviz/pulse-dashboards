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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import { CSSProperties, FC } from "react";
import styled from "styled-components/macro";

import { EligibilityStatus } from "../../models/EligibilityReport/interface";

const Chip = styled.div`
  ${typography.Sans14};

  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  border-radius: ${rem(spacing.xs)};
  border-style: solid;
  border-width: ${rem(1)};
`;

const statusStyles: Record<EligibilityStatus, CSSProperties> = {
  ELIGIBLE: {
    color: "#006908",
    backgroundColor: "#EFFFE5",
    borderColor: "#A6EB84",
  },
  ALMOST_ELIGIBLE: {
    color: "#A82C00",
    backgroundColor: "#FFF8DE",
    borderColor: "#FCD579",
  },
  INELIGIBLE: {
    color: palette.slate85,
    backgroundColor: rgba(palette.slate, 0.05),
    borderColor: palette.slate30,
  },
};

export const EligibilityStatusChip: FC<{
  value: EligibilityStatus;
  label: string;
}> = ({ value, label }) => {
  return <Chip style={statusStyles[value]}>{label}</Chip>;
};
