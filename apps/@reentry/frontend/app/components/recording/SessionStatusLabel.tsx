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

import { useRecordingSessionStatus } from "@/app/hooks/useRecordingSessionStatus";
import type { UIRecordingStatus } from "@/app/types/recording";

interface SessionStatusLabelProps {
	sessionId: string;
	enablePolling?: boolean;
}

const getStatusDisplayText = (status: UIRecordingStatus): string => {
	switch (status) {
		case "recording":
			return "recording";
		case "paused":
			return "Paused";
		case "completed":
			return "completed";
		case "error":
			return "Error";
		case "created":
			return "created";
		case "processing":
			return "Processing";
		default:
			return "Unknown";
	}
};

const getStatusColor = (status: UIRecordingStatus): string => {
	switch (status) {
		case "recording":
			return "text-red-600";
		case "paused":
			return "text-gray-600";
		case "completed":
			return "text-green-600";
		case "error":
			return "text-red-600";
		case "created":
			return "text-blue-600";
		case "processing":
			return "text-yellow-600";
		default:
			return "text-gray-500";
	}
};

export const SessionStatusLabel: React.FC<SessionStatusLabelProps> = ({
	sessionId,
	enablePolling = false,
}) => {
	const { statusData, isLoading, error } = useRecordingSessionStatus(
		sessionId,
		enablePolling,
	);

	if (error) {
		return <div className="text-xs text-red-500">Status unavailable</div>;
	}

	if (isLoading || !statusData) {
		return <div className="text-xs text-gray-500">Loading status...</div>;
	}

	return (
		<div className="flex items-center gap-2 text-xs">
			<span className="text-gray-500">Session Status:</span>
			<span className={`font-medium ${getStatusColor(statusData.status)}`}>
				{getStatusDisplayText(statusData.status)}
			</span>
			{statusData.chunk_count > 0 && (
				<span className="text-gray-400">({statusData.chunk_count} chunks)</span>
			)}
		</div>
	);
};
