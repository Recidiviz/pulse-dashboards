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

import { Button } from "~design-system";

import {
  BodyS1,
  borderRadius,
  Caption1,
  Heading1,
  Heading2,
  palette,
  spacing,
} from "../../styles";

export const PageContainer = styled.div`
  background-color: ${palette.misc.paleSilver};
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
`;

export const PageHeadingActions = styled.div`
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  gap: ${spacing[3]};

  @media (max-width: 40rem) {
    width: 100%;
  }
`;

export const PageHeadingSubtitle = styled(BodyS1)`
  align-self: stretch;
  color: ${palette.foreground.primary};
  letter-spacing: 0;
  line-height: normal;
`;

export const PageHeadingTitle = styled(Heading1)`
  align-self: stretch;
  color: ${palette.foreground.primary};
  font-size: clamp(1.25rem, 1.94vw, 1.75rem);
  letter-spacing: 0;
  line-height: normal;
`;

export const PageHeadingTitleRow = styled.div`
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 0.5625rem;
  min-width: 0;
`;

export const PageHeadingBetaChip = styled.div`
  align-items: center;
  background: ${palette.misc.brightestGold};
  border-radius: ${borderRadius.round};
  display: inline-flex;
  flex: 0 0 auto;
  height: 1.25rem;
  padding: 0 ${spacing[2]};
`;

export const PageHeadingBetaChipText = styled(Caption1)`
  align-items: center;
  color: ${palette.misc.cornHarvest};
  display: flex;
  line-height: 1.25rem;
`;

export const PageHeadingTitleGroup = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.5625rem;
  min-width: 0;
`;

export const PageHeadingWrapper = styled.div`
  align-self: center;
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[3]};
  height: auto;
  margin-bottom: ${spacing[3]};
  justify-content: space-between;
  margin-top: clamp(${spacing[6]}, 5.56vh, 3.125rem);
  min-height: 3.875rem;
  width: min(67.5rem, 95%);

  @media (max-width: 40rem) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const SearchBarWrapper = styled.div`
  align-items: center;
  background-color: ${palette.background.secondary};
  border: 0.0625rem solid ${palette.misc.subtleAlpha};
  border-radius: ${borderRadius[8]};
  display: flex;
  flex-shrink: 0;
  gap: ${spacing[2]};
  height: 2rem;
  padding: 0 ${spacing[2]};
  width: 15rem;
`;

export const SearchIconWrapper = styled.div`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  flex-shrink: 0;
  height: 1rem;
  justify-content: center;
  width: 1rem;

  & > svg {
    display: block;
    height: 100%;
    width: 100%;
    fill: currentColor;
  }
`;

export const SearchInput = styled.input`
  appearance: none;
  background: transparent;
  border: none;
  color: ${palette.foreground.secondary};
  flex: 1;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  min-width: 0;
  outline: none;

  &::placeholder {
    color: ${palette.foreground.secondary};
    opacity: 0.7;
  }
`;

export const UploadButton = styled(Button).attrs({
  kind: "primary" as const,
  shape: "pill" as const,
})`
  background-color: ${palette.background.brand};
  border: none;
  color: ${palette.foreground.onBrand};
  min-height: 2.375rem;
  padding: 0.625rem ${spacing[6]};

  &:hover,
  &:focus-visible {
    background-color: ${palette.misc.darkCharcoal};
    color: ${palette.foreground.onBrand};
  }

  &:active {
    background-color: ${palette.misc.deepGrey};
    color: ${palette.foreground.onBrand};
  }

  &:focus-visible {
    outline: 0.125rem solid ${palette.state.focus};
  }

  @media (max-width: 40rem) {
    width: 100%;
  }
`;

export const PdfViewerLoaderOverlay = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  inset: 0;
  justify-content: center;
  position: absolute;
  width: 100%;
`;

export const PdfViewerLoaderContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  height: 3.5rem;
  justify-content: center;
  width: 8.125rem;
`;

export const PdfViewerLoaderText = styled.div`
  color: ${palette.misc.black};
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  height: 1.25rem;
  line-height: 1.25rem;
  text-align: center;
  width: 8.125rem;
`;

export const ProviderPageHeadingTitleGroup = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[1]};
  min-width: 0;
`;

export const ProviderPageHeadingTitle = styled(Heading2)`
  color: ${palette.foreground.primary};
`;

export const InformationBadge = styled.div`
  align-items: center;
  background: ${palette.misc.catskillWhite};
  border-radius: ${borderRadius[8]};
  display: inline-flex;
  flex: 0 0 auto;
  height: 1.5rem;
  justify-content: flex-end;
  padding: 0 ${spacing[2]};
`;

export const InformationBadgeText = styled(BodyS1)`
  color: ${palette.misc.seaBlue};
`;

export const ProviderActionButton = styled.button`
  align-items: center;
  background: ${palette.background.brand};
  border-radius: ${borderRadius.round};
  border: none;
  color: ${palette.foreground.onBrand};
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  gap: ${spacing[2]};
  height: 2rem;
  justify-content: center;
  padding: 0 ${spacing[3]};
  width: 7.5rem;

  &:hover {
    background: ${palette.misc.darkTeal};
  }

  &:focus-visible {
    outline: 0.125rem solid ${palette.state.focus};
  }
`;
