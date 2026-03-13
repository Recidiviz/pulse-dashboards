// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

// NOTE: Temporary for user testing and will be removed entirely after user testing

import { captureMessage } from "@sentry/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

// Matches the jii-proxy-server nginx config for the case planning backend
const BACKEND_PATH = "/case-plan-api";
const BASE_URL = `${window.location.origin}${BACKEND_PATH}`;
const SSE_URL = `${BASE_URL}/demo/sse/chat`;
const WS_URL = `${BASE_URL.replace(/^http/, "ws")}/demo/ws`;
const SOCKET_IO_PATH = `${BACKEND_PATH}/demo-socket.io/socket.io`;

const DEMO_PASSWORD = import.meta.env["VITE_TRANSPORT_DEMO_PASSWORD"] ?? "";
const SESSION_KEY = "transport-demo-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Transport = "sse" | "websocket" | "socketio";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

let nextMessageId = 0;

interface LogEntry {
  id: number;
  time: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Logging hook
// ---------------------------------------------------------------------------

function useEventLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const startRef = useRef(Date.now());

  const log = useCallback((message: string) => {
    const time = Date.now() - startRef.current;
    // eslint-disable-next-line no-console
    console.log(`[transport-demo +${time}ms] ${message}`);
    setEntries((prev) => [...prev, { id: Date.now(), time, message }]);
  }, []);

  const clear = useCallback(() => {
    startRef.current = Date.now();
    setEntries([]);
  }, []);

  return { entries, log, clear };
}

// ---------------------------------------------------------------------------
// SSE Chat
// ---------------------------------------------------------------------------

function SSEChat({
  log,
  onClear,
}: {
  log: (msg: string) => void;
  onClear: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId++, role: "user", content: userMessage },
    ]);
    setInput("");
    setStreaming(true);
    setStreamingContent("");
    onClear();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    log(`SSE POST → ${SSE_URL}`);
    let chunkCount = 0;
    let firstChunkTime: number | null = null;
    const streamStart = Date.now();

    try {
      captureMessage("Sending user message");
      const response = await fetch(SSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMessage }),
        signal: controller.signal,
      });

      const responseTime = Date.now() - streamStart;
      log(
        `SSE response status: ${response.status} (${responseTime}ms to response)`,
      );
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processEvent = (eventType: string, parsed: any) => {
        if (eventType === "session") {
          setSessionId(parsed.session_id);
          log(`SSE session: ${parsed.session_id}`);
        } else if (eventType === "chunk") {
          chunkCount++;
          if (chunkCount === 1) {
            firstChunkTime = Date.now() - streamStart;
            log(`SSE first chunk at ${firstChunkTime}ms`);
          }
          accumulated += parsed.content;
          setStreamingContent(accumulated);
        } else if (eventType === "done") {
          const elapsed = Date.now() - streamStart;
          log(
            `SSE done — ${chunkCount} chunks in ${elapsed}ms` +
              (firstChunkTime
                ? ` (first chunk: ${firstChunkTime}ms, avg interval: ${chunkCount > 1 ? Math.round((elapsed - firstChunkTime) / (chunkCount - 1)) : 0}ms)`
                : ""),
          );
          if (accumulated) {
            setMessages((prev) => [
              ...prev,
              { id: nextMessageId++, role: "assistant", content: accumulated },
            ]);
          }
          setStreamingContent("");
        } else if (eventType === "error") {
          log(`SSE server error: ${parsed.error}`);
        }
      };

      let result = await reader.read();
      while (!result.done) {
        buffer += decoder.decode(result.value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");
          let eventType = "";
          let eventData = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }
          if (!eventType || !eventData) continue;
          captureMessage("Processing SSE event");
          processEvent(eventType, JSON.parse(eventData));
        }
        // eslint-disable-next-line no-await-in-loop
        result = await reader.read();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      log(`SSE error: ${err}`);
    }
    setStreaming(false);
  }, [input, sessionId, streaming, log, onClear]);

  return (
    <ChatUI
      messages={messages}
      input={input}
      setInput={setInput}
      onSend={send}
      disabled={streaming}
      streamingContent={streamingContent}
      endRef={endRef}
      accent="#10b981"
    />
  );
}

// ---------------------------------------------------------------------------
// WebSocket Chat
// ---------------------------------------------------------------------------

function WebSocketChat({
  log,
  onClear,
}: {
  log: (msg: string) => void;
  onClear: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const chunkCountRef = useRef(0);
  const streamStartRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    log(`WS connecting → ${WS_URL}`);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      log("WS connected");
      setConnected(true);
      ws.send(JSON.stringify({ type: "init" }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "session") {
        setSessionId(data.session_id);
        log(`WS session: ${data.session_id}`);
      } else if (data.type === "chunk") {
        chunkCountRef.current++;
        setStreamingContent((prev) => prev + data.content);
      } else if (data.type === "done") {
        const elapsed = Date.now() - streamStartRef.current;
        const count = chunkCountRef.current;
        log(
          `WS done — ${count} chunks in ${elapsed}ms (avg ${count > 0 ? Math.round(elapsed / count) : 0}ms/chunk)`,
        );
        setStreamingContent((prev) => {
          if (prev) {
            setMessages((msgs) => [
              ...msgs,
              { id: nextMessageId++, role: "assistant", content: prev },
            ]);
          }
          return "";
        });
      }
    };
    ws.onclose = () => {
      log("WS disconnected");
      setConnected(false);
    };
    ws.onerror = () => {
      log("WS error");
      setConnected(false);
    };

    return () => ws.close();
  }, [log]);

  const send = useCallback(() => {
    if (!input.trim() || !wsRef.current || !connected) return;
    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId++, role: "user", content: userMessage },
    ]);
    setInput("");
    onClear();
    chunkCountRef.current = 0;
    streamStartRef.current = Date.now();
    log(`WS send: "${userMessage.slice(0, 50)}"`);
    wsRef.current.send(
      JSON.stringify({ session_id: sessionId, message: userMessage }),
    );
  }, [input, sessionId, connected, log, onClear]);

  return (
    <ChatUI
      messages={messages}
      input={input}
      setInput={setInput}
      onSend={send}
      disabled={!connected}
      streamingContent={streamingContent}
      endRef={endRef}
      accent="#3b82f6"
      statusLabel={connected ? "connected" : "disconnected"}
    />
  );
}

// ---------------------------------------------------------------------------
// Socket.IO Chat
// ---------------------------------------------------------------------------

function SocketIOChat({
  log,
  onClear,
}: {
  log: (msg: string) => void;
  onClear: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [, setSessionId] = useState<string | null>(null);
  const [transport, setTransport] = useState("unknown");
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const chunkCountRef = useRef(0);
  const streamStartRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    log(
      `Socket.IO connecting → ${window.location.origin} path=${SOCKET_IO_PATH}`,
    );
    const socket = io(window.location.origin, {
      path: SOCKET_IO_PATH,
      transports: ["websocket"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const t = socket.io.engine?.transport?.name || "unknown";
      setTransport(t);
      setConnected(true);
      log(`Socket.IO connected (transport: ${t})`);
    });
    socket.on("session", (data: { session_id: string }) => {
      setSessionId(data.session_id);
      log(`Socket.IO session: ${data.session_id}`);
    });
    socket.on("chunk", (data: { content: string }) => {
      chunkCountRef.current++;
      setStreamingContent((prev) => prev + data.content);
    });
    socket.on("done", () => {
      const elapsed = Date.now() - streamStartRef.current;
      const count = chunkCountRef.current;
      log(
        `Socket.IO done — ${count} chunks in ${elapsed}ms (avg ${count > 0 ? Math.round(elapsed / count) : 0}ms/chunk)`,
      );
      setStreamingContent((prev) => {
        if (prev) {
          setMessages((msgs) => [
            ...msgs,
            { id: nextMessageId++, role: "assistant", content: prev },
          ]);
        }
        return "";
      });
    });
    socket.on("error", (data: { message: string }) => {
      log(`Socket.IO error: ${data.message}`);
    });
    socket.on("disconnect", () => {
      log("Socket.IO disconnected");
      setConnected(false);
    });
    socket.on("connect_error", (err) => {
      log(`Socket.IO connect_error: ${err.message}`);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [log]);

  const send = useCallback(() => {
    if (!input.trim() || !socketRef.current || !connected) return;
    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId++, role: "user", content: userMessage },
    ]);
    setInput("");
    onClear();
    chunkCountRef.current = 0;
    streamStartRef.current = Date.now();
    log(`Socket.IO send: "${userMessage.slice(0, 50)}"`);
    socketRef.current.emit("chat_message", { message: userMessage });
  }, [input, connected, log, onClear]);

  return (
    <ChatUI
      messages={messages}
      input={input}
      setInput={setInput}
      onSend={send}
      disabled={!connected}
      streamingContent={streamingContent}
      endRef={endRef}
      accent="#8b5cf6"
      statusLabel={connected ? `connected (${transport})` : "disconnected"}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared Chat UI
// ---------------------------------------------------------------------------

function ChatUI({
  messages,
  input,
  setInput,
  onSend,
  disabled,
  streamingContent,
  endRef,
  accent,
  statusLabel,
}: {
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  streamingContent: string;
  endRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
  statusLabel?: string;
}) {
  return (
    <div>
      {statusLabel && (
        <p style={{ fontSize: "0.75rem", color: "#999", marginBottom: 8 }}>
          Status: <strong>{statusLabel}</strong>
        </p>
      )}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          height: 280,
          overflowY: "auto",
          padding: "0.75rem",
          marginBottom: "0.75rem",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && !streamingContent && (
          <p style={{ color: "#999", textAlign: "center", marginTop: "6rem" }}>
            Send a message to start
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: "0.5rem",
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "0.4rem 0.6rem",
                borderRadius: 10,
                maxWidth: "80%",
                background: msg.role === "user" ? accent : "#e5e7eb",
                color: msg.role === "user" ? "white" : "#1f2937",
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
        {streamingContent && (
          <div style={{ marginBottom: "0.5rem", textAlign: "left" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.4rem 0.6rem",
                borderRadius: 10,
                maxWidth: "80%",
                background: "#e5e7eb",
                color: "#1f2937",
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              {streamingContent}
              <span style={{ opacity: 0.5 }}>|</span>
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: "0.4rem 0.6rem",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: "0.85rem",
          }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: 8,
            border: "none",
            background: accent,
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            opacity: disabled || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Log Panel
// ---------------------------------------------------------------------------

function LogPanel({
  entries,
  onCopy,
}: {
  entries: LogEntry[];
  onCopy: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div style={{ position: "relative" }}>
      {entries.length > 0 && (
        <button
          onClick={onCopy}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            fontSize: "0.65rem",
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid #555",
            background: "#333",
            color: "#ccc",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          Copy
        </button>
      )}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          height: 200,
          overflowY: "auto",
          padding: "0.5rem",
          background: "#1e1e1e",
          fontFamily: "monospace",
          fontSize: "0.7rem",
          lineHeight: 1.5,
          color: "#d4d4d4",
        }}
      >
        {entries.length === 0 && (
          <span style={{ color: "#666" }}>
            Events will appear here when you send a message...
          </span>
        )}
        {entries.map((e) => (
          <div key={e.id}>
            <span style={{ color: "#6a9955" }}>
              +{(e.time / 1000).toFixed(3)}s
            </span>{" "}
            {e.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password Gate
// ---------------------------------------------------------------------------

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  if (!DEMO_PASSWORD) {
    return (
      <CenteredMessage>
        Demo password not configured (VITE_TRANSPORT_DEMO_PASSWORD).
      </CenteredMessage>
    );
  }

  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "4rem auto",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
        Transport Demo
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pw === DEMO_PASSWORD) {
            sessionStorage.setItem(SESSION_KEY, "true");
            setAuthed(true);
          } else {
            setError(true);
          }
        }}
      >
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError(false);
          }}
          placeholder="Enter password"
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: `1px solid ${error ? "#ef4444" : "#ddd"}`,
            fontSize: "0.9rem",
            width: "100%",
            boxSizing: "border-box",
            marginBottom: "0.75rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Enter
        </button>
        {error && (
          <p
            style={{
              color: "#ef4444",
              marginTop: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            Incorrect password
          </p>
        )}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "4rem auto",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        color: "#666",
      }}
    >
      {children}
    </div>
  );
}

function isEdovoEnv() {
  return window.location.hostname.endsWith(".edovo.com");
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS: { key: Transport; label: string; accent: string }[] = [
  { key: "sse", label: "SSE", accent: "#10b981" },
  { key: "websocket", label: "WebSocket", accent: "#3b82f6" },
  { key: "socketio", label: "Socket.IO", accent: "#8b5cf6" },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function PageTransportDemo() {
  const [tab, setTab] = useState<Transport>("sse");
  const { entries, log, clear } = useEventLog();

  captureMessage("Instantiating A/B testing component");

  if (!isEdovoEnv()) {
    return (
      <CenteredMessage>
        This page is only available on Edovo tablets.
      </CenteredMessage>
    );
  }

  captureMessage("Validated user is in Edovo environment");

  return (
    <PasswordGate>
      <div
        style={{
          maxWidth: 640,
          margin: "1.5rem auto",
          padding: "0 1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.25rem",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", margin: 0 }}>
            Transport Layer Test
          </h1>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#f5f5f5",
              color: "#333",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
        <p
          style={{
            color: "#666",
            marginBottom: "1rem",
            fontSize: "0.8rem",
          }}
        >
          Test each transport to find which works on this device. Backend:{" "}
          <code style={{ fontSize: "0.75rem" }}>{BASE_URL}</code>
        </p>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "0.25rem",
            marginBottom: "1rem",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                clear();
              }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: 8,
                border:
                  tab === t.key
                    ? `2px solid ${t.accent}`
                    : "2px solid transparent",
                background: tab === t.key ? `${t.accent}11` : "#f5f5f5",
                color: tab === t.key ? t.accent : "#666",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active chat */}
        {tab === "sse" && <SSEChat log={log} onClear={clear} />}
        {tab === "websocket" && <WebSocketChat log={log} onClear={clear} />}
        {tab === "socketio" && <SocketIOChat log={log} onClear={clear} />}

        {/* Log panel */}
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#666",
              }}
            >
              Event Log
            </span>
            <button
              onClick={clear}
              style={{
                fontSize: "0.7rem",
                color: "#999",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
          <LogPanel
            entries={entries}
            onCopy={() => {
              const text = entries
                .map((e) => `+${(e.time / 1000).toFixed(3)}s ${e.message}`)
                .join("\n");
              navigator.clipboard.writeText(text);
            }}
          />
        </div>
      </div>
    </PasswordGate>
  );
}
