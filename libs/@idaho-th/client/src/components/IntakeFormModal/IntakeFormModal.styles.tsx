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

import { borderRadius, palette, spacing } from "../../styles";

export const Content = styled.div`
  align-items: flex-start;
  background-color: ${palette.scrim.default};
  display: flex;
  flex-direction: row;
  height: 100%;
  justify-content: space-between;
  max-width: 81.8325rem;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  width: 100%;
`;

export const PdfPanel = styled.div`
  align-items: flex-start;
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[3]};
  height: 100%;
  padding: 0;
  position: relative;
  width: clamp(0rem, calc(40vw - 0.75rem), 35.3325rem);
`;

export const PdfPage = styled.div`
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  flex: 1 1 auto;
  height: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  padding: ${spacing[2]};
  position: relative;
  width: clamp(0px, calc(40vw - 0.75rem), 35.3325rem);
`;

export const PdfToolbar = styled.div`
  align-items: center;
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  gap: ${spacing[2]};
  justify-content: flex-end;
  padding: ${spacing[2]} ${spacing[3]};
  position: absolute;
  right: 0;
  top: 0;
  width: auto;
  z-index: 1;
`;

export const RotateButton = styled.button`
  align-items: center;
  background: ${palette.misc.slate20};
  border-radius: ${borderRadius[12]};
  border: 0;
  cursor: pointer;
  display: inline-flex;
  height: 2.25rem;
  justify-content: center;
  padding: 0;
  width: 2.25rem;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &:hover:not(:disabled) {
    background: ${palette.misc.slate30};
  }

  & svg {
    height: 1.25rem;
    width: 1.25rem;
  }

  & svg path {
    stroke: ${palette.misc.slate85};
  }
`;
