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

// TypeScript definitions for WebSocket event types
// Keep in sync with backend schemas in app/utils/intake/schemas.py

import { components } from "~@reentry/openapi-types";

type IntakeMessageResponse = components["schemas"]["IntakeMessageResponse"];

// Event content interfaces
export interface PongEventContent {
  timestamp: number;
}

export interface ConnectionAckEventContent {
  accepted: boolean;
  status: "error" | "created" | "in_progress" | "completed";
  locked?: boolean;
}

export interface SectionChangeContent {
  section: string;
  messages: IntakeMessageResponse[];
}

export type ForceDisconnectReason =
  | "duplicate_session"
  | "timeout"
  | HardStopGuardrailType;

export interface ForceDisconnectContent {
  reason: ForceDisconnectReason;
}

/** Guardrail types that trigger a hard stop (socket disconnected, intake locked) */
export const HARD_STOP_GUARDRAIL_TYPES = [
  "crisis",
  "harm_to_others",
  "openai_moderation:self-harm",
  "openai_moderation:harm_to_others",
] as const;
export type HardStopGuardrailType = (typeof HARD_STOP_GUARDRAIL_TYPES)[number];

/** Guardrail types that trigger a soft stop (modal shown, user can continue) */
export const SOFT_STOP_GUARDRAIL_TYPES = ["prompt_injection"] as const;
export type SoftStopGuardrailType = (typeof SOFT_STOP_GUARDRAIL_TYPES)[number];

export type GuardrailType =
  | HardStopGuardrailType
  | SoftStopGuardrailType
  | "char_limit";

export function isHardStopGuardrail(
  reason: ForceDisconnectReason | undefined,
): reason is HardStopGuardrailType {
  return HARD_STOP_GUARDRAIL_TYPES.some((t) => t === reason);
}

export function isSoftStopGuardrail(
  guardrail: GuardrailType,
): guardrail is SoftStopGuardrailType {
  return SOFT_STOP_GUARDRAIL_TYPES.some((t) => t === guardrail);
}

export function isGuardrailType(
  s: string,
): s is HardStopGuardrailType | SoftStopGuardrailType {
  return [...HARD_STOP_GUARDRAIL_TYPES, ...SOFT_STOP_GUARDRAIL_TYPES].some(
    (t) => t === s,
  );
}

export interface GuardrailTriggeredContent {
  guardrails: GuardrailType[];
}

// Socket.io specific interfaces
export interface ServerToClientEvents {
  pong: (content: PongEventContent) => void;
  connectionAck: (content: ConnectionAckEventContent) => void;
  AIMessage: (content: IntakeMessageResponse) => void;
  sectionChange: (content: SectionChangeContent) => void;
  forceDisconnect: (content: ForceDisconnectContent) => void;
  tokenExpired: () => void;
  guardrailTriggered: (content: GuardrailTriggeredContent) => void;
}

export interface ClientToServerEvents {
  humanMessage: (
    content: string,
    callback?: (response: IntakeMessageResponse | null) => void,
  ) => void;
}
