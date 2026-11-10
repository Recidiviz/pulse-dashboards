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

export type VertexThinkingLevel = "minimal" | "low" | "medium" | "high";

export type ModelProfile = {
  modelName: string;
  location: string;
  temperature: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  thinkingLevel?: VertexThinkingLevel;
};

export type ModelProfileKey = "housing_extraction_default";

// const GEMINI_3_FLASH_PREVIEW = "gemini-3-flash-preview";
const DEFAULT_MODEL_NAME = "gemini-3.1-pro-preview";
const DEFAULT_LOCATION_FALLBACK = "global";
const DEFAULT_PROFILE_KEY: ModelProfileKey = "housing_extraction_default";

export const MODEL_PROFILES: Record<ModelProfileKey, ModelProfile> = {
  housing_extraction_default: {
    modelName: DEFAULT_MODEL_NAME,
    location: DEFAULT_LOCATION_FALLBACK,
    temperature: 0.0,
    thinkingLevel: "low",
  },
};

export function resolveModelProfile(key?: ModelProfileKey): ModelProfile {
  return MODEL_PROFILES[key ?? DEFAULT_PROFILE_KEY];
}
