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

import { useEffect, useState } from "react";

import AddressForm from "@/app/components/intake/AddressForm";
import ChatHeader from "@/app/components/intake/ChatInterface/ChatHeader";
import ConversationLayout from "@/app/components/intake/ChatInterface/ConversationLayout";
import IntakeCompleted from "@/app/components/intake/IntakeCompleted";
import {
	PreIntakeNoteOne,
	PreIntakeNoteTwo,
} from "@/app/components/intake/PreIntakeNote";
import { useSocket } from "@/app/websockets/IntakeSocketContext";

export default function IntakeRouter() {
	const { intakeContext, intakeDispatchContext } = useSocket();
	const {
		intakeStatus,
		currentSection,
		conversationStarted,
		has_accepted_terms,
		has_address,
	} = intakeContext;
	const { startConversation } = intakeDispatchContext;

	const [preIntakeStep, setPreIntakeStep] = useState<"one" | "two">(() => {
		if (typeof window !== "undefined") {
			const saved = sessionStorage.getItem("preIntakeStep");
			return (saved as "one" | "two") || "one";
		}
		return "one";
	});

	// Updated completion logic to check for address collection
	const isCompleted = intakeStatus === "completed";
	const needsAddress =
		intakeStatus === "in_progress" &&
		currentSection === "Completion" &&
		!has_address;
	const isPreIntake =
		(intakeStatus === "in_progress" || intakeStatus === "created") &&
		!conversationStarted &&
		!needsAddress &&
		!isCompleted;
	const isConversationInProgress =
		(intakeStatus === "in_progress" || intakeStatus === "created") &&
		conversationStarted &&
		!needsAddress &&
		!isCompleted;

	useEffect(() => {
		if (typeof window !== "undefined") {
			sessionStorage.setItem("preIntakeStep", preIntakeStep);
		}
	}, [preIntakeStep]);

	const handleStartConversation = () => {
		if (typeof window !== "undefined") {
			sessionStorage.removeItem("preIntakeStep");
		}
		startConversation();
	};
	// Auto-start conversation if it's already underway
	useEffect(() => {
		if (
			intakeStatus === "in_progress" &&
			has_accepted_terms &&
			!conversationStarted &&
			!isCompleted // Don't auto-start if completed
		) {
			startConversation();
		}
	}, [
		intakeStatus,
		has_accepted_terms,
		conversationStarted,
		startConversation,
		isCompleted,
	]);

	const shouldRenderHeader = !isConversationInProgress;

	return (
		<div className="flex flex-col h-screen bg-slate-50">
			{shouldRenderHeader && (
				<div className="relative max-w-full overflow-x-hidden">
					<ChatHeader />
				</div>
			)}

			<div className="flex-1">
				{isCompleted && <IntakeCompleted />}

				{needsAddress && (
					<AddressForm
						onError={(error) => {
							console.error("Address submission error:", error);
							// Could add toast notification here
						}}
					/>
				)}

				{isPreIntake && preIntakeStep === "one" && (
					<PreIntakeNoteOne onContinue={() => setPreIntakeStep("two")} />
				)}

				{isPreIntake && preIntakeStep === "two" && (
					<PreIntakeNoteTwo
						onGoBack={() => setPreIntakeStep("one")}
						onStartIntake={handleStartConversation}
					/>
				)}

				{isConversationInProgress && <ConversationLayout />}
			</div>
		</div>
	);
}
