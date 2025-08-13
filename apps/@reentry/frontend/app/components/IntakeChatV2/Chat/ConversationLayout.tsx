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

import { Box, CircularProgress, Typography } from "@mui/material";
import React, { useRef, useState } from "react";

import ChatInput from "~@reentry/frontend/components/IntakeChatV2/Chat/ChatInput";
import ChatMessageBubble from "~@reentry/frontend/components/IntakeChatV2/Chat/ChatMessageBubble";
import styles from "~@reentry/frontend/components/IntakeChatV2/Chat/ConversationLayout.module.css";
import Sidebar from "~@reentry/frontend/components/IntakeChatV2/Chat/Sidebar";
import { useAutoScroll } from "~@reentry/frontend/components/IntakeChatV2/hooks/useAutoScroll";
import { useChatContext } from "~@reentry/frontend/components/IntakeChatV2/providers/ChatProvider";
import { ConnectionStatus } from "~@reentry/frontend/components/IntakeChatV2/types";
interface ConversationLayoutProps {
  connectionStatus?: ConnectionStatus;
}

const ConversationLayout: React.FC<ConversationLayoutProps> = ({
  connectionStatus,
}) => {
  const { messages, waitingForAIInput } = useChatContext();
  const { connectionState } = connectionStatus || {};
  const containerRef = useRef<HTMLDivElement>(null);

  useAutoScroll(containerRef, [messages]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (connectionState === "connecting") {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading intake information...
        </Typography>
      </Box>
    );
  }

  return (
    <div className={styles["container"]}>
      <div className={styles["main"]}>
        <div
          className={`${styles["sidebar"]} ${sidebarOpen ? styles["sidebarOpen"] : styles["sidebarClosed"]}`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <div
          className={`${styles["overlay"]} ${sidebarOpen ? styles["overlayVisible"] : styles["overlayHidden"]}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Chat */}
        <div className={styles["chat"]}>
          <div className={styles["chatContainer"]}>
            <div ref={containerRef} className={styles["messagesWrapper"]}>
              <div className={styles["messagesList"]}>
                {messages?.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                {waitingForAIInput && (
                  <ChatMessageBubble key="typing-indicator" isTyping />
                )}
              </div>
            </div>
            <div className={styles["inputContainer"]}>
              <ChatInput />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationLayout;
