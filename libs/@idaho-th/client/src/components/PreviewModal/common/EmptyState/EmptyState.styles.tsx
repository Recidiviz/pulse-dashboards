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

import { BodyM2, BodyS1, palette, spacing } from "../../../../styles";

export const Root = styled.div`
  align-items: center;
  align-self: stretch;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[4]};
  justify-content: center;
  width: 100%;
`;

export const Body = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  max-width: 20rem;
  width: 100%;
`;

export const IconWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;

  & svg {
    height: 100%;
    width: auto;
  }
`;

export const Text = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const Heading = styled(BodyM2)`
  color: ${palette.foreground.primary};
  text-align: center;
`;

export const SubHeading = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  text-align: center;
`;
