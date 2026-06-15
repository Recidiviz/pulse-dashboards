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

import * as React from "react";
import styled from "styled-components";

import { palette, typography } from "../../styles";
import { tooltipStyles } from "../Tooltip";

const SemioticWrapper = styled.div`
  .frame {
    circle.frame-piece {
      fill: ${palette.data.defaultOrder[0]};
    }

    path.xyframe-line {
      stroke: ${palette.data.defaultOrder[0]};
      stroke-width: 1px;
    }

    .axis-baseline {
      stroke: ${palette.pine3};
    }

    .axis-label,
    .ordinal-labels {
      ${typography.Sans12}
      fill: ${palette.text.caption};
    }

    .axis-title {
      ${typography.Sans14}
      fill: ${palette.text.caption};
    }

    .frame-title {
      ${typography.Sans16}
      fill: ${palette.text.normal};
    }

    .pieces {
      rect {
        fill: ${palette.data.defaultOrder[0]};
      }

      path {
        stroke: ${palette.marble1};
        fill: ${palette.data.defaultOrder[0]};
      }
    }

    .tick-line {
      stroke: ${palette.slate30};
    }

    .tooltip-content {
      ${tooltipStyles}
    }

    .xyframe-matte {
      fill: ${palette.marble1};
    }

    .xybrush {
      .selection {
        fill: ${palette.pine3};
        fill-opacity: 0.2;
        stroke: ${palette.pine3};
      }
    }
  }
`;

export type ChartWrapperProps = {
  className?: string;
};

export const ChartWrapper = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<ChartWrapperProps>
>(({ className, children }, ref) => {
  return (
    <SemioticWrapper className={className} ref={ref}>
      {children}
    </SemioticWrapper>
  );
});

ChartWrapper.displayName = "ChartWrapper";
