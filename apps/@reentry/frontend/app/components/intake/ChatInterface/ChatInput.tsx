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

import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, TextareaAutosize } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { useSocket } from "~@reentry/frontend/websockets/IntakeSocketContext";

const ChatInput = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    intakeContext: {
      connectionStatus,
      waitingForAIInput,
      intakeStatus,
      currentSection,
    },
    intakeDispatchContext: { sendMessage },
  } = useSocket();

  const onSend = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    await sendMessage(inputValue.trim());
    setInputValue("");
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // eslint-disable-next-line no-use-before-define
    if (e.key === "Enter" && !isInputDisabled) {
      // Check if device is mobile/tablet
      const isMobileOrTablet =
        /mobile|Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;

      if (isMobileOrTablet) {
        // On mobile/tablet: Enter makes a new line, regardless of shift key
        // Let the default behavior handle the newline
      } else {
        // On desktop: Enter sends message, Shift+Enter makes a new line
        if (e.shiftKey) {
          // Shift+Enter: add new line - let default behavior handle it
        } else {
          // Enter: send message
          e.preventDefault();
          onSend();
        }
      }
    }
  };

  const isInputDisabled =
    intakeStatus !== "in_progress" ||
    waitingForAIInput ||
    connectionStatus !== "connected" ||
    currentSection === "Completion";

  useEffect(() => {
    if (!waitingForAIInput && !isInputDisabled) {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [waitingForAIInput, isInputDisabled]);

  useEffect(() => {
    if (connectionStatus === "connecting") {
      setIsSending(false);
    }
  }, [connectionStatus]);

  const getPlaceholderText = () => {
    if (connectionStatus === "connecting") return "Connecting...";
    return "Write a message";
  };

  return (
    <Box className="p-4 flex flex-col">
      {(intakeStatus === "completed" || currentSection === "Completion") && (
        <Box className="flex flex-col justify-center items-center p-2 rounded-md text-center w-4/5 min-h-[100px] break-words">
          <span className="text-sm text-gray-500">
            Your intake assessment has been completed, you can no longer send
            any new messages.
          </span>
          <span className="text-sm mt-1 text-gray-600">
            Feel free to close the window now.
          </span>
        </Box>
      )}

      <Box className="flex items-end">
        <Box
          className={
            "flex items-center justify-center flex-1 relative rounded-xl bg-white border border-[#2B546933] p-1 transition-all"
          }
        >
          <TextareaAutosize
            ref={textareaRef}
            minRows={1}
            maxRows={6}
            value={inputValue}
            disabled={isInputDisabled}
            placeholder={getPlaceholderText()}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`
							w-full max-w-[800px]
							border-none outline-none resize-none
							overflow-auto font-public text-md
							tracking-[-1%] px-[16px] py-[8px]
							${isInputDisabled ? "text-[#525454] text-opacity-20 placeholder-[#2B5469] placeholder-opacity-20" : "text-[#2B5469] text-opacity-100 placeholder-[#2B5469] placeholder-opacity-80"}
						`}
          />

          <IconButton
            onClick={onSend}
            disabled={isInputDisabled || !inputValue.trim()}
            className="absolute right-3 border-none bg-transparent"
          >
            <SendIcon
              className={`text-[#2B5469] ${
                isInputDisabled || !inputValue.trim()
                  ? "text-opacity-20"
                  : "text-opacity-60"
              } text-[17px] rotate-[-50deg] leading-[22px] tracking-[-0.43px] font-normal`}
            />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInput;
