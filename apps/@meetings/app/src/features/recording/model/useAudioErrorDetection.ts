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

const NO_AUDIO_WARNING_DELAY_MS = 5_000;

type Params = {
  isRecording: boolean;
  audioLevel: number;
};

export function useAudioErrorDetection({ isRecording, audioLevel }: Params): {
  micStatus: "error" | "speaking" | "silent";
  hasAudioError: boolean;
  setHasAudioError: (status: boolean) => void;
} {
  const [hasAudioError, setHasAudioError] = useState(false);

  const isSpeaking = audioLevel > 0;

  useEffect(() => {
    if (!isRecording || isSpeaking) {
      setHasAudioError(false);
      return;
    }
    const t = setTimeout(() => {
      setHasAudioError(true);
    }, NO_AUDIO_WARNING_DELAY_MS);
    return () => clearTimeout(t);
  }, [isRecording, isSpeaking]);

  const micStatus = useMemo(() => {
    if (hasAudioError) return "error";
    if (isRecording && isSpeaking) return "speaking";
    return "silent";
  }, [hasAudioError, isRecording, isSpeaking]);

  return { micStatus, hasAudioError, setHasAudioError };
}
