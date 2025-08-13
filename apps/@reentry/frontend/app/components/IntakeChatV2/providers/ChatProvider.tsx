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
import { toast } from "react-toastify";

import { StepStatus } from "~@reentry/frontend/components/IntakeChatV2/Chat/types";
import { trpc } from "~@reentry/frontend/components/IntakeChatV2/IntakeChatV2";
import type { components } from "~@reentry/frontend/recidiviz-schema";

interface ChatState {
  // TODO: Import proper type for sections
  sections?: {
    completion_status: StepStatus;
    intake_section: {
      title: string;
      description: string;
    };
  }[];
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
  // TODO: Replace placeholder sections for the chat with ones we fetch
  const [placeholderSections] = useState<ChatState["sections"]>([
    {
      completion_status: "not_started",
      intake_section: {
        title: "Welcome",
        description: "Let's get started with your intake.",
      },
    },
    {
      completion_status: "not_started",
      intake_section: {
        title: "Personal Information",
        description: "Please provide your personal details.",
      },
    },
    {
      completion_status: "not_started",
      intake_section: {
        title: "Background Information",
        description: "We need some background information.",
      },
    },
  ]);
  const [waitingForAIInput, setWaitingForAIInput] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setMessages([]);
    setWaitingForAIInput(false);
    setError(undefined);
  }, [intakeId]);

  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      toast.error(
        "There was an issue connecting to the chat. Please try again later.",
        { autoClose: false, toastId: "chat-setup-error" },
      );
    }
  }, [error]);

  const reply = trpc.intake.reply.useMutation();
  trpc.intake.chat.useSubscription(intakeId ? { intakeId } : skipToken, {
    // TODO: Sort out the types for data
    onData(payload) {
      if ("type" in payload && payload.type === "loading") {
        setWaitingForAIInput(true);
      } else if ("data" in payload && "messages" in payload.data) {
        const newMessages = payload.data
          .messages as components["schemas"]["IntakeMessageResponse"][];
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
      setMessages((prev) => [
        ...prev,
        {
          content: text,
          from_role: "client",
        } as components["schemas"]["IntakeMessageResponse"],
      ]);
      await reply.mutateAsync({ intakeId, response: text });
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
        sections: placeholderSections,
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
