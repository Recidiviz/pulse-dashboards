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
import { format } from "date-fns";
import React from "react";
import styled from "styled-components";

import { pathwaysPalette } from "../../styles/pathwaysPalette";

const TooltipWrapper = styled.div`
  background: ${pathwaysPalette.signalTooltip};
  border-radius: 0.25rem;
  color: #fff;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, 1rem);
  min-width: 9rem;
`;

const TooltipValue = styled.div`
  ${typography.Sans16}
`;

const TooltipDate = styled.div`
  opacity: 0.8;
`;

const TooltipBottom = styled.div`
  opacity: 0.8;
`;

type DataPoint = {
  date: Date;
  value: number;
  lowerBound?: number;
  upperBound?: number;
  parentSummary?: string;
};

type PropTypes = {
  d: DataPoint & {
    data?: DataPoint;
  };
};

const PopulationTimeSeriesTooltip: React.FC<PropTypes> = ({ d }) => {
  let { date, value } = d;
  const { lowerBound, upperBound, data } = d;
  if (data && !date) {
    date = data.date;
    value = data.value;
  }

  if (d.parentSummary !== undefined || !d) {
    // don't display tooltip for summary block
    return null;
  }
  const formattedDate = format(date, "MMMM yyyy");
  const ariaLabel =
    `${formattedDate} value: ${value}` +
    (lowerBound && upperBound ? `${lowerBound} ${upperBound}` : "");
  return (
    <TooltipWrapper>
      <TooltipDate aria-label={ariaLabel} aria-live="polite">
        {formattedDate}
      </TooltipDate>
      <TooltipValue>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </TooltipValue>
      {lowerBound && upperBound && (
        <TooltipBottom>
          ({Math.round(lowerBound)}, {Math.round(upperBound)})
        </TooltipBottom>
      )}
    </TooltipWrapper>
  );
};

export default PopulationTimeSeriesTooltip;
