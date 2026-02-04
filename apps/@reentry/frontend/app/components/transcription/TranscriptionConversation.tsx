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
import { Person, Support } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import type React from "react";

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { formatDuration } from "~@reentry/frontend/utils";

import TranscriptionValidationWarnings from "./TranscriptionValidationWarnings";

interface TranscriptionViewProps {
  sessionId: string;
}

const TranscriptionConversation: React.FC<TranscriptionViewProps> = ({
  sessionId,
}) => {
  const auth = useAuth();

  const { data, error, isLoading } = $api.useQuery(
    "get",
    "/transcription/{recording_session_id}/transcription",
    {
      params: {
        path: {
          recording_session_id: sessionId || "",
        },
      },
      headers: {
        Authorization: `Bearer ${auth.getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  const formatTime = (timeString: string) => {
    const seconds = Number.parseFloat(timeString.replace("s", ""));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getRoleIcon = (role: string) => {
    return role === "client" ? <Person /> : <Support />;
  };

  const getRoleColor = (role: string) => {
    return role === "client" ? "#1976d2" : "#2e7d32";
  };

  const getRoleLabel = (role: string) => {
    return role === "client" ? "Client" : "Caseworker";
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        p={4}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading transcription...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error" variant="h6">
          Error loading transcription
        </Typography>
        <Typography color="error" variant="body2">
          Please try again later or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const transcription = data.transcription;
  const validation = data.validation;
  const hasConversation = transcription?.conversation?.length > 0;

  return (
    <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-5 pl-6 pt-6 pr-6 mb-[-1.25rem]">
      {/* Validation Warnings */}
      <div className="w-full md:max-w-[70%] flex flex-col gap-4">
        {validation && (
          <TranscriptionValidationWarnings
            validation={validation}
            hasConversation={hasConversation}
          />
        )}
      </div>

      {/* Only show transcription content if conversation exists */}
      {hasConversation && (
        <>
          {/* Header with metadata */}
          <div className="w-full max-w-[70%] flex flex-col justify-start items-start gap-4">
            <div className="justify-start text-[#002321] text-lg font-bold font-['Public_Sans'] leading-snug">
              Interview Transcription
            </div>

            <div className="flex flex-wrap gap-6 text-[#2a5469]/90 text-sm font-medium font-['Public_Sans']">
              <div>
                <strong>Total Duration:</strong>{" "}
                {formatDuration(
                  Number(
                    transcription.metadata.totalDuration.replace("s", ""),
                  ) * 1000,
                )}
              </div>
            </div>
          </div>

          {/* Conversation turns */}
          <div className="max-h-[45vh] overflow-y-auto space-y-4 self-center">
            {transcription.conversation.map((turn, index) => (
              <div
                key={`${turn.id}-${index}`}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${
                  turn.role === "client"
                    ? "border-l-blue-500"
                    : "border-l-green-500"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 text-white px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: getRoleColor(turn.role) }}
                      >
                        {getRoleIcon(turn.role)}
                        <span>{getRoleLabel(turn.role)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#2a5469]/70 font-['Public_Sans']">
                      <span>
                        {formatTime(turn.startTime)} -{" "}
                        {formatTime(turn.endTime)}
                      </span>
                      <span>
                        {formatDuration(
                          Number(turn.duration.replace("s", "")) * 1000,
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className="text-[#002321] text-sm font-medium font-['Public_Sans'] leading-[20px]"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {turn.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TranscriptionConversation;
