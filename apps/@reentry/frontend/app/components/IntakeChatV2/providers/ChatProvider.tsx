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

import { skipToken } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";

import { trpc } from "~@reentry/frontend/components/IntakeChatV2/IntakeChatV2";
import type { components } from "~@reentry/frontend/recidiviz-schema";

interface ChatState {
  messages: components["schemas"]["IntakeMessageResponse"][];
  waitingForAIInput: boolean;
  error?: string;
  sendMessage: (text: string) => Promise<void>;
}

const ChatContext = createContext<ChatState | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

export const ChatProvider: React.FC<{
  intakeId?: string;
  children?: React.ReactNode;
}> = ({ intakeId, children }) => {
  const [messages, setMessages] = useState<
    components["schemas"]["IntakeMessageResponse"][]
  >([]);
  const [waitingForAIInput, setWaitingForAIInput] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setMessages([]);
    setWaitingForAIInput(false);
    setError(undefined);
  }, [intakeId]);

  const reply = trpc.intake.reply.useMutation();
  trpc.intake.chat.useSubscription(intakeId ? { intakeId } : skipToken, {
    // TODO: Sort out the types for data
    onData(data) {
      if ("type" in data && data.type === "loading") {
        setWaitingForAIInput(true);
      } else if ("messages" in data) {
        const newMessages =
          data.messages as components["schemas"]["IntakeMessageResponse"][];
        setMessages((prev) => [...prev, ...newMessages]);
        setWaitingForAIInput(false);
      }
    },
    onError(err) {
      setError(err.message);
    },
  });

  const sendMessage = async (text: string) => {
    if (!intakeId) return;

    try {
      setWaitingForAIInput(true);
      await reply.mutateAsync({ intakeId, response: text });
      setMessages((prev) => [
        ...prev,
        {
          content: text,
          from_role: "client",
        } as components["schemas"]["IntakeMessageResponse"],
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setWaitingForAIInput(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        waitingForAIInput,
        error,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
