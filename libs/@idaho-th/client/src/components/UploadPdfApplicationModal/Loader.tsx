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

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "../Modal/Modal";
import * as Styled from "./UploadPdfApplicationModal.styles";

const FINAL_BAR_CAP = 95;
const CATCH_UP_MS = 350;
const COMPLETION_ANIMATION_MS = 800;
const HOLD_MS = 700;

type Phase = "filling" | "completing" | "holding" | "done";

interface BarState {
  width: number;
  durationMs: number;
}

interface LoaderProps {
  stages: readonly string[];
  stageDurationsMs: readonly number[];
  stageIndex: number;
  isProcessingComplete: boolean;
  onBarFilled: () => void;
}

export const Loader: React.FC<LoaderProps> = ({
  stages,
  stageDurationsMs,
  stageIndex,
  isProcessingComplete,
  onBarFilled,
}) => {
  const lastStage = stages.length - 1;
  const doneTarget = stages.length;

  const [bars, setBars] = useState<BarState[]>(() =>
    stages.map(() => ({ width: 0, durationMs: 0 })),
  );
  const [activeStage, setActiveStage] = useState(0);
  const [phase, setPhase] = useState<Phase>("filling");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const activeStageRef = useRef(0);
  const stageStartedAtRef = useRef(Date.now());
  const phaseRef = useRef<Phase>("filling");
  const onBarFilledRef = useRef(onBarFilled);
  onBarFilledRef.current = onBarFilled;

  const targetRef = useRef(0);
  const transitioningRef = useRef(false);

  const schedule = useCallback((delayMs: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, delayMs));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const frames = useRef<number[]>([]);

  const scheduleAfterPaint = useCallback((fn: () => void) => {
    const outer = requestAnimationFrame(() => {
      frames.current.push(requestAnimationFrame(fn));
    });
    frames.current.push(outer);
  }, []);

  const clearFrames = useCallback(() => {
    frames.current.forEach(cancelAnimationFrame);
    frames.current = [];
  }, []);

  const startStage = useCallback((index: number, bar: BarState) => {
    activeStageRef.current = index;
    stageStartedAtRef.current = Date.now();
    setActiveStage(index);
    setBars((prev) => prev.map((b, i) => (i === index ? bar : b)));
  }, []);

  useEffect(() => {
    scheduleAfterPaint(() => {
      if (phaseRef.current !== "filling" || targetRef.current > 0) return;
      startStage(0, {
        width: FINAL_BAR_CAP,
        durationMs: stageDurationsMs[0],
      });
    });

    return () => {
      clearFrames();
      clearTimers();
    };
  }, [
    scheduleAfterPaint,
    startStage,
    clearFrames,
    clearTimers,
    stageDurationsMs,
  ]);

  const advanceStages = useCallback(() => {
    const from = activeStageRef.current;
    if (targetRef.current <= from) {
      transitioningRef.current = false;
      return;
    }

    const elapsed = Date.now() - stageStartedAtRef.current;
    const frozenWidth = Math.min(
      FINAL_BAR_CAP,
      (elapsed / stageDurationsMs[from]) * FINAL_BAR_CAP,
    );
    setBars((prev) =>
      prev.map((bar, i) =>
        i === from ? { width: frozenWidth, durationMs: 0 } : bar,
      ),
    );

    scheduleAfterPaint(() => {
      startStage(from, { width: 100, durationMs: CATCH_UP_MS });

      schedule(CATCH_UP_MS, () => {
        const next = from + 1;

        if (next > lastStage) {
          phaseRef.current = "completing";
          setPhase("completing");
          schedule(COMPLETION_ANIMATION_MS, () => {
            phaseRef.current = "holding";
            setPhase("holding");
          });
          schedule(COMPLETION_ANIMATION_MS + HOLD_MS, () => {
            transitioningRef.current = false;
            phaseRef.current = "done";
            setPhase("done");
            onBarFilledRef.current();
          });
          return;
        }

        if (next < targetRef.current) {
          activeStageRef.current = next;
          stageStartedAtRef.current = Date.now();
          setActiveStage(next);
          advanceStages();
          return;
        }

        transitioningRef.current = false;
        startStage(next, {
          width: FINAL_BAR_CAP,
          durationMs: stageDurationsMs[next],
        });
      });
    });
  }, [schedule, scheduleAfterPaint, startStage, lastStage, stageDurationsMs]);

  useEffect(() => {
    if (phaseRef.current !== "filling") return;

    const nextTarget = isProcessingComplete ? doneTarget : stageIndex;
    if (nextTarget <= targetRef.current) return;

    targetRef.current = nextTarget;
    if (transitioningRef.current) return;

    transitioningRef.current = true;
    advanceStages();
  }, [stageIndex, isProcessingComplete, advanceStages, doneTarget]);

  const isComplete =
    phase === "completing" || phase === "holding" || phase === "done";

  return (
    <Modal
      isOpen
      hideModal={() => undefined}
      width="35.5rem"
      height="16rem"
      maxWidth="35.5rem"
      padding="0"
    >
      <Styled.LoaderContent>
        <Styled.IconSlot>
          {isComplete ? (
            <Styled.CheckMark>
              <Styled.CheckRing />
              <Styled.CheckBadge>
                <Styled.CheckTick />
              </Styled.CheckBadge>
            </Styled.CheckMark>
          ) : (
            <Styled.Sparkle />
          )}
        </Styled.IconSlot>

        <Styled.Bars>
          {bars.map((bar, index) => (
            <Styled.BarTrack key={stages[index]}>
              <Styled.BarFill
                data-testid={`stage-bar-${index}`}
                $width={bar.width}
                $durationMs={bar.durationMs}
              />
            </Styled.BarTrack>
          ))}
          {phase === "completing" && <Styled.BarSweep />}
        </Styled.Bars>

        <Styled.LoaderTextGroup>
          <Styled.LoaderTitle $done={isComplete}>
            {isComplete ? "Application ready" : stages[activeStage]}
          </Styled.LoaderTitle>
          {!isComplete && (
            <Styled.LoaderSubtitle>
              This will take about 15 seconds total.
            </Styled.LoaderSubtitle>
          )}
        </Styled.LoaderTextGroup>
      </Styled.LoaderContent>
    </Modal>
  );
};
