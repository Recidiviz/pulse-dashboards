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

import {
  formatErrorForLog,
  scrubErrorText,
} from "~@idaho-th/trpc/utils/errorText";

export class VertexExtractionError extends Error {
  /** The uploaded document caused the failure, so it is not reported to Sentry. */
  readonly userCaused: boolean;

  constructor(
    message: string,
    options?: ErrorOptions & { userCaused?: boolean },
  ) {
    super(message, options);
    this.name = "VertexExtractionError";
    this.userCaused = options?.userCaused ?? false;
  }
}

export class VertexQuotaExceededError extends VertexExtractionError {
  constructor() {
    super("Vertex AI quota exceeded");
    this.name = "VertexQuotaExceededError";
  }
}

export class VertexSafetyBlockedError extends VertexExtractionError {
  constructor() {
    super("Vertex AI response blocked by safety filter");
    this.name = "VertexSafetyBlockedError";
  }
}

export class VertexResponseValidationError extends VertexExtractionError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "VertexResponseValidationError";
  }
}

export class VertexExtractionTimeoutError extends VertexExtractionError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "VertexExtractionTimeoutError";
  }
}

export function isNonRetryableVertexExtractionError(
  error: unknown,
): error is
  | VertexResponseValidationError
  | VertexSafetyBlockedError
  | VertexQuotaExceededError {
  return (
    error instanceof VertexResponseValidationError ||
    error instanceof VertexSafetyBlockedError ||
    error instanceof VertexQuotaExceededError
  );
}

export const formatVertexErrorForLog = formatErrorForLog;

const QUOTA_HTTP_STATUSES = new Set([429]);
const SAFETY_HTTP_STATUSES = new Set([403]);

function toErrorRecord(error: unknown): Record<string, unknown> | undefined {
  return error && typeof error === "object"
    ? (error as Record<string, unknown>)
    : undefined;
}

function classifyVertexError(
  error: unknown,
): "quota_exceeded" | "safety_blocked" | "unknown" {
  const errorWithFields = toErrorRecord(error);
  const status =
    typeof errorWithFields?.["status"] === "number"
      ? errorWithFields["status"]
      : undefined;
  const code =
    typeof errorWithFields?.["code"] === "number" ||
    typeof errorWithFields?.["code"] === "string"
      ? String(errorWithFields["code"])
      : undefined;

  if (status !== undefined) {
    if (QUOTA_HTTP_STATUSES.has(status)) return "quota_exceeded";
    if (SAFETY_HTTP_STATUSES.has(status)) return "safety_blocked";
  }
  if (code === "429") return "quota_exceeded";

  let message = "";
  if (typeof errorWithFields?.["message"] === "string") {
    message = errorWithFields["message"].toLowerCase();
  } else if (error instanceof Error) {
    message = error.message.toLowerCase();
  }

  if (message.includes("safety")) return "safety_blocked";
  if (message.includes("quota")) return "quota_exceeded";
  return "unknown";
}

const SAFE_VERTEX_ERROR_FIELDS = [
  "status",
  "code",
  "message",
  "statusText",
] as const;

function summarizeVertexRequestError(error: unknown): string {
  if (error instanceof Error) {
    const trimmed = error.message?.trim();
    if (trimmed) return scrubErrorText(trimmed);
    return error.name || "Unknown Error";
  }
  const record = toErrorRecord(error);
  if (record) {
    const safeFields: Record<string, unknown> = {};
    for (const field of SAFE_VERTEX_ERROR_FIELDS) {
      if (field in record) safeFields[field] = record[field];
    }
    if (Object.keys(safeFields).length === 0) return "Unknown Vertex AI error";
    try {
      return JSON.stringify(safeFields);
    } catch {
      return "Unknown Vertex AI error";
    }
  }
  return "Unknown Vertex AI error";
}

export const handleVertexError = (error: unknown): never => {
  const classification = classifyVertexError(error);
  if (classification === "quota_exceeded") throw new VertexQuotaExceededError();
  if (classification === "safety_blocked") throw new VertexSafetyBlockedError();
  const reason = summarizeVertexRequestError(error);
  throw new VertexExtractionError(`Vertex AI call failed: ${reason}`, {
    cause: error,
  });
};
