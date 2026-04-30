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

import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Chip } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { DateAdjustmentPresenter } from "./DateAdjustmentPresenter";
import { DateCardProps } from "./DateCard";

export type DateAdjustmentProps = Omit<DateCardProps, "children">;

const Wrapper = styled.dl`
  ${typography.Sans16}

  border-top: ${rem(1)} solid ${palette.slate85};
  padding-top: ${rem(spacing.sm)};
  margin: 0;
`;

const Row = styled.div`
  border-bottom: ${rem(1)} solid ${palette.slate10};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${rem(spacing.sm)} 0;

  &:last-child {
    border: none;
    padding-bottom: 0;
  }
`;

/**
 * Unlike most other components, this one does not support granular overrides
 * because it has a more complex internal structure and logic and it's not clear
 * there's any real use case for partially overriding it.
 */
const ManagedComponent: FC<
  DateAdjustmentProps & { presenter: DateAdjustmentPresenter }
> = ({ presenter, className }) => {
  const { text } = presenter;
  if (!text) return null;

  return (
    <Wrapper className={className}>
      <Row>
        <dt>{text.original.label}</dt>
        <dd>{text.original.value}</dd>
      </Row>
      <Row>
        <dt>{text.reduction.label}</dt>
        <dd>
          <Chip color="green">{text.reduction.value}</Chip>
        </dd>
      </Row>
      <Row>
        <dt>{text.adjusted.label}</dt>
        <dd>{text.adjusted.value}</dd>
      </Row>
    </Wrapper>
  );
};

function usePresenter({ datePresenter }: DateAdjustmentProps) {
  return new DateAdjustmentPresenter(datePresenter.data, datePresenter.t);
}

export const DateAdjustment = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
