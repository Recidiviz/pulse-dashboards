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

import { setTimeout } from "node:timers/promises";

import pRetry from "p-retry";

import {
  getIntercomApiBaseUrl,
  getIntercomToken,
} from "~@idaho-th/trpc/intercom/intercom.config";
import {
  INTERCOM_API_VERSION,
  INTERCOM_ERROR_CODE,
  INTERCOM_ERROR_MESSAGE,
  INTERCOM_REQUEST_TIMEOUT_MS,
  INTERCOM_RETRY_BACKOFF_FACTOR,
  INTERCOM_RETRY_MIN_TIMEOUT_MS,
  MAX_INTERCOM_ATTEMPTS,
  MAX_INTERCOM_ERROR_DETAIL_CHARS,
  MAX_INTERCOM_RETRY_AFTER_MS,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import type {
  IntercomErrorCode,
  IntercomHttpMethod,
  IntercomHttpResult,
  IntercomRequestOptions,
} from "~@idaho-th/trpc/intercom/intercom.types";

export class IntercomApiError extends Error {
  readonly status: number;
  readonly code: IntercomErrorCode;
  readonly retryable: boolean;
  readonly retryAfterMs: number | undefined;
  declare readonly detail: string | undefined;
  declare readonly responseBody: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      code: IntercomErrorCode;
      retryable: boolean;
      detail?: string;
      responseBody?: unknown;
      retryAfterMs?: number;
      cause?: unknown;
    },
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "IntercomApiError";
    this.status = options.status;
    this.code = options.code;
    this.retryable = options.retryable;
    this.retryAfterMs = options.retryAfterMs;
    Object.defineProperty(this, "detail", {
      value: options.detail,
      enumerable: false,
    });
    Object.defineProperty(this, "responseBody", {
      value: options.responseBody,
      enumerable: false,
    });
  }
}

export function isIntercomApiError(err: unknown): err is IntercomApiError {
  return err instanceof IntercomApiError;
}

export class IntercomCodedError extends Error {
  readonly code: IntercomErrorCode;

  constructor(
    message: string,
    code: IntercomErrorCode,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : {},
    );
    this.name = "IntercomCodedError";
    this.code = code;
  }
}

export function isIntercomCodedError(err: unknown): err is IntercomCodedError {
  return err instanceof IntercomCodedError;
}

function isAbortLikeError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const { name, code } = err as { name?: unknown; code?: unknown };
  return (
    name === "AbortError" || name === "TimeoutError" || code === "ABORT_ERR"
  );
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function toIntercomErrorCode(status: number): IntercomErrorCode {
  if (status === 401) return INTERCOM_ERROR_CODE.UNAUTHENTICATED;
  if (status === 403) return INTERCOM_ERROR_CODE.UNAUTHORIZED;
  if (status === 404) return INTERCOM_ERROR_CODE.NOT_FOUND;
  if (status === 409) return INTERCOM_ERROR_CODE.CONFLICT;
  if (status === 400 || status === 422) {
    return INTERCOM_ERROR_CODE.INVALID_REQUEST;
  }
  if (status === 429) return INTERCOM_ERROR_CODE.RATE_LIMITED;
  if (status >= 500) return INTERCOM_ERROR_CODE.UPSTREAM_UNAVAILABLE;
  return INTERCOM_ERROR_CODE.UNKNOWN;
}

export function intercomErrorCode(err: unknown): IntercomErrorCode {
  if (isIntercomApiError(err) || isIntercomCodedError(err)) return err.code;
  if (isAbortLikeError(err)) return INTERCOM_ERROR_CODE.TIMEOUT;
  return INTERCOM_ERROR_CODE.UNKNOWN;
}

export async function parseJsonBody<T>(response: Response): Promise<T | null> {
  if (response.status === 204 || response.status === 202) {
    return null;
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new IntercomApiError(
      INTERCOM_ERROR_MESSAGE[INTERCOM_ERROR_CODE.INVALID_RESPONSE],
      {
        status: response.status,
        code: INTERCOM_ERROR_CODE.INVALID_RESPONSE,
        retryable: false,
        cause,
      },
    );
  }
}

export function resolveRequestConfig(options: IntercomRequestOptions = {}) {
  return {
    token: options.token ?? getIntercomToken(),
    baseUrl: options.baseUrl ?? getIntercomApiBaseUrl(),
    fetchFn: options.fetchFn ?? fetch,
  };
}

function summarizeErrorBody(body: unknown): string | undefined {
  if (
    body &&
    typeof body === "object" &&
    "errors" in body &&
    Array.isArray((body as { errors?: unknown }).errors)
  ) {
    const messages = (body as { errors: Array<{ message?: string }> }).errors
      .map((e) => e.message)
      .filter((m): m is string => typeof m === "string");
    if (messages.length > 0) return messages.join("; ");
  }
  return undefined;
}

function getRetryAfterMs(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

async function readErrorBody(
  response: Response,
): Promise<{ json: unknown; text: string | undefined }> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return { json: null, text: undefined };
  }

  if (!text) return { json: null, text: undefined };

  try {
    return { json: JSON.parse(text) as unknown, text };
  } catch {
    return { json: null, text };
  }
}

function truncateDetail(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) return undefined;
  return collapsed.length > MAX_INTERCOM_ERROR_DETAIL_CHARS
    ? `${collapsed.slice(0, MAX_INTERCOM_ERROR_DETAIL_CHARS)}…`
    : collapsed;
}

export async function intercomRequest<T = unknown>(
  method: IntercomHttpMethod,
  path: string,
  options: IntercomRequestOptions = {},
  body?: unknown,
): Promise<IntercomHttpResult<T>> {
  const { token, baseUrl, fetchFn } = resolveRequestConfig(options);
  const maxAttempts = Math.max(1, options.maxAttempts ?? MAX_INTERCOM_ATTEMPTS);
  const isRetryable = options.shouldRetry ?? ((error) => error.retryable);
  const signal =
    options.signal ??
    AbortSignal.timeout(options.timeoutMs ?? INTERCOM_REQUEST_TIMEOUT_MS);

  // The deadline covers every attempt, not each one, so honouring a `Retry-After`
  // spends budget the retry still needs. Known only when we created the timeout
  // ourselves — a caller-supplied signal keeps its deadline to itself.
  const deadlineAt = options.signal
    ? undefined
    : Date.now() + (options.timeoutMs ?? INTERCOM_REQUEST_TIMEOUT_MS);

  return pRetry(
    async () => {
      let response: Response;
      try {
        response = await fetchFn(`${baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Intercom-Version": INTERCOM_API_VERSION,
            ...(body !== undefined
              ? { "Content-Type": "application/json" }
              : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal,
        });
      } catch (cause) {
        const code = signal.aborted
          ? INTERCOM_ERROR_CODE.TIMEOUT
          : INTERCOM_ERROR_CODE.NETWORK;
        throw new IntercomApiError(
          `Intercom ${method} ${path} failed (${code})`,
          { status: 0, code, retryable: !signal.aborted, cause },
        );
      }

      if (!response.ok) {
        const { json, text } = await readErrorBody(response);
        const code = toIntercomErrorCode(response.status);
        // The message stays ours end to end; Intercom's wording goes to `detail`.
        throw new IntercomApiError(
          `Intercom ${method} ${path} failed with ${response.status} (${code})`,
          {
            status: response.status,
            code,
            retryable: isRetryableStatus(response.status),
            detail: summarizeErrorBody(json) ?? truncateDetail(text),
            responseBody: json,
            retryAfterMs: getRetryAfterMs(response),
          },
        );
      }

      const data = await parseJsonBody<T>(response);

      return { status: response.status, data };
    },
    {
      retries: maxAttempts - 1,
      factor: INTERCOM_RETRY_BACKOFF_FACTOR,
      minTimeout: INTERCOM_RETRY_MIN_TIMEOUT_MS,
      onFailedAttempt: async ({ error }) => {
        // p-retry calls this before shouldRetry, so waiting out a Retry-After
        // here for an attempt that won't be retried only delays the failure.
        if (!isIntercomApiError(error) || !isRetryable(error)) return;
        const waitMs = Math.min(
          error.retryAfterMs ?? 0,
          MAX_INTERCOM_RETRY_AFTER_MS,
        );
        if (waitMs <= 0) return;

        // A wait that consumes the rest of the deadline buys nothing: the retry
        // would abort the instant it began and report a timeout, burying the
        // reason. Surface the rate limit itself instead — it is the actionable
        // code, and it stays retryable, so the next scheduled run picks the
        // recipient up rather than treating them as permanently failed.
        if (deadlineAt !== undefined && waitMs >= deadlineAt - Date.now()) {
          throw error;
        }

        try {
          await setTimeout(waitMs, undefined, { signal });
        } catch (cause) {
          throw new IntercomApiError(
            `Intercom ${method} ${path} failed (${INTERCOM_ERROR_CODE.TIMEOUT})`,
            {
              status: 0,
              code: INTERCOM_ERROR_CODE.TIMEOUT,
              retryable: false,
              cause,
            },
          );
        }
      },
      shouldRetry: ({ error }) =>
        isIntercomApiError(error) && isRetryable(error),
    },
  );
}
