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

import type { ZodError } from "zod";

import type { VertexExtractionLogger } from "~@idaho-th/trpc/routes/vertex/vertex.types";
import {
  formatZodIssuePath,
  toZodMessage,
  zodIssueText,
} from "~@idaho-th/trpc/routes/vertex/vertex.zod";

function readValueAtPath(
  root: unknown,
  path: readonly (string | number)[],
): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[String(segment)];
  }
  return current;
}

function describeValueKind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(length=${value.length})`;
  return typeof value;
}

function collectNullFieldPaths(value: unknown, prefix = ""): string[] {
  if (value === null) {
    return prefix ? [prefix] : [];
  }
  if (typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      const path = prefix ? `${prefix}[${index}]` : `[${index}]`;
      return collectNullFieldPaths(item, path);
    });
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return collectNullFieldPaths(nestedValue, path);
  });
}

function buildValidationFailureMetadata(
  rawParsed: Record<string, unknown>,
  sanitizedResponse: unknown,
  error: ZodError,
): Record<string, unknown> {
  return {
    validationMessage: toZodMessage(error),
    validationIssues: error.issues.map((issue) => {
      const rawValue = readValueAtPath(rawParsed, issue.path);
      const sanitizedValue = readValueAtPath(sanitizedResponse, issue.path);
      return {
        path: formatZodIssuePath(issue),
        message: zodIssueText(issue),
        code: issue.code,
        rawValueKind: describeValueKind(rawValue),
        sanitizedValueKind: describeValueKind(sanitizedValue),
        nullEquivalentSanitized:
          typeof rawValue === "string" && sanitizedValue === null,
        ...(typeof rawValue === "string"
          ? { rawStringLength: rawValue.length }
          : {}),
      };
    }),
    nullFieldPaths: collectNullFieldPaths(sanitizedResponse),
  };
}

export function logVertexResponseValidationFailure(
  logger: VertexExtractionLogger,
  userPrompt: string,
  rawParsed: Record<string, unknown>,
  sanitizedResponse: unknown,
  error: ZodError,
): void {
  logger.info("Vertex AI response validation failed", {
    userPromptPreview:
      userPrompt.split("\n")[0]?.slice(0, 120) ?? userPrompt.slice(0, 120),
    ...buildValidationFailureMetadata(rawParsed, sanitizedResponse, error),
  });
}
