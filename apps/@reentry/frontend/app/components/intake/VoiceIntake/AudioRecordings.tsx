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

import { Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { $api } from "@/app/api";
import PrimaryButton from "@/app/components/buttons/PrimaryButton";
import { useAuth } from "@/app/lib/auth";
import { showErrorToast, showSuccessToast } from "@/app/utils/toast";

interface AudioRecordingsProps {
	clientId: string;
}

const AudioRecordings: React.FC<AudioRecordingsProps> = ({ clientId }) => {
	const { getAccessToken } = useAuth();
	const router = useRouter();
	const [isCreating, setIsCreating] = useState(false);

	// Fetch recording sessions for the client
	const {
		data: sessions,
		isLoading,
		error,
		refetch,
	} = $api.useQuery("get", "/recordings/sessions/clients/{client_id}", {
		params: { path: { client_id: clientId } },
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
		setIsCreating(true);
		try {
			const newSession = await createSession({
				body: { client_id: clientId },
				headers: {
					Authorization: `Bearer ${getAccessToken()}`,
					"Content-Type": "application/json",
				},
			});
			showSuccessToast("Recording session created successfully");

			// Navigate to the new session page
			if (newSession?.id) {
				router.push(`/clients/audio-recording/${clientId}/${newSession.id}`);
			} else {
				refetch(); // Fallback: refresh the sessions list
			}
		} catch (error) {
			console.error("Error creating recording session:", error);
			showErrorToast("Failed to create recording session");
		} finally {
			setIsCreating(false);
		}
	};

	const handleSessionClick = (sessionId: string) => {
		router.push(`/clients/audio-recording/${clientId}/${sessionId}`);
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="mb-4">
					<Typography
						variant="h6"
						className="text-[#003331] text-base font-semibold"
					>
						Loading Audio Recordings...
					</Typography>
				</div>
				<div className="flex justify-center items-center h-20">
					<div className="w-8 h-8 border-4 border-t-[#006B66] border-[#e0f2f1] rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="mb-4">
					<Typography
						variant="h6"
						className="text-[#003331] text-base font-semibold"
					>
						Audio Recording
					</Typography>
				</div>
				<div className="text-red-500 text-center py-4">
					Error loading recording sessions
				</div>
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
		<div className="w-full py-6 px-16">
			{shouldShowNewSessionButton && (
				<PrimaryButton
					buttonText={
						isCreating ? "Creating..." : "Begin live intake Assessment"
					}
					className="inline-flex w-full items-right min-w-2xl max-w-2xl px-5 py-2 text-white text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case mb-6"
					onClick={handleCreateSession}
					disabled={isCreating}
				/>
			)}

			<div className="space-y-4">
				{/*Only one session available for recording at a time. so taking the earliest session.*/}
				{processedSessions && processedSessions.length > 0 && (
					<div className="space-y-3">
						<PrimaryButton
							buttonText={"Go to the assessment"}
							className="inline-flex w-full items-right px-5 py-2 text-white text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case mb-6"
							onClick={() => handleSessionClick(processedSessions[0].id)}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default AudioRecordings;
