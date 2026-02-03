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

import { Box, Typography } from "@mui/material";
import type React from "react";
import { useState } from "react";

import { useSocket } from "../../../websockets/IntakeSocketContext";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { EndChatModal } from "../EndChatModal";
import { ClientAvatar } from "./CustomAvatar";

interface ChatHeaderProps {
  isConversationInProgress?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isConversationInProgress = false,
}: ChatHeaderProps) => {
  const [isEndChatModalOpen, setIsEndChatModalOpen] = useState(false);
  const onConfirmEndChat = () => {
    sessionStorage.removeItem("intake_token");
    sessionStorage.removeItem("preIntakeStep");
    sessionStorage.removeItem("client_pseudo_id");
    sessionStorage.removeItem("conversationStarted");
    window.location.href = "/assessment";
  };

  const {
    intakeContext: {
      client_name,
      clientPseudoId,
      allSections,
      conversationStarted,
      currentSection,
    },
  } = useSocket();
  const totalSections = allSections?.length ?? 0;
  const completedSections =
    allSections?.filter((section) => section.status === "completed").length ??
    0;

  const progressText = `${completedSections}/${totalSections}`;

  const progressPercentage =
    totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  return (
    <>
      {/* Main header */}
      <Box
        className="border-b md:border-slate-400/40 lg:border-slate-200/40 bg-white flex items-center md:justify-between xs:px-2 xs:py-0 md:px-4 md:py-3"
        sx={{
          maxWidth: "100%",
          maxHeight: "10vh",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Client info */}
        <Box
          className="flex items-center overflow-hidden flex-1 lg:flex-initial"
          sx={{ height: "100%" }}
        >
          <ClientAvatar size={42} />
          <Box className="ml-3 overflow-hidden">
            <div className="flex justify-between gap-x-2 overflow-hidden">
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "16px", sm: "18px" },
                  lineHeight: "120%",
                  letterSpacing: "-0.02em",
                  color: "#003331",
                  fontFamily: "'Public sans'",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                component="p"
              >
                {client_name}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "16px", sm: "18px" },
                  lineHeight: "120%",
                  letterSpacing: "-0.02em",
                  color: "#8BB1BA",
                  fontFamily: "'Public sans'",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                component="p"
              >
                {clientPseudoId}
              </Typography>
            </div>
          </Box>
        </Box>
        {isConversationInProgress && (
          <>
            <Box className="flex justify-end px-4 xs:px-0 md:px-8 py-3 flex-none">
              <PrimaryButton
                className={"w-[100px] md:max-w-lg"}
                buttonText="End chat"
                onClick={() => setIsEndChatModalOpen(true)}
              />
            </Box>
            <EndChatModal
              isOpen={isEndChatModalOpen}
              onClose={() => setIsEndChatModalOpen(false)}
              onConfirm={onConfirmEndChat}
            />
          </>
        )}

        {/* Progress indicator — only on small screens */}
        <div className="lg:hidden flex-none">
          {conversationStarted && currentSection !== "Completion" && (
            <div
              className="relative flex-shrink-0 ml-2"
              style={{ height: "7vh", width: "7vh" }}
            >
              <svg
                className="absolute inset-0"
                width="100%"
                height="100%"
                viewBox="0 0 40 40"
                role="img"
                aria-hidden="true"
              >
                <title>Progress Circle</title>
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="white"
                  stroke="rgba(233, 237, 237, 1)"
                  strokeWidth="10"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="white"
                  stroke="#25636F"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progressPercentage / 100)}`}
                  transform="rotate(-90 20 20)"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-public font-medium text-xs leading-[120%] tracking-[-0.01em] text-center align-middle text-[#012322] bg-white"
                  style={{ marginTop: "1px" }}
                >
                  {progressText}
                </span>
              </div>
            </div>
          )}
        </div>
      </Box>

      <div className="lg:hidden sm:hidden xs:hidden">
        {conversationStarted && currentSection !== "Completion" && (
          <div className="flex justify-end px-8">
            <div className="inline-block bg-white rounded-lg shadow-[2px_0px_12px_0px_rgba(0,0,0,0.08)] z-20">
              <div className="px-5 py-2">
                <Typography
                  sx={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 500,
                    fontSize: "12px",
                  }}
                  className="leading-[120%] tracking-[-0.01em] text-[#000000]"
                >
                  {currentSection}
                </Typography>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
