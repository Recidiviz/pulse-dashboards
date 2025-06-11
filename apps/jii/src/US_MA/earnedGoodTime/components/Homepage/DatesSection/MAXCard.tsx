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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { Card } from "../../../../../common/components/Card";
import { hydrateTemplate } from "../../../../../configs/hydrateTemplate";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { SlateCopy } from "../styles";
import bulletEmpty from "./bullet-empty.svg";
import bulletFilled from "./bullet-filled.svg";
import { DateInfo } from "./DateInfo";

const AdjustmentBreakdownItem: FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const { data } = useEGTDataContext();
  return (
    <>
      <dt>{label}</dt>
      <dd>{hydrateTemplate(value, data)}</dd>
    </>
  );
};

const BULLET_PADDING = spacing.lg;
const BULLET_SIZE = 12;
const BULLET_CONNECTOR_WIDTH = 1;
const BULLET_CONNECTOR_PAD = 3;

const Wrapper = styled.div`
  dl {
    ${typography.Sans14}

    color: ${palette.slate85};
    display: grid;
    grid-template-columns: auto 1fr;
    justify-content: start;
    padding-left: ${rem(BULLET_PADDING)};

    & :last-of-type {
      color: ${palette.pine1};
    }
  }

  dt {
    position: relative;

    &::before,
    &::after {
      transform: translateY(0.15em);
    }

    &:not(:last-of-type) {
      // this draws the bullets
      &::before {
        content: "";
        background: url("${bulletEmpty}");
        background-size: contain;
        background-repeat: no-repeat;
        left: -${rem(BULLET_PADDING)};
        position: absolute;
        width: ${rem(BULLET_SIZE)};
        height: ${rem(BULLET_SIZE)};
      }

      // this draws the line between bullets
      &::after {
        content: "";
        position: absolute;
        border-left: ${rem(BULLET_CONNECTOR_WIDTH)} solid ${palette.slate60};
        // offsetting the line width so it winds up centered
        left: -${rem(BULLET_PADDING + BULLET_CONNECTOR_WIDTH - BULLET_SIZE / 2)};
        top: ${rem(BULLET_SIZE + BULLET_CONNECTOR_PAD)};
        bottom: ${rem(BULLET_CONNECTOR_PAD)};
        width: 0;
      }
    }

    &:last-of-type {
      // this draws the alternative bullet
      &::before {
        content: "";
        background: url("${bulletFilled}");
        background-size: contain;
        background-repeat: no-repeat;
        left: -${rem(BULLET_PADDING)};
        position: absolute;
        width: ${rem(BULLET_SIZE)};
        height: ${rem(BULLET_SIZE)};
      }
    }
  }

  dd {
    margin-bottom: ${rem(spacing.sm)};
    margin-left: ${rem(spacing.lg)};
  }
`;

const AdjustmentBreakdown = observer(function AdjustmentBreakdown() {
  const {
    data,
    copy: {
      home: { dates },
    },
  } = useEGTDataContext();

  return (
    <Wrapper>
      <SlateCopy>{hydrateTemplate(dates.maxRelease.summary, data)}</SlateCopy>
      <dl>
        <AdjustmentBreakdownItem {...dates.maxRelease.breakdown.original} />
        <AdjustmentBreakdownItem {...dates.maxRelease.breakdown.change} />
        <AdjustmentBreakdownItem {...dates.maxRelease.breakdown.adjusted} />
      </dl>
    </Wrapper>
  );
});

export const MAXCard = observer(function MAXCard() {
  const {
    data,
    copy: {
      home: { dates },
    },
  } = useEGTDataContext();

  return (
    <Card>
      <DateInfo {...dates.maxRelease} />
      {!!data.totalStateCreditDaysCalculated && <AdjustmentBreakdown />}
    </Card>
  );
});
