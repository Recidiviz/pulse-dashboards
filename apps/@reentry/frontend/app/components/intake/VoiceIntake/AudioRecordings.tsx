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

//import { useRouter } from "next/navigation";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  PrimaryButton,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";

interface AudioRecordingsProps {
  clientPseudoId: string;
  onIntakeUpdate: () => void;
}

const AudioRecordings: React.FC<AudioRecordingsProps> = ({
  clientPseudoId,
  onIntakeUpdate,
}) => {
  const { getAccessToken } = useAuth();
  const { trackClientIntakeManuallyEnabled } = useAnalytics();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch recording sessions for the client
  const {
    data: sessions,
    isLoading,
    error,
    //refetch,
  } = $api.useQuery("get", "/recordings/sessions/clients/{client_pseudo_id}", {
    params: { path: { client_pseudo_id: clientPseudoId } },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

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
    try {
      await createSession({
        body: { client_pseudo_id: clientPseudoId },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      showSuccessToast("Recording session created successfully");

      onIntakeUpdate();

      // // Navigate to the new session page
      // if (newSession?.id) {
      //   router.push(
      //     `/clients/audio-recording/${clientPseudoId}/${newSession.id}`,
      //   );
      // } else {
      //   refetch(); // Fallback: refresh the sessions list
      // }
    } catch (error) {
      console.error("Error creating recording session:", error);
      showErrorToast("Failed to create recording session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/clients/audio-recording/${clientPseudoId}/${sessionId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex align-middle items-center p-4 text-xs">
        Loading Audio Recordings...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex align-middle items-center p-4 text-xs">
        Error loading recording sessions
      </div>
    );
  }

  // Process sessions to show only the earliest one if multiple exist
  const processedSessions =
    sessions && sessions.length > 1
      ? [
          sessions.reduce((earliest, current) =>
            new Date(current.created_at) < new Date(earliest.created_at)
              ? current
              : earliest,
          ),
        ]
      : sessions;

  const shouldShowNewSessionButton = !sessions || sessions.length === 0;

  return (
    <>
      {shouldShowNewSessionButton && (
        <div className="w-full h-full flex align-middle items-center">
          <button
            disabled={isCreating}
            type={"button"}
            onClick={handleCreateSession}
            className="w-full px-4 py-2 text-left hover:bg-[rgba(43,84,105,0.10)] text-cyan-900/80 text-xs md:text-sm font-medium leading-4 font-['Public_Sans']"
          >
            {isCreating ? "Creating..." : "Begin live intake Assessment"}
          </button>
        </div>
      )}

      {/*Only one session available for recording at a time. so taking the earliest session.*/}
      {processedSessions && processedSessions.length > 0 && (
        <div className="w-full h-full flex ">
          <PrimaryButton
            buttonText={"Record now"}
            className=" text-white text-xs md:text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case w-full max-w-sm "
            onClick={() => handleSessionClick(processedSessions[0].id)}
          />
        </div>
      )}
    </>
  );
};

export default AudioRecordings;
