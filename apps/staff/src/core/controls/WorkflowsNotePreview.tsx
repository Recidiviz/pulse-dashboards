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

import { Sans12, Sans14, Sans24, spacing } from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

export const NoteFormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} 0;
  border-bottom: 1px solid ${palette.marble5};
  margin-bottom: ${rem(spacing.lg)};
`;

export const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

export const FormHeading = styled(Sans24)`
  color: ${palette.pine1};
`;

export const FormContainer = styled.div`
  margin: 0 ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.xl)};
`;

export const LastEditedMessage = styled(Sans12)`
  color: ${palette.slate85};
`;

export const LastEditedMessagePulse = styled.span<{
  isHighlighted: boolean;
  darkMode?: boolean;
}>`
  color: ${({ isHighlighted, darkMode }) => {
    if (isHighlighted) return palette.signal.highlight;
    if (darkMode) return palette.marble1;
    return palette.slate85;
  }};
  transition: all 2s ease;
`;

export const NotePreview = styled.article`
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  white-space: pre;
  max-width: ${rem(960)};
`;

export const NotePreviewContainer = styled(Sans14)`
  display: grid;
  grid-template-columns: minmax(min-content, 100px) 1fr;
  grid-template-rows: min-content;
  gap: ${rem(spacing.md)};
`;

export const PageFieldTitle = styled.strong`
  color: black;
`;

export const PagePreview = styled.article`
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  color: ${palette.pine1};
  line-height: ${rem(18)};
  height: ${rem(214)};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  white-space: pre;
  max-width: ${rem(960)};
`;

export const PagePreviewWithHover = styled(PagePreview)`
  &:hover,
  &:focus {
    background: ${rgba(palette.signal.highlight, 0.05)};
    border: 1px solid ${palette.signal.highlight};
  }
`;

export const SmallPagePreviewWithHover = styled(PagePreviewWithHover)<{
  selected: boolean;
}>`
  font-size: ${rem(2)};
  line-height: ${rem(3.5)};
  padding: ${rem(spacing.xs)};
  height: ${rem(48)};
  width: ${rem(132)};
  cursor: pointer;

  ${(props) =>
    props.selected &&
    `
      border: 1px solid ${palette.signal.highlight};
    `}
`;
