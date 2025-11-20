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

import { Alert, Box, Button } from "@mui/material";
import { useEffect, useState } from "react";

import { useSocket } from "../IntakeSocketContext";

export const ConnectionErrorAlert = () => {
  const {
    intakeContext: { connectionStatus, intakeStatus, error, disconnectReason },
    intakeDispatchContext: { reconnect },
  } = useSocket();

  const [connectingDuration, setConnectingDuration] = useState(0);

  // Track how long we've been in connecting state
  useEffect(() => {
    if (connectionStatus === "connecting") {
      const interval = setInterval(() => {
        setConnectingDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    setConnectingDuration(0);
    return;
  }, [connectionStatus]);
  if (
    connectionStatus === "connected" ||
    intakeStatus === "error" ||
    error?.type === "api" ||
    intakeStatus !== "in_progress"
  ) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", position: "fixed", top: 0, zIndex: 1100 }}>
      <Alert
        severity={connectionStatus === "error" ? "warning" : "info"}
        action={
          connectionStatus === "error" ||
          connectionStatus === "disconnected" ||
          (connectionStatus === "connecting" && connectingDuration > 5) ? (
            <Button color="inherit" size="small" onClick={reconnect}>
              Reconnect
            </Button>
          ) : null
        }
      >
        {/* eslint-disable-next-line no-nested-ternary */}
        {connectionStatus === "error"
          ? "Connection error - please reconnect"
          : // eslint-disable-next-line no-nested-ternary
            connectionStatus === "disconnected"
            ? disconnectReason || "Connection lost - please reconnect"
            : // eslint-disable-next-line no-nested-ternary
              connectionStatus === "connecting" && connectingDuration > 5
              ? "Connection taking longer than expected"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : connectionStatus}
      </Alert>
    </Box>
  );
};
