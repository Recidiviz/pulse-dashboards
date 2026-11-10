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
  BodyS2,
  borderRadius,
  palette,
  spacing,
} from "../../../../styles";

export const InfoRequestRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  width: 100%;
`;

export const MessageRow = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  width: 100%;
`;

export const VerticalDivider = styled.div`
  align-self: stretch;
  background: ${palette.misc.subtleAlpha};
  flex: none;
  width: 1px;
`;

export const MessageColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[1]};
  min-width: 0;
`;

export const RequesterRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

export const IconWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  width: 1rem;
`;

export const RequesterName = styled(BodyS2)`
  color: ${palette.foreground.primary};
`;

export const ScrollableText = styled(BodyS1)`
  color: ${palette.foreground.primary};
  flex: 1;
  max-height: 120px;
  overflow-y: auto;
  overscroll-behavior-y: contain;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${palette.misc.subtleAlpha};
    border-radius: ${borderRadius[4]};
  }
`;

export const ResponseCard = styled.div`
  background: ${palette.background.secondary};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  padding: ${spacing[3]};
  width: 100%;
`;

export const ResponseHeader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

export const ResponderName = styled(BodyS2)`
  color: ${palette.foreground.primary};
`;
