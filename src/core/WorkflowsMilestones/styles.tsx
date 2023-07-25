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
import styled, { css, keyframes } from "styled-components/macro";

export const BannerTextWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

export const BannerText = styled.span`
  margin-left: 0.5rem;
`;

export const SidePanelBanner = styled.div`
  ${typography.Sans16}
  color: ${palette.slate85};
  background-color: ${palette.marble4};
  border-radius: 8px;
  display: flex;
  flex-flow: row nowrap;
  height: 4rem;
  margin: 1rem 0 2rem 0;
  padding: 1rem;
  align-items: center;
  justify-content: space-between;
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
  align-items: center;
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

export const loading = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

export const ButtonWithLoader = styled(Button)<{ loadingTimeMS: number }>`
  border-radius: 4px;
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  color: ${palette.slate85};
  width: 100%;
  margin-bottom: 0.75rem;
  position: relative;

  :hover,
  :focus {
    color: ${palette.marble1};
  }

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 222px;
    height: 4px;
    flex-shrink: 0;
    background-color: ${palette.slate20};
    width: 100%;
    ${({ loadingTimeMS }) =>
      loadingTimeMS &&
      css`
        animation: ${loading} ${loadingTimeMS / 1000}s linear forwards;
      `}
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

// Define the pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.025);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const OpportunityAvailableContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 10px;
  flex: 1 0 0;
  align-self: stretch;
  margin-bottom: 0.75rem;
  animation: ${pulse} 1.5s ease-in-out;
`;

export const OpportunityAvailableContents = styled.div`
  border-radius: 8px;
  background: ${palette.marble2};
  display: flex;
  padding: 24px;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  align-self: stretch;
`;

export const OpportunityAvailableHeaderText = styled.div.attrs({
  role: "heading",
  "aria-level": 1,
})`
  ${typography.Sans18};
  align-self: stretch;
  text-align: center;
  color: ${palette.slate85};
`;

export const OpportunityAvailableText = styled.div.attrs({
  role: "article",
})`
  ${typography.Sans16};
  text-align: center;
  align-self: stretch;
  color: ${palette.slate70};
`;

export const MilestonesText = styled.span`
  ${typography.Sans14}
  color: ${palette.pine4};
  margin-left: 6px;
  align-self: center;
`;

export const MilestonesItem = styled.div`
  display: flex;
  flex-flow: row nowrap;
  padding: 4px 0;
`;

export const MilestonesList = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
