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

import { Pause, PlayArrow } from "@mui/icons-material";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

import { $api } from "~@reentry/frontend/api";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useRecordingSessionStatus } from "~@reentry/frontend/hooks/useRecordingSessionStatus";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast } from "~@reentry/frontend-shared";

interface SimpleAudioPlayerProps {
  sessionId: string;
  onLoadComplete?: () => void;
  shouldPollStatus?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayerReady?: (seekFunction: (time: number) => void) => void;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
  sessionId,
  onLoadComplete,
  shouldPollStatus = false,
  onTimeUpdate,
  onPlayerReady,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const { getAccessToken } = useAuth();
  const { track } = useAnalytics();

  const { statusData } = useRecordingSessionStatus(sessionId, shouldPollStatus);

  const { data, isLoading, error } = $api.useQuery(
    "get",
    "/recordings/sessions/{session_id}/signed-url",
    {
      params: { path: { session_id: sessionId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: shouldLoad && !!sessionId,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity, // Cache the signed URL indefinitely
    },
  );

  useEffect(() => {
    if (statusData?.status === "completed" && !shouldLoad && !signedUrl) {
      console.info(`Session ${sessionId} completed, auto-loading audio`);
      setShouldLoad(true);
    }
  }, [statusData?.status, shouldLoad, signedUrl, sessionId]);

  React.useEffect(() => {
    if (data) {
      console.info(
        `Signed URL received for session ${sessionId}: ${data.signed_url}`,
      );
      setSignedUrl(data.signed_url);
      onLoadComplete?.();
    }
    if (error) {
      console.error(
        `Failed to get signed URL for session ${sessionId}:`,
        error,
      );
      showErrorToast("Failed to load audio file");
    }
  }, [data, error, onLoadComplete, sessionId]);

  // Initialize WaveSurfer when audio URL is available
  useEffect(() => {
    if (!waveformRef.current || !signedUrl) return;

    // Clean up any existing instance
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    setIsLoadingWaveform(true);

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#4fc3f7",
      progressColor: "#29b6f6",
      cursorColor: "#1976d2",
      barWidth: 2,
      barGap: 1,
      height: 20,
      normalize: true,
      backend: "WebAudio",
    });

    // Listen to play/pause events
    waveSurfer.on("play", () => {
      setIsPlaying(true);
      track("assessment_playback_started", { sessionId: sessionId });
    });
    waveSurfer.on("pause", () => setIsPlaying(false));
    waveSurfer.on("finish", () => setIsPlaying(false));

    // Listen to ready event
    waveSurfer.on("ready", () => {
      setIsLoadingWaveform(false);
      setDuration(waveSurfer.getDuration());
      console.info(`Audio file ready for playback: ${signedUrl}`);

      // Expose seek function to parent
      if (onPlayerReady) {
        const seekToTime = (time: number) => {
          if (waveSurferRef.current) {
            console.log(`[SimpleAudioPlayer] Seeking to time: ${time}s`);
            waveSurferRef.current.seekTo(
              time / waveSurferRef.current.getDuration(),
            );
          }
        };
        onPlayerReady(seekToTime);
      }
    });

    // Listen to time updates
    waveSurfer.on("timeupdate", (time) => {
      setCurrentTime(time);
      onTimeUpdate?.(time);
    });

    waveSurferRef.current = waveSurfer;

    // Track retry attempts
    let retryCount = 0;
    const maxRetries = 2;

    // Load the audio file with HEAD request to verify first
    const loadFile = async () => {
      try {
        console.info(`Loading audio from: ${signedUrl}`);

        // First verify the URL is accessible with a HEAD request
        const headResponse = await fetch(signedUrl, { method: "HEAD" });
        if (!headResponse.ok) {
          throw new Error(
            `HTTP ${headResponse.status}: ${headResponse.statusText}`,
          );
        }

        const contentType = headResponse.headers.get("content-type");
        console.info(`Audio content-type: ${contentType}`);

        // Now load the audio
        await waveSurfer.load(signedUrl);
      } catch (error) {
        console.error(`Error loading audio file from ${signedUrl}:`, error);
        setIsLoadingWaveform(false);
        showErrorToast(
          error instanceof Error
            ? `Failed to load audio: ${error.message}`
            : "Unable to load audio file",
        );
      }
    };

    // Listen to error event with retry logic
    waveSurfer.on("error", (error) => {
      console.error(`WaveSurfer error for ${signedUrl}:`, error);

      // Check if it's a decode error and we can retry
      const errorString = error?.toString() || "";
      const isDecodeError =
        errorString.includes("decodeAudioData") ||
        errorString.includes("invalid content type");

      if (isDecodeError && retryCount < maxRetries) {
        retryCount++;
        console.info(
          `Retrying audio load (attempt ${retryCount}/${maxRetries}) after decode error...`,
        );

        // Retry after a short delay
        setTimeout(() => {
          setIsLoadingWaveform(true);
          loadFile();
        }, 500 * retryCount); // Increasing delay with each retry
      } else {
        setIsLoadingWaveform(false);
        showErrorToast(
          retryCount >= maxRetries
            ? "Unable to load audio file. Please refresh the page."
            : "Unable to load audio file",
        );
      }
    });

    loadFile();

    return () => {
      if (waveSurfer) {
        waveSurfer.destroy();
      }
    };
  }, [signedUrl, sessionId, track]);

  // Stop audio playback on page refresh/unload
  useEffect(() => {
    const handlePageUnload = () => {
      if (waveSurferRef.current) {
        try {
          waveSurferRef.current.stop();
          console.log("Audio stopped on page unload");
        } catch (error) {
          console.error("Error stopping audio on page unload:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handlePageUnload);
    window.addEventListener("pagehide", handlePageUnload);

    return () => {
      window.removeEventListener("beforeunload", handlePageUnload);
      window.removeEventListener("pagehide", handlePageUnload);
    };
  }, []);

  // Prevent audio from pausing on tab change
  useEffect(() => {
    if (!waveSurferRef.current) return;

    let wasPlayingBeforeHidden = false;

    const handleVisibilityChange = () => {
      const waveSurfer = waveSurferRef.current;
      if (!waveSurfer) return;

      if (document.hidden) {
        // Tab is hidden - check if audio is currently playing
        wasPlayingBeforeHidden = waveSurfer.isPlaying();
        console.log(
          "[SimpleAudioPlayer] Tab hidden, audio playing:",
          wasPlayingBeforeHidden,
        );
      } else {
        // Tab is visible again
        console.log(
          "[SimpleAudioPlayer] Tab visible again, was playing:",
          wasPlayingBeforeHidden,
        );

        // Resume playback if it was playing before
        if (wasPlayingBeforeHidden) {
          // Small delay to ensure the tab is fully active
          setTimeout(() => {
            if (waveSurferRef.current && !waveSurferRef.current.isPlaying()) {
              console.log(
                "[SimpleAudioPlayer] Resuming playback after tab change",
              );
              waveSurferRef.current.play().catch((err) => {
                console.error(
                  "[SimpleAudioPlayer] Failed to resume playback:",
                  err,
                );
              });
            }
            wasPlayingBeforeHidden = false;
          }, 100);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [signedUrl]); // Re-run when audio is loaded

  const togglePlayPause = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (waveSurferRef.current) {
      waveSurferRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isRecordingComplete = statusData?.status === "completed";

  return (
    <div className="simple-audio-player">
      {signedUrl ? (
        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={isLoadingWaveform}
            className={`h-8 w-8 rounded-full text-[13px] font-medium font-['Public_Sans'] transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
              isLoadingWaveform
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#006c67] text-white hover:bg-[#005550] active:scale-95"
            }`}
          >
            {isPlaying ? (
              <Pause sx={{ fontSize: 18 }} />
            ) : (
              <PlayArrow sx={{ fontSize: 18 }} />
            )}
          </button>

          {/* Waveform visualization */}
          <div className="flex-1 relative">
            <div className="relative">
              <div
                ref={waveformRef}
                className="w-full rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
                style={{ minHeight: "20px" }}
              />
              {isLoadingWaveform && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#006c67]" />
                    <p className="text-[10px] text-gray-600 font-medium">
                      Loading...
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Time display */}
            {!isLoadingWaveform && duration > 0 && (
              <div className="flex justify-between items-center mt-1 text-[10px] text-gray-600 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Playback speed controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[1, 1.5, 2].map((rate) => {
              let buttonClassName =
                "h-7 px-2 rounded text-[11px] font-medium font-['Public_Sans'] transition-all duration-200 ";
              if (playbackRate === rate) {
                buttonClassName += "bg-[#006c67] text-white";
              } else if (isLoadingWaveform) {
                buttonClassName +=
                  "bg-gray-200 text-gray-400 cursor-not-allowed";
              } else {
                buttonClassName +=
                  "bg-gray-100 text-gray-700 hover:bg-gray-200";
              }

              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handlePlaybackRateChange(rate)}
                  disabled={isLoadingWaveform}
                  className={buttonClassName}
                >
                  {rate}x
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-500">
                {!isRecordingComplete &&
                  "Audio player will be available when recording is completed."}
                {isRecordingComplete && isLoading && "Loading audio..."}
                {isRecordingComplete &&
                  !isLoading &&
                  "Recording ready for playback."}
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
