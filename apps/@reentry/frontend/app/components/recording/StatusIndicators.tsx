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

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SignalWifiConnectedNoInternet4Icon from "@mui/icons-material/SignalWifiConnectedNoInternet4";
import { Tooltip } from "@mui/material";
import { CloudOff, CloudUpload } from "lucide-react";

interface StatusIndicatorsProps {
  isOnline: boolean;
  cannotConnectToServer: boolean;
  uploadDuration: number;
  recordDuration: number;
}

export default function StatusIndicators({
  isOnline,
  cannotConnectToServer,
  uploadDuration,
  recordDuration,
}: StatusIndicatorsProps) {
  const uploadPercentage =
    recordDuration > 0
      ? Math.min(Math.round((uploadDuration / recordDuration) * 100), 100)
      : 0;

  if (!isOnline) {
    return (
      <Tooltip
        title={`No internet connection. ${100 - uploadPercentage}% of audio remaining to sync. Sync will resume when connection is restored.`}
      >
        <SignalWifiConnectedNoInternet4Icon
          className="text-red-600"
          style={{ fontSize: 14 }}
        />
      </Tooltip>
    );
  }

  if (cannotConnectToServer) {
    return (
      <Tooltip title="Cannot connect to server. Retrying automatically in the background.">
        <CloudOff size={14} className="text-orange-500" />
      </Tooltip>
    );
  }

  if (uploadPercentage > 0 && uploadPercentage < 100) {
    return (
      <Tooltip
        title={`Syncing audio to server: ${100 - uploadPercentage}% remaining.`}
      >
        <CloudUpload size={14} className="text-blue-500" />
      </Tooltip>
    );
  }

  if (uploadPercentage === 100) {
    return (
      <Tooltip title="All audio successfully synced to server.">
        <CheckCircleIcon className="text-green-600" style={{ fontSize: 14 }} />
      </Tooltip>
    );
  }

  return null;
}
