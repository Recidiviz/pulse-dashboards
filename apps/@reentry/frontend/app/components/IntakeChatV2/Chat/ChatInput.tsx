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

import SendIcon from "@mui/icons-material/Send";
import React, { useEffect, useRef, useState } from "react";

import styles from "~@reentry/frontend/components/IntakeChatV2/Chat/ChatInput.module.css";
import { useChatContext } from "~@reentry/frontend/components/IntakeChatV2/providers/ChatProvider";

const ChatInput: React.FC = () => {
  const { waitingForAIInput, intakeStatus, error, sendMessage, setEndDate } =
    useChatContext();

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = waitingForAIInput || isSending || !!error;
  const isIntakeComplete = intakeStatus === "complete";

  const onSend = async () => {
    if (isDisabled || !inputValue.trim()) return;
    setIsSending(true);
    setInputValue("");
    setIsSending(false);
    await sendMessage(inputValue.trim());
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (!waitingForAIInput) {
      textareaRef.current?.focus();
    }
  }, [waitingForAIInput]);

  return (
    <div className={styles["container"]}>
      <div className={styles["inputRow"]}>
        {isIntakeComplete ? (
          // End of Conversation Continue Button
          <button
            type="button"
            onClick={() => setEndDate(new Date())}
            className={`${styles["buttonCommon"]} ${styles["continue"]}`}
          >
            Continue
          </button>
        ) : (
          // Chat Input Text Area
          <div className={styles["inputWrapper"]}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              disabled={isDisabled}
              placeholder="Write a message..."
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles["textarea"]}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={isDisabled || !inputValue.trim()}
              className={styles["sendButton"]}
            >
              <SendIcon
                className={
                  isDisabled || !inputValue.trim()
                    ? styles["sendIconDisabled"]
                    : styles["sendIcon"]
                }
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
