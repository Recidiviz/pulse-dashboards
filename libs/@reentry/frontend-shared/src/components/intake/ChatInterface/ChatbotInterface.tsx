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

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { useSocket } from "../../../websockets/IntakeSocketContext";
import ChatInput from "./ChatInput";
import { ChatMessageBubble } from "./ChatMessageBubble";

export const ChatbotInterface: React.FC = () => {
  const {
    intakeContext: {
      messages,
      waitingForAIInput,
      connectionStatus,
      clientPseudoId,
    },
  } = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is at the bottom of the scroll container
  const checkIfAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 50; // pixels from bottom to consider "at bottom"
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    setShowScrollButton(!isAtBottom);
    return isAtBottom;
  };

  // Scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    const isAtBottom = checkIfAtBottom();
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full px-4 sm:px-6">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={checkIfAtBottom}
        className="flex-1 overflow-y-auto no-scrollbar pt-10 sm:pt-12"
      >
        <div className="flex flex-col gap-4 sm:gap-6">
          {messages.map((message, index) => (
            <ChatMessageBubble
              // eslint-disable-next-line react/no-array-index-key
              key={`${message.id}-${index}`}
              message={message}
            />
          ))}

          {/* Show typing indicator when AI is thinking or when no messages initially */}
          {waitingForAIInput ||
          (!messages.length && connectionStatus === "connected") ? (
            <ChatMessageBubble
              key="typing-indicator"
              isTyping={true}
              clientPseudoId={clientPseudoId}
            />
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 md:pb-6 xs:pb-0 relative">
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2">
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1 px-3 py-2 bg-white shadow-lg hover:shadow-xl border border-gray-200 rounded-full text-sm text-[#2B5469] font-medium transition-shadow"
            >
              <KeyboardArrowDownIcon className="text-[#2B5469] !text-[18px]" />
              More messages
            </button>
          </div>
        )}

        <ChatInput
          clientPseudoId={clientPseudoId}
          alreadyHasMessages={messages.length > 0}
          onInputFocus={scrollToBottom}
        />
      </div>
    </div>
  );
};
