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
import { useEffect, useMemo } from "react";

import TranscriptionConversation from "~@reentry/frontend/components/transcription/TranscriptionConversation";
import { useRecordingSessionStatus } from "~@reentry/frontend/hooks/useRecordingSessionStatus";
import type { components } from "~@reentry/frontend/recidiviz-schema";

type RecordingSession = components["schemas"]["RecordingSessionResponse"];

const NOT_STARTED_TRANSCRIPTION_STATUS = ["created", "recording", "paused"];

const StatusMessage = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <div className="self-stretch flex-1 flex flex-col justify-center items-center gap-5">
    <div className="w-full max-w-[400px] flex flex-col items-center gap-2">
      <div className="text-[#002321] text-lg font-bold leading-snug">
        {title}
      </div>
      <div className="text-center text-[#2a5469]/90 text-sm font-medium leading-[16.8px]">
        {message}
      </div>
    </div>
  </div>
);

const TranscriptionSection: React.FC<{
  sessionData: RecordingSession | null;
  onRefreshNeeded?: () => void;
}> = ({ sessionData, onRefreshNeeded }) => {
  const { statusData } = useRecordingSessionStatus(sessionData?.id || "", true);

  useEffect(() => {
    if (statusData?.status === "completed") {
      onRefreshNeeded?.();
    }
  }, [statusData?.status]);

  const status = sessionData?.status;

  const transcriptionNotStarted = useMemo(
    () => !!status && NOT_STARTED_TRANSCRIPTION_STATUS.includes(status),
    [status],
  );

  if (!status) return null;

  if (status === "error") {
    return (
      <StatusMessage
        title="Error"
        message="There was an error processing your intake assessment. Please try again or contact support if the problem persists."
      />
    );
  }

  if (transcriptionNotStarted) {
    return (
      <StatusMessage
        title="Intake Assessment Not Started"
        message="Your transcript will appear here once you’ve completed the intake assessment. Start recording using the bar below to start the live assessment."
      />
    );
  }

  if (status === "processing") {
    return (
      <StatusMessage
        title="In Progress"
        message="Your transcript is being processed. Please wait while we finish the transcription."
      />
    );
  }

  if (status === "completed") {
    return <TranscriptionConversation sessionId={sessionData?.id || ""} />;
  }

  return null;
};

export default TranscriptionSection;
