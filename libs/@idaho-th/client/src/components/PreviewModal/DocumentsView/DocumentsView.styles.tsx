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
  BodyM1,
  BodyS1,
  borderRadius,
  Button1,
  palette,
  spacing,
} from "../../../styles";
import { spin } from "../../common/LoadingSpinner/Spinner";
import { buttonOutline } from "../../common/StyledComponents";

export const PanelRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const PanelBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[2]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const FileCard = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  border: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${spacing[3]};
  width: 100%;
`;

export const FileCardInner = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  width: 100%;
`;

export const FileIconWrapper = styled.div`
  align-items: center;
  background: ${palette.background.brandLight};
  border-radius: ${borderRadius[12]};
  display: flex;
  flex: none;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;

  & svg {
    flex: none;
    height: 1.25rem;
    width: 1.25rem;
    path {
      stroke: ${palette.foreground.brand};
    }
  }
`;

export const FileMeta = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const FileName = styled(BodyM1)`
  color: ${palette.foreground.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

export const FileSubRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

export const FileDate = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const FileStatusRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
`;

export const FileStatusGroup = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

export const DotSeparator = styled.span`
  background: ${palette.foreground.secondary};
  border-radius: 50%;
  flex: none;
  height: 0.125rem;
  width: 0.125rem;
`;

export const FileStatusIcon = styled.span<{
  $variant: "success" | "error";
}>`
  align-items: center;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  width: 1rem;

  & svg {
    display: block;
    height: 1rem;
    width: 1rem;

    ${({ $variant }) =>
      $variant === "success" &&
      `color: ${palette.foreground.success}; path { fill: currentColor; stroke: none; }`}
    ${({ $variant }) =>
      $variant === "error" &&
      `path { fill: ${palette.foreground.attention}; stroke: none; }`}
  }
`;

export const FileStatusText = styled(BodyS1)<{
  $variant?: "success" | "error" | "uploading";
}>`
  color: ${({ $variant }) => {
    if ($variant === "success") return palette.foreground.success;
    if ($variant === "error") return palette.foreground.attention;
    return palette.foreground.secondary;
  }};
`;

export const ErrorHint = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const FileActions = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
`;

export const IconButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: ${palette.background.secondary};
  border-radius: ${borderRadius.round};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 2rem;
  justify-content: center;
  width: 2rem;

  & svg {
    flex: none;
    height: 1rem;
    width: 1rem;
  }

  &:hover {
    filter: brightness(0.96);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

export const UploadButton = styled(Button1)`
  ${buttonOutline}
  align-items: center;
  background: ${palette.background.brand};
  border-radius: ${borderRadius.round};
  color: ${palette.foreground.onBrand};
  cursor: pointer;
  display: flex;
  gap: ${spacing[2]};
  height: 2.75rem;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 ${spacing[5]};
  white-space: nowrap;

  &:hover {
    filter: brightness(1.08);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

export const PanelFooter = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
  height: 3.75rem;
  justify-content: flex-end;
  min-height: 3.75rem;
  padding: ${spacing[4]} ${spacing[4]} 0;
  width: 100%;
`;

export const EmptyState = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
  width: 100%;
`;

export const SizeText = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const UploadSpinner = styled.span`
  animation: ${spin} 1s linear infinite;
  display: flex;
  flex: none;
  height: 1rem;
  width: 1rem;

  & svg {
    height: 1rem;
    width: 1rem;
  }
`;

export const ErrorBanner = styled.div`
  align-items: center;
  background: ${palette.background.attentionLight};
  border-radius: ${borderRadius[12]};
  border: 0.0625rem solid ${palette.border.attention};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  padding: ${spacing[2]} ${spacing[3]};
  width: 100%;
`;
