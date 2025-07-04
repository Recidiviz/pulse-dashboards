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

import { FC } from "react";

import { Chip, ChipColor } from "../../common/components/Chip";
import { EligibilityStatus } from "../../models/EligibilityReport/types";

const statusStyles: Record<EligibilityStatus, ChipColor> = {
  ELIGIBLE: "green",
  ALMOST_ELIGIBLE: "yellow",
  INELIGIBLE: "gray",
  // we don't expect this to be displayed
  NA: "gray",
};

export const EligibilityStatusChip: FC<{
  value: EligibilityStatus;
  label: string;
}> = ({ value, label }) => {
  return <Chip color={statusStyles[value]}>{label}</Chip>;
};
