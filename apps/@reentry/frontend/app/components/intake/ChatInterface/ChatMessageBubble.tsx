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
import type React from "react";

import {
	CaseWorkerAvatar,
	ClientAvatar,
} from "@/app/components/intake/ChatInterface/CustomAvatar";
import type { components } from "@/app/recidiviz-schema";
interface MessageBubbleProps {
	message?: components["schemas"]["IntakeMessageResponse"];
	name?: string;
	isTyping?: boolean;
}

const TypingDots: React.FC = () => (
	<>
		<style>
			{`
        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-8px) scale(1.2);
            opacity: 1;
          }
        }

        .dot-bounce {
          animation: dot-bounce 1.4s infinite ease-in-out;
        }
      `}
		</style>
		<span className="inline-flex items-center gap-1 h-[24px] align-middle">
			<span
				className="w-2.5 h-2.5 bg-[#25636F] rounded-full dot-bounce"
				style={{ animationDelay: "0s" }}
			/>
			<span
				className="w-2.5 h-2.5 bg-[#25636F] rounded-full dot-bounce"
				style={{ animationDelay: "0.2s" }}
			/>
			<span
				className="w-2.5 h-2.5 bg-[#25636F] rounded-full dot-bounce"
				style={{ animationDelay: "0.4s" }}
			/>
		</span>
	</>
);

export const UserBubbleTail: React.FC = () => (
	<svg
		className="absolute right-[-10px] bottom-0 w-[18px] h-[37px]"
		width="18"
		height="37"
		viewBox="0 0 18 37"
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>Message bubble</title>
		<path d="M0,0 C0,0 0,11 13,37 C10,37 0,30 0,33 L0,37 Z" fill="#2B6C75" />
	</svg>
);

export const CaseWorkerBubbleTail: React.FC = () => (
	<svg
		className="absolute left-[-18px] bottom-0 w-[18px] h-[37px] overflow-visible transform scale-x-[-1]"
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>Message bubble tail</title>
		<path d="M0,0 C0,0 0,10 13,37 C10,37 0,30 0,33 L0,37 Z" fill="white" />
	</svg>
);

export const ChatMessageBubble: React.FC<MessageBubbleProps> = ({
	message,
	name,
	isTyping = false,
}) => {
	// Return nothing if no message and not typing
	if (!message && !isTyping) {
		return null;
	}

	// Return nothing if message exists but has no content
	if (message && !message.content?.trim()) {
		return null;
	}

	const isUser = message?.from_role === "client";

	return (
		<div
			className={`flex w-full px-4 mb-4 ${isUser ? "justify-end" : "justify-start"}`}
		>
			{isUser ? (
				<div className="flex flex-col items-end sm:flex-row sm:items-start">
					{/* Avatar on top for mobile, hidden for desktop */}
					<div className="flex-shrink-0 mb-2 sm:hidden">
						<ClientAvatar name={name} />
					</div>

					<div className="relative inline-flex flex-col items-end">
						<div className="py-2 px-3 rounded-[16px] shadow-sm max-w-[80vw] sm:max-w-sm md:max-w-md bg-[#2B6C75] text-white break-words">
							<Typography className="break-words whitespace-pre-wrap">
								{isTyping ? <TypingDots /> : message?.content}
							</Typography>
						</div>
						<UserBubbleTail />
					</div>

					{/* Client Avatar - Right side for desktop */}
					<div className="hidden sm:flex flex-shrink-0 ml-2">
						<ClientAvatar name={name} />
					</div>
				</div>
			) : (
				<div className="flex flex-col items-start sm:flex-row sm:items-start">
					{/* Caseworker Avatar */}
					<div className="flex-shrink-0 mr-2">
						<CaseWorkerAvatar />
					</div>

					{/* Message Bubble */}
					<div className="relative inline-flex flex-col items-start">
						<div className="py-2 px-3 rounded-[16px] shadow-sm max-w-[80vw] sm:max-w-sm md:max-w-md bg-white text-[#1E3A3A] break-words">
							<Typography
								variant="body1"
								className="font-inter text-[16px] leading-[1.2] font-normal break-words whitespace-pre-wrap"
							>
								{isTyping ? <TypingDots /> : message?.content}
							</Typography>
						</div>

						{/* Tail */}
						<CaseWorkerBubbleTail />
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatMessageBubble;
