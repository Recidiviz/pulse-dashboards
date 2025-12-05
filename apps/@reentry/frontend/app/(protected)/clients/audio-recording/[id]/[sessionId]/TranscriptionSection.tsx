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

import type React from "react";
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import TranscriptionConversation from "~@reentry/frontend/components/transcription/TranscriptionConversation";
import { useRecordingSessionStatus } from "~@reentry/frontend/hooks/useRecordingSessionStatus";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showSuccessToast } from "~@reentry/frontend-shared";

const StatusMessage = ({
  title,
  message,
  sessionId,
}: {
  title: string;
  message: string;
  sessionId?: string;
}) => {
  const [showDebugButton, setShowDebugButton] = useState(false);
  const { getAccessToken } = useAuth();

  const { mutateAsync: retryProcessingMutation, isPending: isRetrying } =
    $api.useMutation("post", "/recordings/sessions/{session_id}/retry-processing");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShowDebugButton((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleRetryProcessing = async () => {
    if (!sessionId) return;

    try {
      console.log("Starting retry processing for session:", sessionId);

      await retryProcessingMutation({
        params: {
          path: {
            session_id: sessionId,
          },
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Retry processing initiated");
      showSuccessToast("Processing retry initiated successfully");
      setShowDebugButton(false);
    } catch (error) {
      console.error("Error retrying processing:", error);
    }
  };

  return (
    <div className="self-stretch flex-1 flex flex-col justify-center items-center gap-5">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-2">
        <div className="text-[#002321] text-lg font-bold leading-snug">
          {title}
        </div>
        <div className="text-center text-[#2a5469]/90 text-sm font-medium leading-[16.8px]">
          {message}
        </div>
        {showDebugButton && title === "In Progress" && sessionId && (
          <button
            type="button"
            onClick={handleRetryProcessing}
            disabled={isRetrying}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? "Retrying..." : "Retry Processing"}
          </button>
        )}
      </div>
    </div>
  );
};

const TranscriptionSection: React.FC<{
  sessionDataId: string | null;
  onRefreshNeeded?: () => void;
  recordingStatus: string;
  sessionStatus: string | null | undefined;
}> = ({ sessionDataId, onRefreshNeeded, recordingStatus, sessionStatus }) => {
  const { statusData } = useRecordingSessionStatus(sessionDataId || "", true);

  useEffect(() => {
    if (statusData?.status === "completed") {
      onRefreshNeeded?.();
    }
  }, [statusData?.status]);

  if (!sessionDataId || !recordingStatus) return null;

  if (sessionStatus === "completed") {
    return <TranscriptionConversation sessionId={sessionDataId || ""} />;
  }

  if (sessionStatus === "processing") {
    return (
      <StatusMessage
        title="Processing"
        message="Your transcript is being processed. This may take a while. Please check back later."
        sessionId={sessionDataId}
      />
    );
  }

  if (sessionStatus === "error") {
    return (
      <StatusMessage
        title="Error"
        message="There was an error processing your intake assessment. Please try again or contact support if the problem persists."
      />
    );
  }

  if (recordingStatus === "created") {
    return (
      <StatusMessage
        title="Assessment Not Started"
        message="Your transcript will appear here once you've completed the assessment. Start recording using the bar below to start the live assessment."
      />
    );
  }

  if (recordingStatus === "recording") {
    return (
      <StatusMessage
        title="Assessment In Progress"
        message="Your transcript will appear here once you've completed the assessment."
      />
    );
  }

  if (recordingStatus === "paused") {
    return (
      <StatusMessage
        title="Recording Paused"
        message="Your transcript will appear here once you've completed the assessment. Resume recording using the bar below to continue."
      />
    );
  }
  
  return null;
};

export default TranscriptionSection;
