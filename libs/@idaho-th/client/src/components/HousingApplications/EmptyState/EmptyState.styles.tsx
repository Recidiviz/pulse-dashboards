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

import styled from "styled-components";

import {
  BodyS1,
  borderRadius,
  Heading2,
  palette,
  spacing,
} from "../../../styles";

export const Container = styled.div`
  align-self: center;
  align-items: center;
  border-radius: clamp(0.75rem, 1.67vw, 1.5rem);
  display: flex;
  height: min(40rem, 90vh);
  justify-content: center;
  margin-top: ${spacing[6]};
  overflow: hidden;
  width: min(53.75rem, 90%);
`;

export const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  max-width: 22.75rem;
  padding: 0;
  width: 22.75rem;
`;

export const Icon = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  border: 0.0625rem solid ${palette.misc.subtleAlpha};
  border-radius: ${borderRadius[12]};
  display: flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;

  & > svg {
    display: block;
    height: 1.5rem;
    width: 1.5rem;
  }
`;

export const TextGroup = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const Title = styled(Heading2)`
  color: ${palette.foreground.primary};
  font-size: 1.5rem;
  line-height: 1.875rem;
  text-align: center;
`;

export const Subtitle = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  text-align: center;
`;
