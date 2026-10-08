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

import { useEffect, useMemo, useState } from "react";

import { getTypingCheckpoints } from "../lib/getTypingCheckpoints";
import {
  CASE_NOTE_TYPING_WINDOW_MS,
  useCaseNoteTypingStore,
  useCaseNoteTypingStoreHydrated,
} from "./caseNoteTypingStore";

const WORDS_PER_CHUNK = 4;
const START_DELAY_MS = 1000;
const CHUNK_INTERVAL_MS = 100;
const SECTION_PAUSE_MS = 600;

type CaseNoteTypingAnimation = {
  pipelineRunId: string | null;
  meetingStartTime: Date;
  // if someone has already read this note
  isRead: boolean;
};

type Params = {
  meetingId: string;
  caseNote: string;
  animation?: CaseNoteTypingAnimation;
};

export const useCaseNoteTyping = ({
  meetingId,
  caseNote,
  animation,
}: Params) => {
  const key = `${meetingId}:${animation?.pipelineRunId ?? ""}`;
  const hasHydrated = useCaseNoteTypingStoreHydrated();
  const hasSeen = useCaseNoteTypingStore((s) => key in s.seen);
  const markSeen = useCaseNoteTypingStore((s) => s.markSeen);

  const checkpoints = useMemo(
    () => getTypingCheckpoints(caseNote, WORDS_PER_CHUNK),
    [caseNote],
  );

  const canAnimate =
    !!animation &&
    !animation.isRead &&
    checkpoints.length > 0 &&
    Date.now() - new Date(animation.meetingStartTime).getTime() <
      CASE_NOTE_TYPING_WINDOW_MS;
  const isEligible = canAnimate && !hasSeen;

  // null = waiting
  const [shouldAnimate, setShouldAnimate] = useState<boolean | null>(() => {
    if (!canAnimate) return false;
    return hasHydrated ? isEligible : null;
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (shouldAnimate === null && hasHydrated) setShouldAnimate(isEligible);
  }, [shouldAnimate, hasHydrated, isEligible]);

  // Marked on start, so leaving mid-animation doesn't replay it next time
  // (doesn't stop the run)
  useEffect(() => {
    if (shouldAnimate) markSeen(key);
  }, [shouldAnimate, key, markSeen]);

  useEffect(() => {
    if (!shouldAnimate) return;

    let delay = START_DELAY_MS;
    if (step > 0) {
      delay = checkpoints[step - 1]?.endsSection
        ? SECTION_PAUSE_MS
        : CHUNK_INTERVAL_MS;
    }

    const timeout = setTimeout(() => {
      if (step + 1 >= checkpoints.length) {
        setShouldAnimate(false);
      } else {
        setStep(step + 1);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [shouldAnimate, step, checkpoints]);

  const visibleText =
    shouldAnimate && step > 0
      ? caseNote.slice(0, checkpoints[step - 1]?.end)
      : "";

  return {
    isPending: shouldAnimate === null,
    isTyping: shouldAnimate === true,
    visibleText,
  };
};
