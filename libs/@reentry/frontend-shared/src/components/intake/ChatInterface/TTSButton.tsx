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

import type React from "react";
import { useRef, useState } from "react";

import { useApplicationContext } from "../../../contexts/ApplicationContext";
import { useGoogleTTS } from "../../../hooks/tts/useGoogleTTS";
import { showErrorToast } from "../../../utils/toast";

interface TTSButtonProps {
  text: string;
  clientPseudoId?: string | null;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  clientPseudoId,
}) => {
  const { analytics } = useApplicationContext();
  const { fetchAudio, isGenerating } = useGoogleTTS();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
  };

  const getAriaLabel = () => {
    if (isGenerating) return "Loading audio...";
    if (isPlaying) return "Stop audio";
    return "Play message audio";
  };

  const handlePlayAudio = async () => {
    if (!text) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      const audioBlob = await fetchAudio(text);

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        audioUrlRef.current = null;

        // Track TTS end event
        if (clientPseudoId) {
          analytics.trackIntakeChatTtsEvent("end", {
            justiceInvolvedPersonPseudoId: clientPseudoId,
          });
        }
      };

      audio.onerror = (event) => {
        console.error("Audio playback error:", event);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        audioUrlRef.current = null;
        showErrorToast("Error playing audio. Please try again.");
      };

      setIsPlaying(true);
      await audio.play();

      // Track TTS start event
      if (clientPseudoId) {
        analytics.trackIntakeChatTtsEvent("start", {
          justiceInvolvedPersonPseudoId: clientPseudoId,
        });
      }
    } catch (error) {
      console.error("Error in handlePlayAudio:", error);

      let errorMessage = "Failed to generate audio. Please try again.";

      if (error instanceof Error && error.message === "Request timeout") {
        errorMessage = "Request timed out. Please check your connection.";
      }

      showErrorToast(errorMessage);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse-strong {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.05);
            }
          }
          .animate-pulse-strong {
            animation: pulse-strong 1s ease-in-out infinite;
          }
        `}
      </style>
      <button
        type="button"
        onClick={handlePlayAudio}
        disabled={isGenerating}
        className={`flex-shrink-0 p-2 rounded-full disabled:cursor-not-allowed transition-all ${
          isPlaying
            ? "text-[#25636F] bg-[#D5ECF1] animate-pulse-strong"
            : "text-gray-400 hover:text-[#25636F] hover:bg-gray-50"
        }`}
        aria-label={getAriaLabel()}
      >
        {isGenerating ? (
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        )}
      </button>
    </>
  );
};
