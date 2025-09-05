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

import { Box, Typography } from "@mui/material";
import type React from "react";

import { ClientAvatar } from "~@reentry/frontend/components/intake/ChatInterface/CustomAvatar";
import { useSocket } from "~@reentry/frontend/websockets/IntakeSocketContext";

const ChatHeader: React.FC = () => {
  const {
    intakeContext: {
      client_name,
      clientPseudoId,
      allSections,
      conversationStarted,
      currentSection,
    },
  } = useSocket();

  const completedSections = allSections?.filter(
    (section) => section.completion_status === "completed",
  ).length;
  const totalSections = allSections?.length;
  const progressText = `${completedSections}/${totalSections}`;

  const progressPercentage =
    totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  const currentSectionIndex = allSections?.findIndex(
    (section) => section.completion_status === "in_progress",
  );

  const currentSectionTitle =
    currentSectionIndex !== -1
      ? allSections?.[currentSectionIndex].intake_section.title
      : allSections?.[0]?.intake_section.title || "Intake";

  return (
    <>
      {/* Main header */}
      <Box
        className="h-16 sm:h-20 md:h-20 border-b md:border-slate-400/40 lg:border-slate-200/40 bg-white flex items-center justify-between px-4 sm:px-8 py-12"
        sx={{
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {/* Client info */}
        <Box className="flex items-center overflow-hidden">
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

        {/* Progress indicator — only on small screens */}
        <div className="lg:hidden">
          {conversationStarted && currentSection !== "Completion" && (
            <div className="relative h-10 w-10 flex-shrink-0 ml-2">
              <svg
                className="absolute inset-0"
                width="40"
                height="40"
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

      <div className="lg:hidden">
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
                  {currentSectionTitle}
                </Typography>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatHeader;
