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

import { Box, CircularProgress, Typography } from "@mui/material";
import { useState } from "react";

import ChatbotInterface from "~@reentry/frontend/components/intake/ChatInterface/ChatbotInterface";
import ChatHeader from "~@reentry/frontend/components/intake/ChatInterface/ChatHeader";
import Sidebar from "~@reentry/frontend/components/intake/ChatInterface/Sidebar";
import { ConnectionErrorAlert } from "~@reentry/frontend/websockets/components/ConnectionErrorAlert";
import { useSocket } from "~@reentry/frontend/websockets/IntakeSocketContext";

const LinearChatComponent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    intakeContext: { isLoading, error, intakeStatus },
  } = useSocket();

  if ((error && error.type === "api") || intakeStatus === "error") {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <ConnectionErrorAlert />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {error?.message ||
            "There was an issue processing your intake, please try again"}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <ConnectionErrorAlert />
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading intake information...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <ConnectionErrorAlert />
      {/* Header */}
      <div className="relative max-w-full overflow-x-hidden">
        <ChatHeader isConversationInProgress={true} />
      </div>
      {/* Main content */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            hidden lg:block
            fixed md:relative
            inset-y-0 left-0
            z-50
            w-[280px] md:flex-[0_0_30%]
            bg-white
            shadow-lg md:shadow-none
            transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Overlay */}
        <div
          className={`
            ${sidebarOpen ? "block" : "hidden"}
            lg:hidden
            fixed inset-0
            bg-black/50
            z-40
            transition-opacity duration-300
            opacity-100
          `}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Chat */}
        <div className="flex-1 w-full bg-[#F9FAFA] overflow-hidden">
          <ChatbotInterface />
        </div>
      </div>
    </div>
  );
};

export default LinearChatComponent;
