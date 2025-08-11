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

import { AIMessage, HumanMessage } from "@langchain/core/messages";

import { IntakeConfig } from "~@reentry/prisma/types";

export function getSectionTitles(config: IntakeConfig) {
  return config.sections.map((section) => section.title);
}

export function getSectionTitle(config: IntakeConfig, index: number) {
  const sectionTitles = getSectionTitles(config);
  if (index < 0 || index >= sectionTitles.length) {
    throw new Error("Index out of bounds");
  }
  return sectionTitles[index];
}

function createMessageWithMetadata(opts: {
  content: string;
  config: IntakeConfig;
  currentSectionIndex: number;
  messageType: "ai" | "human";
}) {
  const section = getSectionTitle(opts.config, opts.currentSectionIndex);
  const MessageClass = opts.messageType === "ai" ? AIMessage : HumanMessage;

  return new MessageClass({
    id: crypto.randomUUID(),
    content: opts.content,
    response_metadata: { section },
  });
}

export function createAiMessageWithMetadata(opts: {
  content: string;
  config: IntakeConfig;
  currentSectionIndex: number;
}) {
  return createMessageWithMetadata({
    content: opts.content,
    config: opts.config,
    currentSectionIndex: opts.currentSectionIndex,
    messageType: "ai",
  });
}

export function createHumanMessageWithMetadata(opts: {
  content: string;
  config: IntakeConfig;
  currentSectionIndex: number;
}) {
  return createMessageWithMetadata({
    content: opts.content,
    config: opts.config,
    currentSectionIndex: opts.currentSectionIndex,
    messageType: "human",
  });
}
