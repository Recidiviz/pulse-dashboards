/* eslint-disable no-console */
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

import * as Sentry from "@sentry/react";
import {
  type Context,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { components } from "~@reentry/openapi-types";

import { useApplicationContext } from "../contexts/ApplicationContext";
import type {
  ConnectionAckEventContent,
  ForceDisconnectReason,
  HardStopGuardrailType,
  PongEventContent,
  SectionChangeContent,
  SoftStopGuardrailType,
} from "./eventTypes";
import { isHardStopGuardrail, isSoftStopGuardrail } from "./eventTypes";

/**
 * Returns true if a message should be shown in the UI — i.e. it was not flagged
 * by a guardrail. Guardrailed messages stay in raw reducer state so the
 * soft-stop case can retroactively mark the optimistic chat message, but are stripped
 * from context before any consumer sees them, matching what the DB returns after
 * a page refresh.
 */
export const isVisibleMessage = (
  m: components["schemas"]["IntakeMessageResponse"],
): boolean => !m.guardrailed_by || m.guardrailed_by.length === 0;

const DUPLICATE_ACTIVITY_MESSAGE = "This intake is active elsewhere";
// Warn the user this many ms before their session expires. Set to 1 minute to
// give enough time on slow prison tablets.
const SESSION_EXPIRY_WARNING_MS = 60_000;

function logWebsocketEvent(
  level: "info" | "warning" | "error",
  message: string,
  context?: Record<string, unknown>,
): void {
  // Only send to Sentry on edovo.com domains
  if (
    typeof window === "undefined" ||
    !window.location.hostname.endsWith(".edovo.com")
  ) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      websocket: context || {},
    },
    tags: {
      source: "websocket",
    },
  });
}

export interface IntakeSocketContextType {
  messages: components["schemas"]["IntakeMessageResponse"][];
  connectionStatus: "connected" | "connecting" | "disconnected" | "error";
  waitingForAIInput: boolean;
  currentSection: string | null;
  allSections: components["schemas"]["IntakeSectionResponse"][];
  clientPseudoId?: string | null | undefined;
  intakeStatus: components["schemas"]["IntakeStatus"] | undefined;
  isLoading: boolean;
  error?: IntakeErrorType;
  client_name: string | null;
  client_state: string | null;
  conversationStarted: boolean;
  has_accepted_terms: boolean;
  has_address: boolean;
  has_survey: boolean;
  disconnectReason?: string | null;
  guardrailHardStopReason?: HardStopGuardrailType | null;
  guardrailSoftStopReason?: SoftStopGuardrailType | null;
  isLocked?: boolean;
  intakeId?: string | null;
  sessionExpiring?: boolean;
}

interface IntakeSocketDispatchContextType {
  sendMessage: (message: string) => Promise<void>;
  reconnect: () => void;
  handleClickDisconnect: () => void;
  startConversation: () => void;
  setIntakeComplete: () => void;
  lockIntake: () => void;
  clearGuardrailSoftStop: () => void;
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
  reason?: ForceDisconnectReason;
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

type ConfirmHumanMessageAction = {
  type: "confirmHumanMessage";
  tempId: string;
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
    has_address?: boolean;
    has_survey?: boolean;
    id: string;
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

type SetStatusAction = {
  type: "setStatus";
  content: components["schemas"]["IntakeStatus"];
};

type SetSessionExpiringAction = { type: "setSessionExpiring" };
type ResetSessionExpiringAction = { type: "resetSessionExpiring" };
type GuardrailSoftStopAction = {
  type: "guardrailSoftStop";
  reason: SoftStopGuardrailType;
};

type IntakeAction =
  | ConnectionAction
  | IntakeApiAction
  | ReceiveMessageAction
  | AddHumanMessageAction
  | ConfirmHumanMessageAction
  | ErrorAction
  | SectionChangeAction
  | InitializeIntakeMetaAction
  | SetConversationStartedAction
  | SetIntakeCompleteAction
  | SetWaitingForAIInputAction
  | SetStatusAction
  | SetSessionExpiringAction
  | ResetSessionExpiringAction
  | GuardrailSoftStopAction
  | { type: "intakeLocked" }
  | { type: "clearGuardrailSoftStop" };

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
        action.reason === "duplicate_session"
          ? DUPLICATE_ACTIVITY_MESSAGE
          : null;
      const guardrailHardStopReason = isHardStopGuardrail(action.reason)
        ? action.reason
        : null;
      return {
        ...state,
        connectionStatus: "disconnected",
        waitingForAIInput: false,
        disconnectReason,
        guardrailHardStopReason,
      };
    }
    case "guardrailSoftStop": {
      /**
       * Retroactively mark the last unguardrailed client message so isVisibleMessage
       * hides it immediately. The backend persists it with guardrailed_by set, so
       * a page refresh produces the same filtered view via the DB.
       */
      const messages = [...state.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].from_role === "client" && !messages[i].guardrailed_by) {
          messages[i] = {
            ...messages[i],
            guardrailed_by: [action.reason],
          };
          break;
        }
      }
      return {
        ...state,
        messages,
        guardrailSoftStopReason: action.reason,
        waitingForAIInput: false,
      };
    }
    case "intakeLocked": {
      return { ...state, isLocked: true };
    }
    case "clearGuardrailSoftStop": {
      return { ...state, guardrailSoftStopReason: null };
    }
    case "setStatus": {
      if (state.intakeStatus === action.content) return state;
      return {
        ...state,
        intakeStatus: action.content,
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
        allSections: action.content.intake_sections,
        currentSection: action.content.current_section || null,
        intakeStatus: action.content.status,
        client_state: action.content.client_state || null,
        client_name: action.content.client_name || null,
        clientPseudoId: action.content.client_pseudo_id || null,
        has_accepted_terms: action.content.has_accepted_terms || false,
        has_address: action.content.has_address || false,
        has_survey: action.content.has_survey || false,
        intakeId: action.content.id,
      };
    }
    case "receiveAIMessage": {
      const [secondToLast, last] = state.messages.slice(-2);
      if (last && last.id === action.content.id) {
        return {
          ...state,
          waitingForAIInput: action.content.requires_response !== true,
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
          waitingForAIInput: action.content.requires_response !== true,
          connectionStatus: "connected",
        };
      }
      // If there is no currentSection -if intake has not started- set the curent section and update sections statuses
      // Based on the messages's section
      return {
        ...state,
        messages: [...state.messages, action.content],
        waitingForAIInput: action.content.requires_response !== true,
        currentSection: state.currentSection || action.content.section || null,
        allSections: state.currentSection
          ? state.allSections
          : state.allSections.map((section) => {
              // Mark new section as in progress
              if (section.title === action.content.section) {
                return {
                  ...section,
                  status: "in_progress",
                };
              }
              return section;
            }),
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
    case "confirmHumanMessage": {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.tempId ? action.content : m,
        ),
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
          if (section.title === state.currentSection) {
            return {
              ...section,
              status: "completed",
            };
          }
          // Mark new section as in progress
          if (section.title === action.content.section) {
            return {
              ...section,
              status: "in_progress",
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
        has_address: action.content.has_address || false,
        has_survey: action.content.has_survey || false,
        isLoading: false,
        intakeId: action.content.id,
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
    case "setSessionExpiring": {
      return { ...state, sessionExpiring: true };
    }
    case "resetSessionExpiring": {
      return { ...state, sessionExpiring: false };
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
  tokenFromUrl?: string | undefined | null;
}

export function IntakeSocketProvider({
  children,
  tokenFromUrl,
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
    has_survey: false,
    disconnectReason: null,
    guardrailHardStopReason: null,
    guardrailSoftStopReason: null,
    isLocked: false,
  };

  const { socket, $api } = useApplicationContext();

  const [intakeContext, dispatch] = useReducer(
    intakeReducer,
    initialIntakeContext,
  );

  const [storedToken, setStoredToken] = useState<string | null>(null);
  const conversationStarted = intakeContext.conversationStarted;
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

  const logOut = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("intake_token");
      setStoredToken(null);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!storedToken) return;
    let warningTimer: ReturnType<typeof setTimeout> | null = null;
    let logoutTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      const payload = JSON.parse(atob(storedToken.split(".")[1]));
      const msUntilExpiry = payload.exp * 1000 - Date.now();
      if (msUntilExpiry > 0) {
        const msUntilWarning = msUntilExpiry - SESSION_EXPIRY_WARNING_MS;
        if (msUntilWarning > 0) {
          warningTimer = setTimeout(
            () => dispatch({ type: "setSessionExpiring" }),
            msUntilWarning,
          );
        } else {
          dispatch({ type: "setSessionExpiring" });
        }
        logoutTimer = setTimeout(() => logOut(), msUntilExpiry);
      } else {
        logOut();
      }
    } catch {
      // Invalid token format — let the server reject it
    }
    return () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (logoutTimer) clearTimeout(logoutTimer);
      dispatch({ type: "resetSessionExpiring" });
    };
  }, [storedToken, logOut]);

  // Handler functions for socket events
  const aiMessageHandler = useCallback(
    (content: components["schemas"]["IntakeMessageResponse"]) => {
      logWebsocketEvent("info", "WebSocket AI message received", {
        messageId: content.id,
        section: content.section,
        fromRole: content.from_role,
        requiresResponse: content.requires_response,
        socketId: socket.id,
      });
      dispatch({ type: "receiveAIMessage", content });
    },
    [socket],
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
            logWebsocketEvent("info", "WebSocket authentication successful", {
              socketId: socket.id,
              intakeStatus: content.status,
              connectionAccepted: true,
            });
            dispatch({ type: "connected" });

            if (content.status) {
              dispatch({ type: "setStatus", content: content.status });
            }
          } else {
            console.log("ConnectionAck accepted=false");
            const auth = socket.auth as Record<string, unknown> | undefined;
            logWebsocketEvent("error", "WebSocket authentication rejected", {
              socketId: socket.id,
              connectionAccepted: false,
              hasAuthToken: !!storedToken,
              hasTokenFromUrl: !!tokenFromUrl,
              authTokenPresent: !!(auth && auth["auth_token"]),
              urlTokenPresent: !!(auth && auth["token_from_url"]),
            });
            if (content.locked) {
              dispatch({ type: "intakeLocked" });
              socket.disconnect();
            } else {
              dispatch({ type: "disconnect" });
            }
          }
        } else {
          console.error("Unexpected connectionAck format:", content);
          logWebsocketEvent(
            "error",
            "WebSocket connectionAck unexpected format",
            {
              socketId: socket.id,
              contentType: typeof content,
            },
          );
          // Default to connected to avoid stuck UI
          dispatch({ type: "connected" });
        }
      } catch (e) {
        console.error("Error processing connectionAck:", e);
        logWebsocketEvent("error", "WebSocket connectionAck processing error", {
          socketId: socket.id,
          error: e instanceof Error ? e.message : String(e),
        });
        // Default to connected to avoid stuck UI
        dispatch({ type: "connected" });
      }
    },
    [socket, storedToken, tokenFromUrl],
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
      const auth = socket.auth as Record<string, unknown> | undefined;
      logWebsocketEvent("info", "WebSocket connected", {
        socketId: socket.id,
        transportType: socket.io.engine.transport.name,
        hasAuthToken: !!storedToken,
        hasTokenFromUrl: !!tokenFromUrl,
        authTokenPresent: !!(auth && auth["auth_token"]),
        urlTokenPresent: !!(auth && auth["token_from_url"]),
      });
      // We don't dispatch connected here - we wait for connectionAck
      console.log("Waiting for connectionAck event...");
      console.log(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      logWebsocketEvent("warning", "WebSocket disconnected", {
        reason,
        socketId: socket.id,
        hasAuthToken: !!storedToken,
        hasTokenFromUrl: !!tokenFromUrl,
      });
      dispatch({ type: "disconnect" });
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      const auth = socket.auth as Record<string, unknown> | undefined;
      logWebsocketEvent("error", "WebSocket connection error", {
        errorMessage: error.message,
        errorType: error.name,
        socketId: socket.id,
        hasAuthToken: !!storedToken,
        hasTokenFromUrl: !!tokenFromUrl,
        authTokenPresent: !!(auth && auth["auth_token"]),
        urlTokenPresent: !!(auth && auth["token_from_url"]),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reason = (error as any)?.data?.message;
      if (reason === "Token has expired") {
        logOut();
        return;
      }
      dispatch({
        type: "error",
        content: { type: "socket", message: reason ?? error.message },
      });
    });
    socket.on("forceDisconnect", (content) => {
      dispatch({
        type: "disconnect",
        reason: content.reason,
      });
      socket.disconnect();
    });
    socket.on("tokenExpired", () => {
      logOut();
    });
    console.log("listening now");

    // Application-specific events
    socket.on("AIMessage", aiMessageHandler);
    socket.on("connectionAck", connectionAckHandler);
    socket.on("pong", pongHandler);
    socket.on("sectionChange", sectionChangeHandler);
    socket.on("guardrailTriggered", (content) => {
      const softStop = content.guardrails.find(isSoftStopGuardrail);
      if (softStop) {
        dispatch({ type: "guardrailSoftStop", reason: softStop });
      }
    });
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
      socket.off("tokenExpired");
      socket.off("guardrailTriggered");
    };
  }, [
    aiMessageHandler,
    connectionAckHandler,
    pongHandler,
    sectionChangeHandler,
    logOut,
    socket,
    storedToken,
    tokenFromUrl,
  ]);

  const { data: intakeDataToken, error: apiErrorToken } = $api.useQuery(
    "get",
    "/external/client/by-token/{token_from_url}",
    {
      params: {
        path: {
          token_from_url: tokenFromUrl as string,
        },
      },
      headers: storedToken
        ? {
            Authorization: `Bearer ${storedToken}`,
          }
        : undefined,
    },
    { enabled: !!storedToken && !!tokenFromUrl },
  );

  const { data: intakeData, error: apiError } = $api.useQuery(
    "get",
    "/external/client/",
    {
      headers: storedToken
        ? {
            Authorization: `Bearer ${storedToken}`,
          }
        : undefined,
    },
    { enabled: !!storedToken && !tokenFromUrl },
  );
  useEffect(() => {
    if (!apiError && !apiErrorToken) return;

    const isAuthError = (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.detail;
      return detail === "Unauthorized" || detail === "Token has expired";
    };

    if (isAuthError(apiError) || isAuthError(apiErrorToken)) {
      logOut();
      return;
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
  }, [apiError, apiErrorToken, socket, storedToken, logOut]);

  // Process intake data when it changes
  const isLocked = intakeContext.isLocked;

  useEffect(() => {
    // Don't process if there's an API error or no data
    const actualIntakeData = intakeData ? intakeData : intakeDataToken;
    if (
      isLocked ||
      apiErrorToken ||
      apiError ||
      !actualIntakeData ||
      socket.connected
    )
      return;

    if (actualIntakeData.locked) {
      dispatch({ type: "intakeLocked" });
      return;
    }

    const canConnect =
      actualIntakeData.status === "in_progress" ||
      actualIntakeData.status === "created";

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
    if (!socket.connected && conversationStarted && storedToken) {
      // Only connect if we're not already connected or connecting
      console.log(
        `Intake status is ${actualIntakeData.status}, connecting socket`,
      );
      logWebsocketEvent("info", "Initiating WebSocket connection", {
        intakeStatus: actualIntakeData.status,
        intakeId: actualIntakeData.id,
        conversationStarted,
      });
      // Update to connecting state before actually connecting
      dispatch({ type: "connecting" });
      socket.auth = { auth_token: storedToken, token_from_url: tokenFromUrl };
      socket.connect();
    }
  }, [
    isLocked,
    storedToken,
    intakeData,
    intakeDataToken,
    apiError,
    apiErrorToken,
    tokenFromUrl,
    conversationStarted,
    socket,
  ]);

  useEffect(() => {
    const actualIntakeData = intakeData ? intakeData : intakeDataToken;

    if (!actualIntakeData || apiError || apiErrorToken) return;

    if (actualIntakeData.locked) {
      dispatch({ type: "intakeLocked" });
      return;
    }

    if (!conversationStarted) {
      dispatch({
        type: "initializeIntakeMeta",
        content: {
          status: actualIntakeData.status,
          client_name: actualIntakeData.client_name,
          current_section_messages: actualIntakeData.current_section_messages,
          client_state: actualIntakeData.client_state,
          has_accepted_terms: actualIntakeData.has_accepted_terms,
          has_address: actualIntakeData.has_address,
          has_survey: actualIntakeData.has_survey,
          id: actualIntakeData.id,
        },
      });
    } else {
      dispatch({
        type: "apiIntakeData",
        content: actualIntakeData,
      });
    }
  }, [
    intakeData,
    intakeDataToken,
    apiErrorToken,
    apiError,
    conversationStarted,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Dispatch functions that handle async operations
  const sendMessage = useCallback(
    async (message: string) => {
      if (intakeContext.waitingForAIInput) return;

      try {
        logWebsocketEvent("info", "WebSocket sending human message", {
          messageLength: message.length,
          socketId: socket.id,
          connectionStatus: intakeContext.connectionStatus,
        });

        // Show message immediately before the ack returns (optimistic UI).
        // Replaced with the server-confirmed version once the ack arrives.
        const tempId = crypto.randomUUID();
        const now = new Date().toISOString();
        dispatch({
          type: "addHumanMessage",
          content: {
            id: tempId,
            content: message,
            from_role: "client",
            section: intakeContext.currentSection,
            requires_response: false,
            created_at: now,
            updated_at: now,
          },
        });

        const response = await socket.emitWithAck("humanMessage", message);

        if (response) {
          // Parse the response if it's a string
          let parsedMessage = response;
          if (typeof response === "string") {
            try {
              parsedMessage = JSON.parse(response);
            } catch (e) {
              console.warn(
                "Response is a string but not valid JSON:",
                response + e,
              );
            }
          }

          logWebsocketEvent("info", "WebSocket human message acknowledged", {
            messageId: parsedMessage.id,
            socketId: socket.id,
          });

          // Swap the optimistic placeholder with the persisted server message
          dispatch({
            type: "confirmHumanMessage",
            tempId,
            content: parsedMessage,
          });
        } else {
          logWebsocketEvent("error", "WebSocket message not acknowledged", {
            socketId: socket.id,
            connectionStatus: intakeContext.connectionStatus,
          });
          // No ack: optimistic message stays visible. If a guardrail fired,
          // forceDisconnect will arrive and the GuardrailModal covers the chat.
        }
      } catch (error) {
        console.error("Error sending message:", error);
        logWebsocketEvent("error", "WebSocket error sending message", {
          error: error instanceof Error ? error.message : String(error),
          socketId: socket.id,
          connectionStatus: intakeContext.connectionStatus,
        });
        // Could add error handling state here
      }
    },
    [
      intakeContext.waitingForAIInput,
      intakeContext.connectionStatus,
      intakeContext.currentSection,
      socket,
    ],
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
    socket.auth = { auth_token: storedToken, token_from_url: tokenFromUrl };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    storedToken,
    tokenFromUrl,
    intakeContext.connectionStatus,
    intakeContext.disconnectReason,
  ]);

  const handleClickDisconnect = () => {
    logOut();
  };

  const lockIntake = () => dispatch({ type: "intakeLocked" });
  const clearGuardrailSoftStop = () =>
    dispatch({ type: "clearGuardrailSoftStop" });

  const dispatchContext: IntakeSocketDispatchContextType = {
    sendMessage,
    reconnect,
    handleClickDisconnect,
    startConversation,
    setIntakeComplete,
    lockIntake,
    clearGuardrailSoftStop,
  };

  /**
   * Strip guardrailed messages before exposing context to consumers so every
   * component gets a consistent filtered view without needing to call
   * isVisibleMessage themselves.
   */
  const visibleContext = useMemo(
    () => ({
      ...intakeContext,
      messages: intakeContext.messages.filter(isVisibleMessage),
    }),
    [intakeContext],
  );

  return (
    <IntakeContext.Provider value={visibleContext}>
      <IntakeDispatchContext.Provider value={dispatchContext}>
        {children}
      </IntakeDispatchContext.Provider>
    </IntakeContext.Provider>
  );
}
