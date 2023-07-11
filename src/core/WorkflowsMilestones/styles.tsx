// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import {
  Button,
  palette,
  Sans12,
  Sans16,
  typography,
} from "@recidiviz/design-system";
import styled from "styled-components/macro";

export const BannerText = styled(Sans16)`
  margin-left: 0.5rem;
  color: ${palette.slate85};
`;

export const SidePanelBanner = styled.div`
  background-color: ${palette.marble4};
  border-radius: 8px;
  display: flex;
  flex-flow: row nowrap;
  height: 4rem;
  margin: 1rem 0 2rem 0;
  padding: 1rem;
  align-items: center;
`;

export const SidePanelHeader = styled(Sans16)`
  color: ${palette.pine1};
  padding: 1rem 0;
`;

export const Warning = styled(Sans12)`
  color: ${palette.slate85};
  margin: 0.75rem 0;
`;

export const ReviewInfo = styled(Sans16)`
  color: ${palette.slate85};
  margin: 1rem 0;
`;

export const ReviewMessage = styled(Sans16)`
  color: ${palette.slate85};
  border: 1px solid ${palette.slate20};
  margin: 1rem 0 0;
  padding: 1rem;
  border-radius: 8px;
  white-space: pre-line;
`;

export const PhoneNumber = styled.span`
  color: ${palette.pine1};
`;

export const ButtonsContainer = styled.div`
  ${typography.Sans14}

  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  width: 100%;
`;

export const ActionButton = styled(Button)<{ width?: string }>`
  border-radius: 4px;
  color: ${palette.marble1};
  width: ${({ width }) => width || `100%`};
  margin-bottom: 0.75rem;
`;

export const AlreadyCongratulatedButton = styled(Button)`
  border-radius: 4px;
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  color: ${palette.slate85};
  width: 100%;
  margin-bottom: 0.75rem;

  :hover,
  :focus {
    color: ${palette.marble1};
  }
`;

export const OptOutText = styled.div``;

export const TextLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
`;

export const SidePanelContents = styled.div`
  display: flex;
  flex-flow: column nowrap;
  height: 85vh;
`;
