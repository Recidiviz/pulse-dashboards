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
  borderRadius,
  fontWeights,
  interBase,
  palette,
  serifBase,
  spacing,
  type TypographyProps,
} from "~@idaho-th/client/styles";

import SparkleDuoIcon from "../../assets/sparkle-duo.svg?react";
import {
  BEAM_FADE_DURATION_MS,
  DONE_APPEAR_MS,
  DONE_RISE_DURATION_MS,
  GRID_COLUMNS,
  SWEEP_DURATION_MS,
  SWEEP_START_MS,
} from "./ProviderMatchLoading.constants";

const ms = (value: number) => `${value}ms`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Backdrop = styled.div`
  align-items: center;
  animation: ${fadeIn} ${ms(300)} ease-out both;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: ${spacing[9]};
  width: 100%;
`;

export const Card = styled.div`
  align-items: center;
  background-color: ${palette.background.primary};
  border-radius: ${borderRadius[8]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding: ${spacing[7]} ${spacing[7]} ${spacing[8]};
  text-align: center;
  width: 27.5rem;
`;

export const Header = styled.div`
  align-items: center;
  align-self: flex-start;
  display: flex;
  gap: ${spacing[2.5]};
`;

// The two stars twinkle out of phase: the large one on the beat, the small one
// offset and inverted, so the sparkle never rests. Targeted by draw order
// (SVGO mangles the source class names).
const twinkleLarge = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  45% { opacity: 0.5; transform: scale(0.8); }
`;

const twinkleSmall = keyframes`
  0%, 100% { opacity: 0.62; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.12); }
`;

export const Sparkle = styled(SparkleDuoIcon)`
  flex: none;
  overflow: visible;

  & path {
    transform-box: fill-box;
    transform-origin: center;
  }

  & path:first-of-type {
    animation: ${twinkleLarge} 1.9s ease-in-out infinite;
    fill: ${palette.misc.pine4};
  }

  & path:last-of-type {
    animation: ${twinkleSmall} 1.9s ease-in-out 0.55s infinite;
    fill: ${palette.misc.pine3};
  }
`;

export const HeaderTitle = styled.div<TypographyProps>`
  ${serifBase}
  color: ${palette.misc.pine1};
  font-size: 1rem;
  font-weight: ${fontWeights.bold};
  line-height: 1.3;
`;

export const Count = styled.div<TypographyProps>`
  ${serifBase}
  color: ${palette.misc.pine3};
  font-size: 2.875rem;
  font-variant-numeric: tabular-nums;
  font-weight: ${fontWeights.bold};
  line-height: 1;
  margin: ${spacing[8]} 0 ${spacing[1.5]};
`;

export const ReviewCaption = styled.div<TypographyProps>`
  ${interBase}
  color: ${palette.misc.slate60};
  font-size: 0.8125rem;
  font-weight: ${fontWeights.regular};
  line-height: 1.4;
`;

export const Scan = styled.div`
  height: 6rem;
  margin: ${spacing[7]} 0 ${spacing[2]};
  position: relative;
  width: 18.75rem;
`;

export const Grid = styled.div`
  display: grid;
  gap: ${spacing[4.5]};
  grid-template-columns: repeat(${GRID_COLUMNS}, 1fr);
  place-items: center;
`;

const litRegular = keyframes`
  to {
    background-color: ${palette.misc.pineLit};
    transform: scale(1.18);
  }
`;

const litMatch = keyframes`
  to {
    background-color: ${palette.misc.pine4};
    transform: scale(1.18);
  }
`;

export const Dot = styled.div<{
  $delayMs: number;
  $isMatch: boolean;
}>`
  align-items: center;
  ${({ $isMatch, $delayMs }) => css`
    animation: ${$isMatch ? litMatch : litRegular} ${ms(200)} ease
      ${ms($delayMs)} forwards;
  `}
  background-color: ${palette.misc.slate10};
  border-radius: 50%;
  display: flex;
  height: 1rem;
  justify-content: center;
  width: 1rem;
`;

const revealCheck = keyframes`
  to { opacity: 1; }
`;

export const DotCheck = styled.svg<{ $delayMs: number }>`
  animation: ${revealCheck} ${ms(200)} ease ${({ $delayMs }) => ms($delayMs)}
    forwards;
  opacity: 0;
`;

const beamSweep = keyframes`
  from { left: 0%; }
  to { left: 100%; }
`;

const beamFade = keyframes`
  to { opacity: 0; }
`;

export const Beam = styled.div`
  animation:
    ${beamSweep} ${ms(SWEEP_DURATION_MS)} linear ${ms(SWEEP_START_MS)} forwards,
    ${beamFade} ${ms(BEAM_FADE_DURATION_MS)} linear
      ${ms(SWEEP_START_MS + SWEEP_DURATION_MS)} forwards;
  background-color: ${palette.misc.pine4};
  border-radius: ${borderRadius[4]};
  bottom: -4px;
  box-shadow: 0 0 14px 3px ${palette.misc.pineGlow};
  left: 0;
  pointer-events: none;
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
  width: 3px;
`;

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Done = styled.div<TypographyProps>`
  ${serifBase}
  align-items: center;
  animation: ${rise} ${ms(DONE_RISE_DURATION_MS)} ease-out ${ms(DONE_APPEAR_MS)}
    forwards;
  color: ${palette.misc.pine3};
  display: inline-flex;
  font-size: 0.9375rem;
  font-weight: ${fontWeights.bold};
  gap: ${spacing[2]};
  line-height: 1.3;
  margin-top: ${spacing[2.5]};
  opacity: 0;
`;

export const DoneCheck = styled.span`
  align-items: center;
  background-color: ${palette.misc.pine4};
  border-radius: 50%;
  display: flex;
  height: 1.125rem;
  justify-content: center;
  width: 1.125rem;
`;
