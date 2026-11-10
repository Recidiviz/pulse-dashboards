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

import type { ZodError, ZodIssue } from "zod";

export function formatZodIssuePath(issue: ZodIssue): string {
  if (!issue.path?.length) return "<root>";
  return issue.path
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : segment))
    .join(".");
}

// Zod's invalid_enum_value text ends with "received '<value>'", and that value
// is whatever the model read off the uploaded PDF, so it may be a person's name
// or address. Other issue messages hold only paths, types and schema values.
export function zodIssueText(issue: ZodIssue): string {
  if (issue.code === "invalid_enum_value") {
    return `Invalid enum value. Expected ${issue.options
      .map((option) => `'${String(option)}'`)
      .join(" | ")}`;
  }
  return issue.message;
}

export function toZodMessage(error: ZodError): string {
  const { issues } = error;
  if (!issues?.length) return error.message || "Validation error";

  // Keep this compact; this message is surfaced via tRPC errors and Sentry.
  return issues
    .map((issue) => `${formatZodIssuePath(issue)}: ${zodIssueText(issue)}`)
    .join("; ");
}
