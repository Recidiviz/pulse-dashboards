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

import { Type } from "@google/genai";

export type GeminiJsonSchemaType =
  | "object"
  | "array"
  | "string"
  | "integer"
  | "number"
  | "boolean";

export const VERTEX_AI_REQUIRED_ENV_KEYS = ["GOOGLE_PROJECT_ID"] as const;

export const VERTEX_AI_LOCAL_REQUIRED_ENV_KEYS = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  ...VERTEX_AI_REQUIRED_ENV_KEYS,
] as const;

export const VERTEX_AI_LOCAL_DEV_REQUIRED_ENV_KEYS = [
  "GOOGLE_APPLICATION_CREDENTIALS",
] as const;

export const GEMINI_TYPE_MAP: Record<GeminiJsonSchemaType, Type> = {
  object: Type.OBJECT,
  array: Type.ARRAY,
  string: Type.STRING,
  integer: Type.INTEGER,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
};

export const VERTEX_AI_PDF_MIME_TYPE = "application/pdf" as const;
export const PDF_BASE64_HEADER_PREFIX = "JVBERi0";
export const MAX_BASE64_PDF_BYTES = 10 * 1024 * 1024;
export const PDF_FILE_SIGNATURE = "%PDF-";

export const VERTEX_HOUSING_EXTRACTION_BUDGET_MS = 60_000;
export const VERTEX_HOUSING_PAGE_FIRST_ATTEMPT_MS = 30_000;
export const VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS = 5;
export const VERTEX_HTTP_TIMEOUT_MS = 60_000;
