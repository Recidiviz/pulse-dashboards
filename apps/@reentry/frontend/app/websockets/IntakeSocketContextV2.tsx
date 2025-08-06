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

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { trpc } from "../providers";
import type { components } from "../recidiviz-schema";

interface IntakeSocketContextV2Type {
  messages: components["schemas"]["IntakeMessageResponse"][];
  waitingForAIInput: boolean;
  error?: string;
  sendMessage: (text: string) => void;
  startConversation: () => void;
  intakeStatus?: components["schemas"]["IntakeStatus"];
  currentSection?: string | null;
  allSections?: components["schemas"]["ClientIntakeSectionResponse"][];
  clientName?: string | null;
  hasAcceptedTerms?: boolean;
  hasAddress?: boolean;
  conversationStarted?: boolean;
  isLoading?: boolean;
}

const IntakeSocketContextV2 = createContext<
  IntakeSocketContextV2Type | undefined
>(undefined);

export function useIntakeContext() {
  const ctx = useContext(IntakeSocketContextV2);
  if (!ctx)
    throw new Error(
      "useIntakeContext must be used within IntakeSocketProviderV2",
    );
  return ctx;
}

interface IntakeSocketProviderV2Props {
  token_from_url?: string | null;
  children: ReactNode;
}

export function IntakeSocketProviderV2({
  // token_from_url,
  children,
}: IntakeSocketProviderV2Props) {
  const [messages, setMessages] = useState<
    components["schemas"]["IntakeMessageResponse"][]
  >([]);
  const [waitingForAIInput, setWaitingForAIInput] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [intakeStatus, setIntakeStatus] = useState<
    components["schemas"]["IntakeStatus"] | undefined
  >(undefined);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [allSections, setAllSections] = useState<
    components["schemas"]["ClientIntakeSectionResponse"][]
  >([]);
  const [clientName, setClientName] = useState<string | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [hasAddress, setHasAddress] = useState<boolean>(false);
  const [conversationStarted, setConversationStarted] =
    useState<boolean>(false);

  // // fetch initial intake metadata
  // const { data } = $api.useQuery("get", "/intake/client/{token_from_url}", {
  //   params: { path: { token_from_url: token_from_url ?? "" } },
  //   enabled: true,
  // });

  const lastIntakeId = sessionStorage.getItem("last_intake_id") ?? "";

  const replyMutation = trpc.intakeChat.reply.useMutation();

  trpc.intakeChat.intakeChat.useSubscription(
    { intakeId: lastIntakeId },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onData(event: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = event.data ?? event;
        if (payload.type === "loading") {
          setWaitingForAIInput(true);
        } else if (payload.type === "response") {
          setMessages((prev) => [...prev, ...payload.messages]);
          setWaitingForAIInput(false);
        }
      },
      onError(err) {
        setError(err.message);
      },
    },
  );

  const data = {
    status: "created" as components["schemas"]["IntakeStatus"],
    current_section: "section1",
    client_intake_sections: [],
    client_name: "John Doe",
    has_accepted_terms: true,
    has_address: true,
  };

  useEffect(() => {
    if (data) {
      setIntakeStatus(data.status);
      setCurrentSection(data.current_section || null);
      setAllSections(data.client_intake_sections);
      setClientName(data.client_name || null);
      setHasAcceptedTerms(data.has_accepted_terms);
      setHasAddress(data.has_address);
      setConversationStarted(
        sessionStorage.getItem("conversationStarted") === "true",
      );
    }
  }, []);

  const startConversation = () => {
    setConversationStarted(true);
    sessionStorage.setItem("conversationStarted", "true");
  };

  const sendMessage = async (text: string) => {
    try {
      setWaitingForAIInput(true);
      await replyMutation.mutateAsync({ intakeId: "", response: text });
      setMessages((prev) => [
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { content: text, from_role: "client" } as any,
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      setWaitingForAIInput(false);
    }
  };

  return (
    <IntakeSocketContextV2.Provider
      value={{
        messages,
        waitingForAIInput,
        error,
        sendMessage,
        startConversation,
        intakeStatus,
        currentSection,
        allSections,
        clientName,
        hasAcceptedTerms,
        hasAddress,
        conversationStarted,
        isLoading,
      }}
    >
      {children}
    </IntakeSocketContextV2.Provider>
  );
}
