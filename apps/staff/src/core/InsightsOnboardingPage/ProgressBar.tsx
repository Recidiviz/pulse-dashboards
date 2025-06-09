// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

export const PROGRESS_BAR_HEIGHT = 8;

const Container = styled.div`
  background: ${palette.slate10};
  height: ${rem(PROGRESS_BAR_HEIGHT)};
  width: 100%;
`;

const Bar = styled.div<{ progress: number }>`
  background: ${palette.signal.highlight};
  height: ${rem(PROGRESS_BAR_HEIGHT)};
  max-width: 100%;
  width: ${(props) => props.progress}%;
  transition: width 0.5s ease;
`;

const ProgressBar: React.FC<{
  percent: number;
}> = ({ percent }) => {
  return (
    <Container>
      <Bar progress={percent} />
    </Container>
  );
};

export default ProgressBar;
