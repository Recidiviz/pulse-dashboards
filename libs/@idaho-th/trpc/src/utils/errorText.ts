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

const UNBROKEN_BLOB_PATTERN = /[A-Za-z0-9+/=_-]{200,}/g;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const MAX_ERROR_TEXT_LENGTH = 2000;

export function scrubErrorText(text: string): string {
  const withoutBlobs = text.replace(UNBROKEN_BLOB_PATTERN, "[redacted]");
  const withoutEmails = withoutBlobs.replace(EMAIL_PATTERN, "[redacted]");
  return withoutEmails.length > MAX_ERROR_TEXT_LENGTH
    ? `${withoutEmails.slice(0, MAX_ERROR_TEXT_LENGTH)}...[truncated]`
    : withoutEmails;
}

export function formatErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: scrubErrorText(error.message),
    };
  }
  return { errorReason: scrubErrorText(String(error)) };
}
