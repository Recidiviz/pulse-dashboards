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

import { useEffect } from "react";

import { useActiveMeetingStore } from "./activeMeetingStore";
import { useAudioRecording } from "./RecordingProvider";

const STILL_THERE_PROMPT_MS = 60 * 60 * 1000; // 60min

// Asks whether the user is still there
// after STILL_THERE_PROMPT_MS of recording with no interaction
export function useStillTherePrompt() {
  const { durationMs } = useAudioRecording();
  const { lastActivityAt, showStillThereModal, setShowStillThereModal } =
    useActiveMeetingStore();

  useEffect(() => {
    if (showStillThereModal || durationMs === 0) return;
    if (Date.now() - lastActivityAt >= STILL_THERE_PROMPT_MS) {
      setShowStillThereModal(true);
    }
  }, [durationMs, lastActivityAt, showStillThereModal, setShowStillThereModal]);
}
