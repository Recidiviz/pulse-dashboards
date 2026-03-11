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

import { typography } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components";

const TooltipWrapper = styled.div`
  background: ${({ theme }) => theme.palette.signal.tooltip};
  border-radius: 0.25rem;
  color: #fff;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, 1rem);
  min-width: 9rem;
`;

const TooltipLabel = styled.h3`
  opacity: 0.8;
  ${typography.Sans14}
  text-align: center;
`;

const TooltipValue = styled.div`
  ${typography.Sans16}
`;

const TooltipAverage = styled.div`
  opacity: 0.8;
  ${typography.Sans14}
  text-align: center;
`;

type PopulationSnapshotTooltipProps = {
  label: string;
  value: string;
  average?: string;
};

const PopulationSnapshotTooltip: React.FC<PopulationSnapshotTooltipProps> = ({
  label,
  value,
  average,
}) => {
  const ariaLabel =
    `${label} value: ${value}.` + (average ? ` ${average}` : "");
  return (
    <TooltipWrapper>
      <TooltipLabel aria-label={ariaLabel} aria-live="polite">
        {label}
      </TooltipLabel>
      <TooltipValue>{value.toLocaleString()}</TooltipValue>
      <TooltipAverage>{average}</TooltipAverage>
    </TooltipWrapper>
  );
};

export default PopulationSnapshotTooltip;
