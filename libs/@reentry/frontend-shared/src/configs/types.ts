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

export interface PreIntakeNoteOneCopy {
  title: string;
  paragraphs: string[];
}

export interface PreIntakeNoteTwoCopy {
  title: string;
  faqItems: Array<{ question: string; answer: string }>;
  importantItems: Array<{ label: string; text: string }>;
}

export interface IntakeConfigBase {
  preIntakeCopy: string;
  docId: {
    label: string;
    placeholder: string;
  };
  /** Navigation behavior for exit/completion actions */
  navigation: { type: "redirect"; url: string } | { type: "history-back" };
  noteOneCopy: PreIntakeNoteOneCopy;
  noteTwoCopy: PreIntakeNoteTwoCopy;
}

export interface TextIntakeConfig extends IntakeConfigBase {
  preIntakeFlow: "text";
}

export interface IntakeVideoConfig {
  src: string;
  subtitlesSrc: string;
}

export interface VideoIntakeConfig extends IntakeConfigBase {
  preIntakeFlow: "video";
  video: IntakeVideoConfig;
}

/** Flow order: NoteOne → NoteTwo → Video → Start. */
export interface TextVideoIntakeConfig extends IntakeConfigBase {
  preIntakeFlow: "text+video";
  video: IntakeVideoConfig;
}

export type IntakeTenantConfig =
  | TextIntakeConfig
  | VideoIntakeConfig
  | TextVideoIntakeConfig;

/** Type guard: narrows to a config that has a `video` property. */
export function hasVideo(
  config: IntakeTenantConfig,
): config is VideoIntakeConfig | TextVideoIntakeConfig {
  return (
    config.preIntakeFlow === "video" || config.preIntakeFlow === "text+video"
  );
}

export type PreIntakeStep = "one" | "two" | "video";

export function isPreIntakeStep(value: string | null): value is PreIntakeStep {
  return value === "one" || value === "two" || value === "video";
}

export type IntakeTenantOverride =
  | (Partial<IntakeConfigBase> & { preIntakeFlow?: "text" })
  | (Partial<IntakeConfigBase> & {
      preIntakeFlow: "video" | "text+video";
      video: IntakeVideoConfig;
    });
