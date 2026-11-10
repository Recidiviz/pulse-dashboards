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

import styled, { css, keyframes } from "styled-components";

import {
  BodyM1,
  borderRadius,
  fontWeights,
  Heading4,
  palette,
  serifBase,
  spacing,
  type TypographyProps,
} from "../../styles";
import CheckIcon from "../assets/check.svg?react";
import SparkleDuoIcon from "../assets/sparkle-duo.svg?react";

export const ModalHeader = styled.div`
  align-items: flex-start;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  gap: ${spacing[6]};
  justify-content: flex-end;
  padding: ${spacing[5]} ${spacing[6]} ${spacing[3]} ${spacing[6]};
  width: 100%;
`;

export const HeaderTextGroup = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[1]};
  justify-content: center;
`;

export const ModalTitle = styled(Heading4)`
  color: ${palette.foreground.primary};
  font-style: normal;
`;

export const ModalSubtitle = styled(BodyM1)`
  color: ${palette.foreground.secondary};
  font-style: normal;
`;

export const CloseButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: 1rem;
  padding: 0;
  width: 1rem;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;

export const ModalBody = styled.div`
  align-items: center;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  min-height: 13rem;
  padding: ${spacing[3]} ${spacing[6]} ${spacing[5]} ${spacing[6]};
  width: 100%;
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const Slot = styled.div`
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  height: 10.875rem;
  max-width: 29.5rem;
  padding: 0;
  width: 100%;
`;

export const Dropzone = styled.div<{ $isDragOver: boolean }>`
  align-items: center;
  background-color: ${({ $isDragOver }) =>
    $isDragOver ? palette.misc.blueMuted : palette.background.secondary};
  border: 0.0625rem dashed ${palette.misc.subtleAlpha};
  border-color: ${({ $isDragOver }) =>
    $isDragOver ? palette.state.focus : palette.misc.subtleAlpha};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  height: 10.875rem;
  max-width: 29.5rem;
  padding: ${spacing[6]};
  width: 100%;
`;

export const DropzoneContent = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  height: 100%;
  max-width: 26.5rem;
  padding: 0;
  width: 100%;
`;

export const DropzoneTextGroup = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  height: 3.125rem;
  max-width: 26.5rem;
  padding: 0;
  width: 100%;
`;

export const DropzoneTitle = styled.div`
  color: ${palette.foreground.primary};
  font-size: 1.125rem;
  font-style: normal;
  font-weight: 600;
  line-height: 1.625rem;
`;

export const DropzoneHint = styled.div`
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.25rem;
`;

export const BrowseLink = styled.button`
  background: none;
  border: none;
  color: ${palette.foreground.primary};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  padding: 0;
  text-decoration-line: underline;
`;

export const FeedbackLink = styled.a`
  color: ${palette.foreground.brand};
  text-decoration-line: underline;
`;

const twinkleLarge = keyframes`
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  45% {
    opacity: 0.5;
    transform: scale(0.8);
  }
`;

const twinkleSmall = keyframes`
  0%,
  100% {
    opacity: 0.62;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.12);
  }
`;

const ringRipple = keyframes`
  0% {
    opacity: 0.55;
    transform: scale(0.55);
  }
  100% {
    opacity: 0;
    transform: scale(1.9);
  }
`;

const badgePop = keyframes`
  0% {
    transform: scale(0);
  }
  55% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
`;

const drawTick = keyframes`
  to {
    stroke-dashoffset: 0;
  }
`;

const sweepAcross = keyframes`
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(260%);
  }
`;

const rise = keyframes`
  0% {
    opacity: 0;
    transform: translateY(0.4375rem);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const LoaderContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  padding: 0 ${spacing[8]};
  width: 100%;
`;

/** Fixed-height slot so swapping the sparkle for the checkmark causes no layout shift. */
export const IconSlot = styled.div`
  align-items: center;
  display: flex;
  height: 2.75rem;
  justify-content: center;
  margin-bottom: ${spacing[1.5]};
`;

export const Sparkle = styled(SparkleDuoIcon)`
  height: 2.375rem;
  overflow: visible;
  width: 2.375rem;

  .star-lg,
  .star-sm {
    transform-box: fill-box;
    transform-origin: center;
  }

  .star-lg {
    animation: ${twinkleLarge} 1.9s ease-in-out infinite;
    fill: ${palette.misc.pine4};
  }

  .star-sm {
    animation: ${twinkleSmall} 1.9s ease-in-out 0.55s infinite;
    fill: ${palette.misc.pine3};
    opacity: 0.62;
  }
`;

export const CheckMark = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  position: relative;
`;

export const CheckRing = styled.div`
  animation: ${ringRipple} 0.7s ease-out forwards;
  border: 0.125rem solid ${palette.misc.pine4};
  border-radius: ${borderRadius.round};
  height: 2.75rem;
  position: absolute;
  width: 2.75rem;
`;

export const CheckBadge = styled.div`
  align-items: center;
  animation: ${badgePop} 0.5s cubic-bezier(0.2, 0.85, 0.3, 1.25);
  background-color: ${palette.misc.pine4};
  border-radius: ${borderRadius.round};
  display: flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
`;

export const CheckTick = styled(CheckIcon)`
  color: ${palette.foreground.onBrand};
  height: 0.9375rem;
  width: 1.375rem;

  path {
    animation: ${drawTick} 0.4s 0.18s ease-out forwards;
    stroke-dasharray: 16;
    stroke-dashoffset: 16;
  }
`;

export const Bars = styled.div`
  display: flex;
  gap: ${spacing[2]};
  margin: ${spacing[5]} 0 ${spacing[4.5]};
  overflow: hidden;
  position: relative;
  width: 100%;
`;

export const BarTrack = styled.div`
  background-color: ${palette.misc.slate10};
  border-radius: ${borderRadius.round};
  flex: 1;
  height: 0.375rem;
  overflow: hidden;
`;

interface BarFillProps {
  $width: number;
  $durationMs: number;
}

export const BarFill = styled.div<BarFillProps>`
  background-color: ${palette.misc.pine4};
  border-radius: ${borderRadius.round};
  height: 100%;
  transition: width ${({ $durationMs }) => $durationMs}ms linear;
  width: ${({ $width }) => $width}%;
`;

export const BarSweep = styled.div`
  animation: ${sweepAcross} 0.8s ease-out forwards;
  background: linear-gradient(
    90deg,
    transparent,
    ${palette.misc.sweepHighlight},
    transparent
  );
  bottom: 0;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 38%;
`;

export const LoaderTextGroup = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
`;

export const LoaderTitle = styled.p<TypographyProps & { $done?: boolean }>`
  ${serifBase}
  color: ${({ $done }) => ($done ? palette.misc.pine3 : palette.misc.pine1)};
  font-size: 1.125rem;
  font-weight: ${fontWeights.bold};
  line-height: 1.3;
  margin: 0;
  min-height: 1.5rem;
  text-align: center;
  ${({ $done }) =>
    $done &&
    css`
      animation: ${rise} 0.45s ease-out;
    `}
`;

export const LoaderSubtitle = styled.p`
  color: ${palette.misc.slate60};
  font-size: 0.8125rem;
  font-weight: ${fontWeights.regular};
  line-height: 1.4;
  margin: 0;
  min-height: 1.125rem;
  text-align: center;
`;
