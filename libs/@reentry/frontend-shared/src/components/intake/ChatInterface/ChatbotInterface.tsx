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

import type React from "react";
import { useEffect, useRef, useState } from "react";

import { useSocket } from "../../../websockets/IntakeSocketContext";
import ChatInput from "./ChatInput";
import { ChatMessageBubble } from "./ChatMessageBubble";

export const ChatbotInterface: React.FC = () => {
  const {
    intakeContext: { messages, waitingForAIInput, connectionStatus },
  } = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wasAtBottom, setWasAtBottom] = useState(true); // Start at bottom on load
  // Detect if the user is currently at the bottom (with small tolerance)
  const isAtBottom = () => {
    const container = containerRef.current;
    if (!container) return false;

    const threshold = 5; // Allow 5px tolerance
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold
    );
  };

  // Track scroll position to determine if user is at bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setWasAtBottom(isAtBottom());
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current && wasAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, wasAtBottom]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full px-4 sm:px-6">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar pt-10 sm:pt-12"
        ref={containerRef}
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
            <ChatMessageBubble key="typing-indicator" isTyping={true} />
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 pb-6">
        <ChatInput />
      </div>
    </div>
  );
};
