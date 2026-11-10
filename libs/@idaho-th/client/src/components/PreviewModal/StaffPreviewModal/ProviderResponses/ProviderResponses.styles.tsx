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
  Heading5,
  palette,
  spacing,
} from "../../../../styles";
import { ProviderCardWrapper } from "../common/styledComponents";

export const ProviderResponseRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const ResponsesBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[2]};
  isolation: isolate;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const ResponseCard = styled.div`
  background: ${palette.background.primary};
  border: 1px solid ${palette.misc.subtleAlpha};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  padding: ${spacing[4]};
  width: 100%;
`;

export const CardHeader = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  justify-content: space-between;
  width: 100%;
`;

export const StatusBadgeContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
`;

export const CardContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: ${spacing[3]};
  width: 100%;
`;

export const ColumnCardWrapper = styled(ProviderCardWrapper)`
  align-items: flex-start;
  flex-direction: column;
`;

export const CardTop = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  justify-content: space-between;
  width: 100%;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${palette.misc.subtleAlpha};
  height: 0;
  margin: 0;
  width: 100%;
`;

export const StatusMessage = styled(BodyS1)<{ $error?: boolean }>`
  color: ${({ $error }) =>
    $error ? palette.foreground.attention : palette.foreground.secondary};
  margin: auto;
  text-align: center;
`;

export const ResponseHeader = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[2]};
  isolation: isolate;
  min-height: 4.625rem;
  padding: ${spacing[4]};
  position: relative;
  width: 100%;
  z-index: 10;
`;

export const ResponseTitle = styled(Heading5)`
  color: ${palette.foreground.primary};
`;

export const ResponseFooter = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex: none;
  gap: ${spacing[2]};
  justify-content: flex-end;
  min-height: 3.75rem;
  padding: ${spacing[4]} ${spacing[4]} 0;
  width: 100%;
`;
