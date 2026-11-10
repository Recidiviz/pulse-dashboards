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
import styled, { keyframes } from "styled-components";

import { palette } from "../../../styles";

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

interface ContainerProps {
  $size: string;
}

const Container = styled.div<ContainerProps>`
  flex-shrink: 0;
  height: ${({ $size }) => $size};
  width: ${({ $size }) => $size};
`;

const SpinnerElement = styled.span<ContainerProps>`
  animation: ${spin} 0.8s linear infinite;
  border: 3px solid ${palette.misc.marble5};
  border-radius: 50%;
  border-top-color: ${palette.misc.slate50Opaque};
  display: inline-block;
  height: ${({ $size }) => $size};
  width: ${({ $size }) => $size};
`;

interface SpinnerProps {
  size?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "2rem" }) => (
  <Container $size={size}>
    <SpinnerElement $size={size} />
  </Container>
);
