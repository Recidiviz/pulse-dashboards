// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  Button as ActionButton,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import { Button as LinkButton, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";
export const RosterRequestViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  max-height: 100%;
  height: 100%;
  min-height: 100%;
`;

// INITIAL VIEW STYLES

export const OfficerItemLink = styled(Link)`
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 100%;
  color: inherit;
  gap: ${rem(8)};
  padding-left: ${rem(4)};
  padding-right: ${rem(4)};
`;

export const OfficerRemoveLinkButton = styled(LinkButton)`
  width: max-content;
  height: max-content;
  margin-left: auto;
  color: ${palette.signal.error};
  :hover {
    color: ${palette.signal.error};
  }
  opacity: 0;
  pointer-events: none;

  ${OfficerItemLink}:hover &,
  ${OfficerItemLink}:focus-within & {
    opacity: 1;
    pointer-events: auto;
  }
  @media (hover: none) and (pointer: coarse) {
    opacity: 1;
    pointer-events: auto;
  }
  ${typography.Sans14}
`;

export const InitialRosterViewWrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${rem(8)};
  height: 100%;
  max-height: ${rem(460)};
  margin-left: -4px;
  margin-right: -4px;
`;

export const ScrollboxOverlay = styled.div`
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none; /* For Firefox */
  margin-top: -7px;
  padding-top: 7px;
  mask-image: linear-gradient(
    to top,
    transparent 0%,
    white calc(10% - 24px),
    white calc(100% - 16px),
    transparent 100%
  );
`;

export const OfficerListGroup = styled(ListGroup)`
  display: flex;
  flex-direction: column;
  gap: ${rem(8)};
  padding-bottom: ${rem(8)};

  div.list-group-item {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    max-height: ${rem(28)};
    border-radius: ${rem(4)};
    width: max-width;
    height: fit-content;
    border-style: none;

    padding: ${rem(4)} 0;
    &:hover {
      background-color: ${rgba(palette.slate, 0.05)};
      border-radius: ${rem(4)};
    }
  }
`;

export const OfficerGroupListItemDisplayName = styled.p`
  ${typography.Sans14}
  color: ${palette.pine1} !important;
  padding: 0;
  margin: 0;
`;

export const OfficerListSectionHeader = styled.h2`
  ${typography.Sans14}
  padding: 0;
  margin: 0;
  color: ${rgba(palette.pine1, 0.5)} !important;
  padding-right: ${rem(4)};
  padding-left: ${rem(4)};
`;

// ROSTER SUBMIT VIEW STYLES
export const RosterChangeRequestSubmissionViewWrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding-bottom: ${rem(spacing.lg)};
  max-height: 100%;
  min-width: 100%;
  height: 100%;
  width: 100%;
`;

export const MessageContainer = styled.div`
  background-color: ${palette.slate10};
  color: ${palette.slate85};
  border-radius: 8px;
  padding: 1rem;
  ${typography.Sans18};
`;

export const TextArea = styled.textarea`
  width: 100%;
  background-color: transparent;
  border: 0;
  height: ${rem(187)};
  max-height: ${rem(187)};
  color: ${palette.slate85};

  ::placeholder {
    color: ${palette.slate60};
  }
`;

export const Disclaimer = styled.div`
  padding: 0;
  margin: 0;
  ${typography.Sans14};
  color: ${palette.slate};
  opacity: 50%;
`;

export const SubmitButton = styled(ActionButton)`
  padding: ${rem(12)} ${rem(32)};
  border-radius: ${rem(4)};
  max-width: fit-content;
  margin-left: auto;
`;

export const FieldError = styled.em`
  color: ${palette.signal.error};
  margin-right: "auto";
  margin-bottom: ${rem(spacing.xs)};
`;
