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

import {
  AgentStatus,
  Intake,
  Message,
} from "~@reentry/frontend/components/IntakeChatV2/Chat/types";
import { trpc } from "~@reentry/frontend/components/IntakeChatV2/IntakeChatV2";

interface ChatState {
  sections?: Intake["config"]["sections"];
  messages: Message[];
  intakeStatus: AgentStatus;
  waitingForAIInput: boolean;
  error?: string;
  intakeEndDate: Date | null;
  sendMessage: (text: string) => Promise<void>;
  setEndDate: (endDate: Date) => Promise<void>;
}

const ChatContext = createContext<ChatState | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

export const ChatProvider: React.FC<{
  intake: Intake;
  clientId: string;
  children?: React.ReactNode;
}> = ({ intake, clientId, children }) => {
  const [intakeStatus, setIntakeStatus] =
    useState<ChatState["intakeStatus"]>("not_initialized");
  const [messages, setMessages] = useState<ChatState["messages"]>([]);
  const [waitingForAIInput, setWaitingForAIInput] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setMessages([]);
    setWaitingForAIInput(false);
    setError(undefined);
  }, [intake]);

  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      toast.error(
        "There was an issue connecting to the chat. Please try again later.",
        { autoClose: false, toastId: "chat-setup-error" },
      );
    }
  }, [error]);

  const utils = trpc.useUtils();
  const reply = trpc.intake.reply.useMutation();
  const updateEndDate = trpc.intake.updateEndDate.useMutation();
  trpc.intake.chat.useSubscription(
    intake.id ? { intakeId: intake.id } : skipToken,
    {
      // TODO: Sort out the types for data
      onData(payload) {
        if ("type" in payload && payload.type === "loading") {
          setWaitingForAIInput(true);
        } else if ("data" in payload) {
          if ("messages" in payload.data) {
            const newMessages = payload.data.messages as Message[];
            setMessages((prev) => [...prev, ...newMessages]);
          }
          if ("status" in payload.data) {
            setIntakeStatus(payload.data.status as AgentStatus);
          }
          setWaitingForAIInput(false);
        }
      },
      onError(err) {
        setError(err.message);
      },
    },
  );

  const sendMessage = async (text: string) => {
    if (!intake.id) return;

    try {
      setWaitingForAIInput(true);
      setMessages((prev) => [
        ...prev,
        {
          content: text,
          from_role: "client",
          section: prev[prev.length - 1].section,
        } as Message,
      ]);
      await reply.mutateAsync({ intakeId: intake.id, response: text });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setWaitingForAIInput(false);
    }
  };

  const setIntakeEndDate = async (endDate: Date) => {
    try {
      await updateEndDate.mutateAsync({ intakeId: intake.id, endDate });
      if (clientId) {
        // Refetch the intake to move on to the next steps
        await utils.intake.getIntake.invalidate({ clientPseudoId: clientId });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };
  console.log("intakeStatus", intakeStatus);
  return (
    <ChatContext.Provider
      value={{
        sections: intake.config?.sections ?? [],
        messages,
        intakeStatus,
        waitingForAIInput,
        error,
        intakeEndDate: intake.endDate,
        sendMessage,
        setEndDate: setIntakeEndDate,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
