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
import React from "react";

import styles from "~@reentry/frontend/components/IntakeChatV2/Chat/ChatMessageBubble.module.css";
import {
  CaseWorkerAvatar,
  ClientAvatar,
} from "~@reentry/frontend/components/IntakeChatV2/Chat/CustomAvatar";
import { Message } from "~@reentry/frontend/components/IntakeChatV2/Chat/types";

interface MessageBubbleProps {
  message?: Message;
  name?: string;
  isTyping?: boolean;
}

const TypingDots: React.FC = () => (
  <span className={styles["dotContainer"]}>
    <span className={`${styles["dot"]} ${styles["dotDelay0"]}`} />
    <span className={`${styles["dot"]} ${styles["dotDelay1"]}`} />
    <span className={`${styles["dot"]} ${styles["dotDelay2"]}`} />
  </span>
);

export const ChatMessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isTyping = false,
}) => {
  if (!message && !isTyping) return null;
  if (message && !message.content?.trim()) return null;

  const isUser = message?.from_role === "client";
  const containerClass = isUser
    ? styles["userContainer"]
    : styles["caseContainer"];
  const roleClass = isUser ? styles["user"] : styles["caseWorker"];
  const bubbleClass = isUser ? styles["userBubble"] : styles["caseBubble"];

  const content = isTyping ? <TypingDots /> : message?.content;
  const leadingAvatar = !isUser && (
    <div className={styles["avatarDesktop"]}>
      <CaseWorkerAvatar />
    </div>
  );

  const trailingAvatar = isUser && (
    <div className={styles["avatarDesktop"]}>
      <ClientAvatar />
    </div>
  );

  return (
    <div className={`${styles["wrapper"]} ${roleClass}`}>
      <div className={containerClass}>
        {leadingAvatar}

        <div className={styles["bubbleWrapper"]}>
          <div className={`${styles["bubble"]} ${bubbleClass}`}>
            <Typography variant="body1" className={styles["bubbleText"]}>
              {content}
            </Typography>
          </div>
        </div>

        {trailingAvatar}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
