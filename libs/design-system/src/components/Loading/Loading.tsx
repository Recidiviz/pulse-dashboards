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
import * as React from "react";
import styled, { keyframes } from "styled-components";

import { animation, palette, typography } from "../../styles";
import { LoadingProps } from "./Loading.types";

const RING_SIZE = 75;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
`;

const LoadingRing = styled.div`
  width: ${rem(RING_SIZE)};
  height: ${rem(RING_SIZE)};
`;

const LoadingRingCircle = styled.div`
  box-sizing: border-box;
  display: block;
  position: absolute;
  border: 6px solid ${palette.data.teal1};
  border-radius: 50%;
  animation: ${rotate} ${animation.extendedDurationMs}ms
    cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: ${palette.pine3} ${palette.data.teal1} ${palette.data.teal1};
  width: ${rem(RING_SIZE * 0.8)};
  height: ${rem(RING_SIZE * 0.8)};
  margin: ${rem(RING_SIZE * 0.065)};
  border-width: ${rem(RING_SIZE * 0.065)};

  &:nth-child(1) {
    animation-delay: ${animation.extendedDurationMs * -0.45}ms;
  }
  &:nth-child(2) {
    animation-delay: ${animation.extendedDurationMs * -0.3}ms;
  }
  &:nth-child(3) {
    animation-delay: ${animation.extendedDurationMs * -0.15}ms;
  }
`;

const LoadingSpinnerText = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  text-align: center;
`;

export const Loading: React.FC<LoadingProps> = ({
  message = "Loading data...",
  showMessage = true,
}: LoadingProps) => {
  return (
    <LoadingWrapper role="status">
      <LoadingRing>
        <LoadingRingCircle />
        <LoadingRingCircle />
        <LoadingRingCircle />
        <LoadingRingCircle />
      </LoadingRing>
      {showMessage ? <LoadingSpinnerText>{message}</LoadingSpinnerText> : null}
    </LoadingWrapper>
  );
};
