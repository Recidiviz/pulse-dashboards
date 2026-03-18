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

export interface VideoIntakeConfig extends IntakeConfigBase {
  preIntakeFlow: "video";
  video: {
    src: string;
    subtitlesSrc: string;
  };
}

export type IntakeTenantConfig = TextIntakeConfig | VideoIntakeConfig;

export type IntakeTenantOverride =
  | Partial<IntakeConfigBase>
  | (Partial<IntakeConfigBase> & {
      preIntakeFlow: "video";
      video: { src: string; subtitlesSrc: string };
    });
