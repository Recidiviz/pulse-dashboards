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

import { MessageSquare } from "lucide-react";
import React, { useEffect, useRef,useState } from "react";

import { $api } from "@/app/api";
import { ChatMessageBubble } from "@/app/components/intake/ChatInterface/ChatMessageBubble";
import { useAuth } from "@/app/lib/auth";
import type { components } from "@/app/recidiviz-schema";

type IntakeMessage = components["schemas"]["IntakeMessageResponse"];
type ClientIntakeSection = components["schemas"]["ClientIntakeSectionResponse"];
type ClientRecord = components["schemas"]["ClientRecordResponse"];

const SectionChatInterface = ({
	section,
	intakeId,
	isActive,
	client,
}: {
	section: ClientIntakeSection;
	intakeId: string;
	isActive: boolean;
	client: ClientRecord;
}) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const accessToken = useAuth().getAccessToken();

	const shouldFetchMessages =
		isActive && section.completion_status !== "not_started";
	const encodedSectionTitle = encodeURIComponent(section.intake_section.title);
	const clientFullName = client?.full_name
		? `${client.full_name.given_names} ${client.full_name.surname}`.trim()
		: "";

	const {
		data,
		isLoading: messagesLoading,
		error: messagesError,
	} = $api.useQuery(
		"get",
		"/intake/admin/{intake_id}/{section_title}/messages",
		{
			params: {
				path: {
					intake_id: intakeId,
					section_title: encodedSectionTitle,
				},
			},
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			enabled: shouldFetchMessages,
		},
	);

	const messages: IntakeMessage[] = data || [];

	useEffect(() => {
		if (messagesError?.detail) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const errorMessage = messagesError.detail as any;

			if (errorMessage.includes("No messages found for intake ID")) {
				setErrorMessage("No messages at the moment.");
			} else {
				setErrorMessage("Failed to load messages. Please try again.");
			}
		} else {
			setErrorMessage(null);
		}
	}, [messagesError]);

	const normalize = (text?: string) => text?.trim().toLowerCase() || "";

	const formattedMessages = messages.filter((msg, index, arr) => {
		const normalizedContent = normalize(msg.content);
		const isWelcomeBackMessage = normalizedContent.includes(
			"thanks for joining again! let's continue our conversation",
		);

		// Rule 1: Remove consecutive "welcome back" messages
		if (isWelcomeBackMessage) {
			const prev = arr[index - 1];
			const prevNormalized = normalize(prev?.content);
			if (prevNormalized === normalizedContent) {
				return false;
			}
		}

		// Rule 2: If intake is completed, remove "welcome back" if it's the last message
		if (isWelcomeBackMessage && section.completion_status === "completed") {
			return false;
		}

		return true;
	});

	if (!isActive) return null;

	const renderContent = () => {
		if (section.completion_status === "not_started") {
			return (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center text-gray-500">
						<MessageSquare size={36} className="mx-auto mb-4 text-gray-300" />
						<p className="text-lg font-medium mb-2">No messages yet</p>
						<p className="text-sm">
							This section has not been started by the client.
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className="h-full overflow-y-auto pr-2 p-3" ref={containerRef}>
				{/* eslint-disable-next-line no-nested-ternary */}
				{messagesLoading ? (
					<div className="flex justify-center items-center h-full pt-20">
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#006B66]" />
					</div>
				) : messagesError ? (
					<div className="text-center my-8 align-middle">{errorMessage}</div>
				) : (
					<div className="flex flex-col gap-4 sm:gap-6">
						{formattedMessages.length === 0 ? (
							<div className="text-center text-gray-500 my-8">
								No messages in this section
							</div>
						) : (
							formattedMessages.map((message) => (
								<ChatMessageBubble
									key={message.id}
									message={message}
									name={clientFullName}
								/>
							))
						)}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="h-full bg-gray-50 pt-4 rounded-md">{renderContent()}</div>
	);
};

export default SectionChatInterface;
