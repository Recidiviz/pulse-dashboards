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

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import { components } from "~@reentry/openapi-types";

interface AudioRecordingsProps {
  recordingSession: components["schemas"]["RecordingSessionResponse"] | undefined;
  recordingSessionLoading: boolean
  recordingSessionError: boolean
  recordingSessionRefetch: () => void
  intakeId: string
  clientPseudoId: string
}

const AudioRecordings: React.FC<AudioRecordingsProps> = ({
  recordingSession,
  recordingSessionLoading,
  recordingSessionError,
  recordingSessionRefetch,
  clientPseudoId,
  intakeId
}) => {
  const { getAccessToken } = useAuth();
  const { trackClientIntakeManuallyEnabled } = useAnalytics();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  // Create new recording session mutation
  const { mutateAsync: createSession } = $api.useMutation(
    "post",
    "/recordings/sessions",
  );

  const handleCreateSession = async () => {
    trackClientIntakeManuallyEnabled({
      justiceInvolvedPersonId: clientPseudoId,
    });
    setIsCreating(true);
    if (recordingSession) return;
    try {
      const session = await createSession({
        body: { intake_id: intakeId },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      showSuccessToast("Recording session created successfully");

      // Navigate to the new session page
      if (session?.id) {
        router.push(
          `/client/${clientPseudoId}/audio-recording/${session.id}`,
        );
      } else {
        recordingSessionRefetch(); // Fallback: refresh the sessions list
      }
    } catch (error) {
      console.error("Error creating recording session:", error);
      showErrorToast("Failed to create recording session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/client/${clientPseudoId}/audio-recording/${sessionId}`);
  };

  // Loading state
  if (recordingSessionLoading) {
    return (
      <div className="w-full h-full flex align-middle items-center p-4 text-xs">
        Loading Audio Recordings...
      </div>
    );
  }

  // Error state
  if (recordingSessionError) {
    return (
      <div className="w-full h-full flex align-middle items-center p-4 text-xs">
        Error loading recording sessions
      </div>
    );
  }

  return (
      <>
          {(
              /*Only one session available for recording at a time. so taking the earliest session.*/
              !recordingSession ||
              ["created", "recording", "paused"].includes(recordingSession.status)
          ) && (
              <div className="w-full h-full flex">
                  <PrimaryButton
                      buttonText="Record now"
                      className="!px-2 !md:px-4 !w-[85px] text-white text-xs md:text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case w-full max-w-sm md:!w-auto mx-auto"
                      onClick={
                          recordingSession
                              ? () => handleSessionClick(recordingSession.id)
                              : handleCreateSession
                      }
                      disabled={!recordingSession && isCreating}
                  />
              </div>
          )}
      </>
  );
};

export default AudioRecordings;
