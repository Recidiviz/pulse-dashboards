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

import { Modal } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import {
  HIDDEN_HEADER_OFFSET,
  PageContainer as BasePageContainer,
} from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

// A design-system modal restyled to fill the entire viewport instead of the default centered box.
export const StyledSearchOverlay = styled(Modal)`
  .ReactModal__Content {
    position: fixed;
    inset: 0;
    transform: none;
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    padding: 0;
    border-radius: 0;
    overflow-y: auto;
  }

  .ReactModal__Overlay[class*="--after-open"] .ReactModal__Content {
    transform: none;
  }

  .ReactModal__Overlay {
    background-color: ${palette.white};
  }
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  height: ${rem(HIDDEN_HEADER_OFFSET)};
  padding: 0 ${rem(spacing.lg)};
  border-bottom: 1px solid ${palette.slate20};

  &:has(:focus-visible) {
    outline: 1px solid ${palette.pine4};
    outline-offset: -1px;
  }
`;

export const PageContainer = styled(BasePageContainer)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  padding-top: ${rem(spacing.lg)};
  padding-bottom: ${rem(spacing.xl)};
`;

export const ClearButton = styled.button`
  ${typography.Sans16}

  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: ${palette.pine4};
`;

export const SearchInput = styled.input`
  ${typography.Sans18}

  flex: 1;
  min-width: 0;
  border: none;
  color: ${palette.pine1};

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${palette.slate70};
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

export const ResultList = styled.div`
  display: flex;
  flex-direction: column;
`;

// For announcing result-count changes to screen readers without a visible element on screen
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

export const EmptyMessage = styled.p`
  ${typography.Sans16}
  color: ${palette.pine1};
  margin: 0;
`;

export const BrowseLabel = styled.p`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: ${rem(spacing.lg)} 0 0 0;
`;

export const BrowseList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const BrowseLink = styled(Link)`
  ${typography.Sans16}
  display: block;
  padding: ${rem(spacing.md)} 0;
  border-bottom: 1px solid ${palette.slate20};
  color: ${palette.pine4};
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid ${palette.pine1};
    outline-offset: 2px;
  }
`;
