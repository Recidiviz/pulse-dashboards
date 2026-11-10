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

import React, { useEffect, useRef, useState } from "react";

import { palette } from "~@idaho-th/client/styles";

import { Modal } from "../../Modal";
import {
  columnCenterFraction,
  GRID_COLUMNS,
  GRID_DOT_COUNT,
  MATCH_DOT_INDICES,
  MATCHING_MODAL_HEIGHT,
  MATCHING_MODAL_WIDTH,
  PROVIDER_NETWORK_SIZE,
  SWEEP_DURATION_MS,
  SWEEP_START_MS,
  TOTAL_DURATION_MS,
} from "./ProviderMatchLoading.constants";
import * as Styled from "./ProviderMatchLoading.styles";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * Fixed per-dot layout: each dot lights as the beam passes the center of its
 * column, and the hard-coded match dots resolve to a checkmark. These are pure
 * decoration and never reflect real match data.
 */
const DOTS = Array.from({ length: GRID_DOT_COUNT }, (_, index) => ({
  index,
  isMatch: MATCH_DOT_INDICES.includes(index),
  litDelayMs:
    SWEEP_START_MS +
    columnCenterFraction(index % GRID_COLUMNS) * SWEEP_DURATION_MS,
}));

const CheckMark: React.FC = () => (
  <path
    d="M1 4.5 L4 7.5 L10 1"
    stroke={palette.foreground.onBrand}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

interface ProviderMatchLoadingProps {
  isOpen: boolean;
  /** Fired once when the one-shot animation finishes. */
  onComplete: () => void;
}

export const ProviderMatchLoading: React.FC<ProviderMatchLoadingProps> = ({
  isOpen,
  onComplete,
}) => {
  const [count, setCount] = useState(0);
  const hasReviewedAll = count >= PROVIDER_NETWORK_SIZE;

  // Drive the counter up to the network size in step with the sweeping beam,
  // restarting the one-shot animation each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;

    setCount(0);
    let frameId: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      startTime ??= now;
      const sweepProgress = clamp01(
        (now - startTime - SWEEP_START_MS) / SWEEP_DURATION_MS,
      );
      setCount(Math.round(sweepProgress * PROVIDER_NETWORK_SIZE));
      if (sweepProgress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  // Advance to the Providers tab once the timeline (sweep + hold) completes.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      onCompleteRef.current();
    }, TOTAL_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      hideModal={() => undefined}
      width={MATCHING_MODAL_WIDTH}
      height={MATCHING_MODAL_HEIGHT}
      maxWidth={MATCHING_MODAL_WIDTH}
      padding="0"
    >
      <Styled.Backdrop role="status" aria-label="Reviewing provider network">
        <Styled.Card>
          <Styled.Header>
            <Styled.Sparkle width="1.625rem" height="1.625rem" aria-hidden />
            <Styled.HeaderTitle>Reviewing provider network</Styled.HeaderTitle>
          </Styled.Header>

          <Styled.Count>{count}</Styled.Count>
          <Styled.ReviewCaption>
            {hasReviewedAll ? "providers reviewed" : "and counting…"}
          </Styled.ReviewCaption>

          <Styled.Scan>
            <Styled.Grid>
              {DOTS.map(({ index, isMatch, litDelayMs }) => (
                <Styled.Dot
                  key={index}
                  $isMatch={isMatch}
                  $delayMs={litDelayMs}
                >
                  {isMatch && (
                    <Styled.DotCheck
                      width="9"
                      height="7"
                      viewBox="0 0 11 9"
                      fill="none"
                      $delayMs={litDelayMs}
                    >
                      <CheckMark />
                    </Styled.DotCheck>
                  )}
                </Styled.Dot>
              ))}
            </Styled.Grid>
            <Styled.Beam />
          </Styled.Scan>

          <Styled.Done>
            <Styled.DoneCheck>
              <svg width="9" height="7" viewBox="0 0 11 9" fill="none">
                <CheckMark />
              </svg>
            </Styled.DoneCheck>
            Search complete
          </Styled.Done>
        </Styled.Card>
      </Styled.Backdrop>
    </Modal>
  );
};
