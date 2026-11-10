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
  Caption1,
  Heading5,
  palette,
  spacing,
} from "../../../../styles";
import { buttonOutline } from "../../../common/StyledComponents";

export const ProviderRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const ProvidersBody = styled.div<{ $centered?: boolean }>`
  align-items: ${({ $centered }) => ($centered ? "center" : "flex-start")};
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[5]};
  isolation: isolate;
  justify-content: ${({ $centered }) => ($centered ? "center" : "flex-start")};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const StatusMessage = styled(BodyS1)<{ $error?: boolean }>`
  color: ${({ $error }) =>
    $error ? palette.foreground.attention : palette.foreground.secondary};
  margin: auto;
  text-align: center;
`;

export const HeaderWrapper = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[2]};
  isolation: isolate;
  min-height: 74px;
  padding: 16px;
  position: relative;
  width: 100%;
  z-index: 10;
`;

export const TitleRow = styled.div`
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  display: flex;
  flex-direction: row;
`;

export const Title = styled(Heading5)`
  color: ${palette.foreground.primary};
  flex: 1;
`;

export const TitleWrapper = styled.div`
  margin-bottom: ${spacing[3]};
`;

export const CloseButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  width: 1rem;
`;

export const SearchBarWrapper = styled.div`
  align-self: stretch;
  flex: none;
  position: relative;
  width: 100%;
`;

export const SuggestionListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[2]};
  width: 100%;
`;

export const SectionTitle = styled(BodyS2)`
  color: ${palette.foreground.primary};
`;

export const SelectedEmptyState = styled.div`
  align-items: center;
  background: ${palette.background.secondary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  padding: ${spacing[6]} ${spacing[4]};
  text-align: center;
  width: 100%;
`;

export const FullEmptyState = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[2]};
  justify-content: center;
  padding: ${spacing[6]};
  text-align: center;
  width: 100%;
`;

export const EmptyStateIcon = styled.div`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  height: 2rem;
  justify-content: center;
  width: 2rem;
  & svg {
    height: 2rem;
    width: 2rem;
    path {
      stroke: ${palette.foreground.tertiary};
    }
  }
`;

export const EmptyTitle = styled(BodyS2)`
  color: ${palette.foreground.primary};
  font-weight: 500;
`;

export const EmptyBody = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  max-width: 85%;
`;

export const SendButtonColumn = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`;

export const SendButtonSubtext = styled(Caption1)`
  color: ${palette.foreground.secondary};
  margin-right: ${spacing[2.5]};
`;

export const SendButtonSubtextRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${spacing[1]} ${spacing[4]} ${spacing[0]} ${spacing[4]};
  width: 100%;
`;
