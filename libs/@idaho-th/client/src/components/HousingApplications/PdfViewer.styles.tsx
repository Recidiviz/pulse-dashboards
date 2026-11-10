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

import { palette } from "../../styles";

export const PdfViewerRoot = styled.div`
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
`;

export const PdfScrollContainer = styled.div<{
  $canPan: boolean;
  $isPanning: boolean;
}>`
  align-items: safe center;
  cursor: ${({ $isPanning, $canPan }) => {
    if ($isPanning) return "grabbing";
    if ($canPan) return "grab";
    return "default";
  }};
  display: flex;
  height: 100%;
  justify-content: safe center;
  overflow: auto;
  overscroll-behavior: contain;
  position: relative;
  width: 100%;
  user-select: ${({ $isPanning }) => ($isPanning ? "none" : "auto")};

  & .react-pdf__Document {
    display: flex;
    flex: 0 0 auto;
    justify-content: center;
  }

  & .react-pdf__Page {
    flex: 0 0 auto;
  }

  & .react-pdf__Page__canvas {
    display: block;
  }
`;

export const ZoomControls = styled.div`
  bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  position: absolute;
  right: 1rem;
  z-index: 1;
`;

export const ZoomButton = styled.button`
  align-items: center;
  background: ${palette.misc.blackSemiMuted};
  border: none;
  border-radius: 50%;
  box-sizing: border-box;
  color: ${palette.background.primary};
  cursor: pointer;
  display: flex;
  height: 2rem;
  justify-content: center;
  line-height: 0;
  padding: 0;
  width: 2rem;

  & svg {
    display: block;
  }

  &:hover:not(:disabled) {
    background: ${palette.misc.black};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;
