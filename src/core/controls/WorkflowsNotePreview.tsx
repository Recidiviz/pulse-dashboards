// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  palette,
  Sans12,
  Sans14,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import styled from "styled-components/macro";

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

export const PagePreviewWithHover = styled.article`
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  white-space: pre;
  max-width: ${rem(960)};
  &:hover,
  &:focus {
    background: ${rgba(palette.signal.highlight, 0.05)};
    border: 1px solid ${palette.signal.highlight};
  }
`;
