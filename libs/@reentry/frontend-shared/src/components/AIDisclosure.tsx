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

import React from "react";

import { AIDisclosureIcon } from "./AIDisclosureIcon";

export const AI_DISCLOSURE_PRINT_TEXT =
  "This document was generated using artificial intelligence. Please review carefully and verify important information.";

export const AIDisclosureType = {
  Sidebar: "sidebar",
  ChatHistory: "chatHistory",
  Chatbot: "chatbot",
  Inline: "inline",
} as const;

// eslint-disable-next-line no-redeclare
export type AIDisclosureType =
  (typeof AIDisclosureType)[keyof typeof AIDisclosureType];

interface AIDisclosureProps {
  type: AIDisclosureType;
}

export const AIDisclosure: React.FC<AIDisclosureProps> = ({ type }) => {
  switch (type) {
    case AIDisclosureType.Sidebar:
      return (
        <div className="flex flex-row items-start gap-3 p-4">
          <AIDisclosureIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-base text-[#424242] leading-relaxed">
            This document was generated using artificial intelligence. Please
            review carefully and verify important information.
          </p>
        </div>
      );

    case AIDisclosureType.ChatHistory:
      return (
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <AIDisclosureIcon className="w-4 h-4" />
          <span>
            White chat bubbles are generated using artificial intelligence.
            Please review carefully and verify important information.
          </span>
        </div>
      );

    case AIDisclosureType.Chatbot:
      return (
        <div className="flex items-start gap-2 w-full">
          <AIDisclosureIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm text-[#424242] flex-1">
            Messages in this chat are generated using artificial intelligence.
            Please report any issues or concerns to your case manager.
          </p>
        </div>
      );

    case AIDisclosureType.Inline:
      return <span className="text-xs text-[#666666]">(AI generated)</span>;
  }
};

/**
 * Adds AI disclosure notice to the top of an element for browser printing.
 * In PDF printing, we add the disclosure as a footer, but for browser printing
 * footer support is limited so we add it separately at the top.
 */
export const addBrowserPrintDisclosure = (
  element: HTMLElement | null,
): void => {
  if (!element) return;

  removeBrowserPrintDisclosure();

  const disclosure = document.createElement("div");
  disclosure.id = "browser-print-disclosure";
  disclosure.className =
    "hidden print:block mb-6 p-4 bg-gray-50 border border-gray-200 text-xs text-gray-600";
  disclosure.textContent = AI_DISCLOSURE_PRINT_TEXT;
  element.insertBefore(disclosure, element.firstChild);
};

/**
 * Removes the browser print disclosure notice added by addBrowserPrintDisclosure.
 */
export const removeBrowserPrintDisclosure = (): void => {
  const disclosure = document.getElementById("browser-print-disclosure");
  if (disclosure) {
    disclosure.remove();
  }
};

export default AIDisclosure;
