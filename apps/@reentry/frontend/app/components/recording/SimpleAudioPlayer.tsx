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

import React, { useEffect,useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { useRecordingSessionStatus } from "~@reentry/frontend/hooks/useRecordingSessionStatus";
import { useAuth } from "~@reentry/frontend/lib/auth";
import { showErrorToast } from "~@reentry/frontend/utils/toast";

interface SimpleAudioPlayerProps {
  sessionId: string;
  onLoadComplete?: () => void;
  shouldPollStatus?: boolean;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
  sessionId,
  onLoadComplete,
  shouldPollStatus = false,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const { getAccessToken } = useAuth();

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

  const isRecordingComplete = statusData?.status === "completed";

  return (
    <div className="simple-audio-player border rounded-lg p-4">
      {signedUrl ? (
        <div className="space-y-4">
          <audio
            controls
            src={signedUrl}
            className="w-full"
            preload="metadata"
            onLoadStart={() =>
              console.info(`Audio element loading from: ${signedUrl}`)
            }
            onCanPlay={() =>
              console.info(`Audio file ready for playback: ${signedUrl}`)
            }
            onError={(e) =>
              console.error(`Audio playback error for ${signedUrl}:`, e)
            }
          >
            <track kind="captions" src="" label="No captions available" />
            Your browser does not support audio playback.
          </audio>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <audio
              controls={isRecordingComplete}
              className={`w-full ${!isRecordingComplete ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <track kind="captions" src="" label="No captions available" />
              Your browser does not support audio playback.
            </audio>
            <p className="text-sm text-gray-600 mt-2">
              {/* eslint-disable-next-line no-nested-ternary */}
              {isRecordingComplete
                ? isLoading
                  ? "Loading audio..."
                  : "Recording ready for playback."
                : "Audio player will be available when recording is completed."}
            </p>
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
