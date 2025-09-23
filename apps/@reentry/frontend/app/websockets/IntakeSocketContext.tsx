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
  type Context,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

import { $api } from "~@reentry/frontend/api";

import type { components } from "../recidiviz-schema";
import type {
  ConnectionAckEventContent,
  PongEventContent,
  SectionChangeContent,
} from "./eventTypes";
import { socket } from "./socket";

const DUPLICATE_ACTIVITY_MESSAGE = "This intake is active elsewhere";

export interface IntakeSocketContextType {
  messages: components["schemas"]["IntakeMessageResponse"][];
  connectionStatus: "connected" | "connecting" | "disconnected" | "error";
  waitingForAIInput: boolean;
  currentSection: string | null;
  allSections: components["schemas"]["ClientIntakeSectionResponse"][];
  clientPseudoId?: string | null | undefined;
  intakeStatus: components["schemas"]["IntakeStatus"] | undefined;
  isLoading: boolean;
  error?: IntakeErrorType;
  client_name: string | null;
  client_state: string | null;
  conversationStarted: boolean;
  has_accepted_terms: boolean;
  has_address: boolean;
  disconnectReason?: string | null;
}

interface IntakeSocketDispatchContextType {
  sendMessage: (message: string) => Promise<void>;
  reconnect: () => void;
  handleClickDisconnect: () => void;
  startConversation: () => void;
  setIntakeComplete: () => void;
}

const IntakeContext: Context<IntakeSocketContextType> = createContext(
  {} as IntakeSocketContextType,
);

const IntakeDispatchContext = createContext<IntakeSocketDispatchContextType>(
  {} as IntakeSocketDispatchContextType,
);

export const useSocket = () => {
  const intakeContext = useContext(IntakeContext);
  const intakeDispatchContext = useContext(IntakeDispatchContext);

  if (!intakeContext || !intakeDispatchContext) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return { intakeContext, intakeDispatchContext };
};

type IntakeApiAction = {
  type: "apiIntakeData";
  content: components["schemas"]["IntakeWithSectionsAndMessagesResponse"];
};

type ConnectionAction = {
  type: "connected" | "disconnect" | "connecting";
  reason?: string;
};

type ReceiveMessageAction = {
  type: "receiveAIMessage";
  content: components["schemas"]["IntakeMessageResponse"];
};
type SetIntakeCompleteAction = {
  type: "setIntakeComplete";
};

type AddHumanMessageAction = {
  type: "addHumanMessage";
  content: components["schemas"]["IntakeMessageResponse"];
};

type IntakeErrorType = {
  type: "api" | "socket";
  message?: string;
};
type ErrorAction = {
  type: "error";
  content: IntakeErrorType;
};

type SectionChangeAction = {
  type: "sectionChange";
  content: SectionChangeContent;
};

type InitializeIntakeMetaAction = {
  type: "initializeIntakeMeta";
  content: {
    status: components["schemas"]["IntakeStatus"];
    client_name?: string | null;
    client_state?: string | null;
    current_section_messages?: components["schemas"]["IntakeMessageResponse"][];
    has_accepted_terms?: boolean;
  };
};

type SetConversationStartedAction = {
  type: "setConversationStarted";
  content: boolean;
};

type SetWaitingForAIInputAction = {
  type: "setWaitingForAIInput";
  content: boolean;
};

type IntakeAction =
  | ConnectionAction
  | IntakeApiAction
  | ReceiveMessageAction
  | AddHumanMessageAction
  | ErrorAction
  | SectionChangeAction
  | InitializeIntakeMetaAction
  | SetConversationStartedAction
  | SetIntakeCompleteAction
  | SetWaitingForAIInputAction;

const intakeReducer = (
  state: IntakeSocketContextType,
  action: IntakeAction,
): IntakeSocketContextType => {
  switch (action.type) {
    case "connected": {
      if (state.connectionStatus === "connected") return state;
      console.log("Setting connection status to CONNECTED");
      return {
        ...state,
        connectionStatus: "connected",
        isLoading: false,
      };
    }
    case "connecting": {
      if (state.connectionStatus === "connecting") return state;
      console.log("Setting connection status to CONNECTING");
      return {
        ...state,
        connectionStatus: "connecting",
        error: undefined,
        disconnectReason: null,
      };
    }
    case "disconnect": {
      if (state.connectionStatus === "disconnected") return state;
      console.log("Setting connection status to DISCONNECTED");
      const disconnectReason =
        action.reason === "Client connected elsewhere"
          ? DUPLICATE_ACTIVITY_MESSAGE
          : null;
      return {
        ...state,
        connectionStatus: "disconnected",
        disconnectReason,
      };
    }
    case "apiIntakeData": {
      return {
        ...state,
        waitingForAIInput:
          action.content.status === "in_progress" &&
          action.content.current_section_messages.at(-1)?.from_role ===
            "client",
        isLoading: false,
        allSections: action.content.client_intake_sections,
        currentSection: action.content.current_section || null,
        intakeStatus: action.content.status,
        client_name: action.content.client_name || null,
        clientPseudoId: action.content.client_pseudo_id || null,
        has_accepted_terms: action.content.has_accepted_terms || false,
        has_address: action.content.has_address || false,
      };
    }
    case "receiveAIMessage": {
      const [secondToLast, last] = state.messages.slice(-2);
      if (last && last.id === action.content.id) {
        return {
          ...state,
          waitingForAIInput: false,
          connectionStatus: "connected",
        };
      }

      const hasLetsContinuePair =
        secondToLast?.from_role === "caseworker" &&
        secondToLast.content.includes("Let's continue our conversation") &&
        last?.from_role === "caseworker";

      if (hasLetsContinuePair) {
        return {
          ...state,
          waitingForAIInput: false,
          connectionStatus: "connected",
        };
      }

      return {
        ...state,
        messages: [...state.messages, action.content],
        waitingForAIInput: false,
        connectionStatus: "connected",
      };
    }
    case "addHumanMessage": {
      return {
        ...state,
        messages: [...state.messages, action.content],
        waitingForAIInput: true,
      };
    }
    case "error": {
      // If you geta  socket error while there is an api error, ignore the socket error.
      // If the api error gets resolved it should re-connect the socket anyway,
      // and there is no use for a socket connection without intake data
      if (action.content.type === "socket" && state.error?.type === "api")
        return state;
      return {
        ...state,
        error: action.content,
        isLoading: action.content.type === "api" ? true : state.isLoading,
        connectionStatus:
          action.content.type === "socket" ? "error" : "disconnected",
      };
    }
    case "sectionChange": {
      console.log("Section change received:", action.content);
      return {
        ...state,
        currentSection: action.content.section,
        allSections: state.allSections.map((section) => {
          // Mark previous section as completed
          if (section.intake_section.title === state.currentSection) {
            return {
              ...section,
              completion_status: "completed",
            };
          }
          // Mark new section as in progress
          if (section.intake_section.title === action.content.section) {
            return {
              ...section,
              completion_status: "in_progress",
              is_active: true,
            };
          }
          return section;
        }),
        messages: action.content.messages || [],
        waitingForAIInput: true,
      };
    }
    case "initializeIntakeMeta": {
      return {
        ...state,
        intakeStatus: action.content.status,
        client_name: action.content.client_name || null,
        client_state: action.content.client_state || null,
        messages: action.content.current_section_messages ?? [],
        has_accepted_terms: action.content.has_accepted_terms || false,
        isLoading: false,
      };
    }
    case "setConversationStarted": {
      return {
        ...state,
        conversationStarted: action.content,
      };
    }
    case "setIntakeComplete": {
      return {
        ...state,
        intakeStatus: "completed",
      };
    }
    case "setWaitingForAIInput": {
      return {
        ...state,
        waitingForAIInput: action.content,
      };
    }
    default: {
      // TypeScript will ensure we've covered all action types
      const _exhaustiveCheck: never = action;
      console.log(_exhaustiveCheck);
      return state;
    }
  }
};

interface IntakeSocketProviderProps {
  children: ReactNode;
  token_from_url;
}

export function IntakeSocketProvider({
  children,
  token_from_url,
}: IntakeSocketProviderProps) {
  const initialIntakeContext: IntakeSocketContextType = {
    messages: [],
    connectionStatus: "disconnected",
    waitingForAIInput: false,
    isLoading: true,
    allSections: [],
    currentSection: null,
    intakeStatus: undefined,
    client_name: "",
    client_state: null,
    conversationStarted: false,
    has_accepted_terms: false,
    has_address: false,
    disconnectReason: null,
  };

  const [intakeContext, dispatch] = useReducer(
    intakeReducer,
    initialIntakeContext,
  );

  const [storedToken, setStoredToken] = useState<string | null>(null);
  const conversationStarted = intakeContext.conversationStarted;
  const [isSocketReady, setIsSocketReady] = useState(false);
  const setConversationStarted = (val: boolean) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("conversationStarted", val ? "true" : "false");
    }
    dispatch({ type: "setConversationStarted", content: val });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem("conversationStarted");
      if (val === "true") {
        dispatch({ type: "setConversationStarted", content: true });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("intake_token");
      setStoredToken(token);
    }
  }, []);

  const startConversation = () => {
    setConversationStarted(true);
  };

  const setIntakeComplete = () => {
    dispatch({ type: "setIntakeComplete" });
  };

  // Handler functions for socket events
  const aiMessageHandler = useCallback(
    (content: components["schemas"]["IntakeMessageResponse"]) => {
      dispatch({ type: "receiveAIMessage", content });
    },
    [],
  );

  const connectionAckHandler = useCallback(
    (content: ConnectionAckEventContent) => {
      console.log("Connection acknowledged by server:", content);

      // Add more detailed logging to debug the event
      try {
        // Normal object handling
        if (content && typeof content === "object") {
          console.log("ConnectionAck content is an object:", content);
          if (content.accepted) {
            console.log("ConnectionAck accepted=true");
            dispatch({ type: "connected" });
            setIsSocketReady(true);
          } else {
            console.log("ConnectionAck accepted=false");
            dispatch({ type: "disconnect" });
          }
        } else {
          console.error("Unexpected connectionAck format:", content);
          // Default to connected to avoid stuck UI
          dispatch({ type: "connected" });
        }
      } catch (e) {
        console.error("Error processing connectionAck:", e);
        // Default to connected to avoid stuck UI
        dispatch({ type: "connected" });
      }
    },
    [],
  );

  const pongHandler = useCallback((content: PongEventContent) => {
    console.log("Pong received:", content);
  }, []);

  const sectionChangeHandler = useCallback((content: SectionChangeContent) => {
    console.log("Section change received:", content);
    dispatch({ type: "sectionChange", content });
  }, []);

  // Register event handling
  useEffect(() => {
    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
      // We don't dispatch connected here - we wait for connectionAck
      console.log("Waiting for connectionAck event...");
      console.log(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      dispatch({ type: "disconnect" });
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      dispatch({
        type: "error",
        content: { type: "socket", message: error.message },
      });
    });
    socket.on("forceDisconnect", (content) => {
      console.log(content.reason);
      dispatch({
        type: "disconnect",
        reason: content.reason,
      });
      socket.disconnect();
    });
    console.log("listening now");

    // Application-specific events
    socket.on("AIMessage", aiMessageHandler);
    socket.on("connectionAck", connectionAckHandler);
    socket.on("pong", pongHandler);
    socket.on("sectionChange", sectionChangeHandler);

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("AIMessage");
      socket.off("connectionAck");
      socket.off("pong");
      socket.off("sectionChange");
      socket.off("forceDisconnect");
    };
  }, [
    aiMessageHandler,
    connectionAckHandler,
    pongHandler,
    sectionChangeHandler,
  ]);

  const { data: intakeData, error: apiError } = $api.useQuery(
    "get",
    "/intake/client/{token_from_url}",
    {
      enabled: storedToken && isSocketReady,
      params: {
        path: {
          token_from_url: token_from_url,
        },
      },
      headers: storedToken
        ? {
            Authorization: `Bearer ${storedToken}`,
          }
        : undefined,
    },
  );

  useEffect(() => {
    if (!apiError) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((apiError?.detail as any) === "Unauthorized") {
      // eslint-disable-next-line no-use-before-define
      logOut();
    }
    // Update error state
    dispatch({
      type: "error",
      content: {
        type: "api",
        message: "There was an error loading your intake",
      },
    });

    // Disconnect socket on API error
    if (socket.connected) {
      console.log("API error detected, disconnecting socket");
      socket.disconnect();
    }
  }, [apiError]);

  // Process intake data when it changes
  useEffect(() => {
    // Don't process if there's an API error or no data
    if (apiError || !intakeData || socket.connected) return;

    const canConnect =
      intakeData.status === "in_progress" || intakeData.status === "created";

    //  Intake is not connectable
    if (!canConnect) {
      if (conversationStarted) {
        setConversationStarted(false);
      }

      if (socket.connected) {
        console.log("Disconnecting socket: intake not connectable");
        socket.disconnect();
      }

      return;
    }

    if (!conversationStarted && socket.connected) {
      socket.disconnect();
      return;
    }

    if (!socket.connected && conversationStarted) {
      // Only connect if we're not already connected or connecting
      console.log(`Intake status is ${intakeData.status}, connecting socket`);
      // Update to connecting state before actually connecting
      dispatch({ type: "connecting" });
      socket.auth = { auth_token: storedToken, token_from_url };
      socket.connect();
    }
  }, [storedToken, intakeData, apiError, token_from_url, conversationStarted]);

  useEffect(() => {
    if (!intakeData || apiError) return;

    if (!conversationStarted) {
      dispatch({
        type: "initializeIntakeMeta",
        content: {
          status: intakeData.status,
          client_name: intakeData.client_name,
          current_section_messages: intakeData.current_section_messages,
          client_state: intakeData.client_state,
          has_accepted_terms: intakeData.has_accepted_terms,
        },
      });
    } else {
      dispatch({
        type: "apiIntakeData",
        content: intakeData,
      });
    }
  }, [intakeData, apiError, conversationStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  // Dispatch functions that handle async operations
  const sendMessage = useCallback(
    async (message: string) => {
      if (intakeContext.waitingForAIInput) return;

      try {
        console.log("Sending message:", message);

        // Use emitWithAck to get the response back from the server
        // Maybe it would be better for the backend to send an error event if this didn't go through
        // but in the meantime just show the message
        const response = await socket.emitWithAck("humanMessage", message);

        console.log("Received acknowledgment response:", response);

        if (response) {
          // Parse the response if it's a string
          let parsedMessage = response;
          if (typeof response === "string") {
            try {
              parsedMessage = JSON.parse(response);
              console.log("Parsed JSON response:", parsedMessage);
            } catch (e) {
              console.warn(
                "Response is a string but not valid JSON:",
                response + e,
              );
            }
          }

          // Update state with the acknowledged message from the server
          dispatch({
            type: "addHumanMessage",
            content: parsedMessage,
          });
        } else {
          console.error("Failed to receive message acknowledgment");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Could add error handling state here
      }
    },
    [intakeContext.waitingForAIInput],
  );

  const reconnect = useCallback(() => {
    console.log("Manually reconnecting socket...");
    if (intakeContext.disconnectReason === DUPLICATE_ACTIVITY_MESSAGE) {
      console.log("🔄 Device switching detected - refreshing page");
      window.location.reload();
      return;
    }
    if (intakeContext.connectionStatus === "connected") return;

    console.log("Manually reconnecting socket...");

    socket.disconnect();

    // Set status to connecting immediately for UI feedback
    dispatch({ type: "connecting" });

    // Set authentication and reconnect
    socket.auth = { token: storedToken };

    // Use a small timeout to ensure disconnect completes
    setTimeout(() => {
      try {
        console.log("Attempting to reconnect socket");
        socket.connect();
      } catch (e) {
        console.error("Error during manual reconnection:", e);
        dispatch({
          type: "error",
          content: {
            type: "socket",
            message:
              e instanceof Error ? e.message : "Unknown reconnection error",
          },
        });
      }
    }, 300);
  }, [storedToken, intakeContext.connectionStatus, dispatch]);

  const logOut = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("intake_token");
      setStoredToken(null);
    }
  };

  const handleClickDisconnect = () => {
    logOut();
    window.close();
  };

  const dispatchContext: IntakeSocketDispatchContextType = {
    sendMessage,
    reconnect,
    handleClickDisconnect,
    startConversation,
    setIntakeComplete,
  };

  return (
    <IntakeContext.Provider value={intakeContext}>
      <IntakeDispatchContext.Provider value={dispatchContext}>
        {children}
      </IntakeDispatchContext.Provider>
    </IntakeContext.Provider>
  );
}
