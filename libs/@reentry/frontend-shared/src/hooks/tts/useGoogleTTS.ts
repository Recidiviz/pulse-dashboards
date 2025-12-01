// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";

import { useApplicationContext } from "../../contexts/ApplicationContext";
import { base64ToBlob } from "../../utils/encoding";

const REQUEST_TIMEOUT_MS = 15000;

export const useGoogleTTS = () => {
  const { $api } = useApplicationContext();

  const { mutateAsync: textToSpeechMutation, isPending: isGenerating } =
    $api.useMutation("post", "/google/text-to-speech");

  const fetchAudio = async (text: string): Promise<Blob> => {
    if (!text.trim()) {
      throw new Error("Text cannot be empty");
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT_MS);
    });

    const response = await Promise.race([
      textToSpeechMutation({
        body: {
          text: text,
          language_code: "en-US",
          voice_name: "en-US-Standard-C",
          encoding: "MP3",
        },
      }),
      timeoutPromise,
    ]);

    if (!response.audio_content) {
      throw new Error("No audio content received");
    }

    return base64ToBlob(response.audio_content, "audio/mpeg");
  };

  return {
    fetchAudio,
    isGenerating,
  };
};
