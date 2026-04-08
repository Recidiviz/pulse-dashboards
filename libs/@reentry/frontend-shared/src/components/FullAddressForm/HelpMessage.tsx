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

import { AlertCircle, Info, Loader2 } from "lucide-react";

import type { HelpMessage as HelpMessageType } from "./autocompleteHelpers";

interface HelpMessageProps {
  message: HelpMessageType | null;
}

/**
 * Renders a help/status message for autocomplete fields
 */
export const HelpMessage = ({ message }: HelpMessageProps) => {
  if (!message) return null;

  const messageStyles = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    loading: "bg-gray-50 text-gray-700 border-gray-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };

  let Icon = Info;
  if (message.type === "loading") {
    Icon = Loader2;
  } else if (message.type === "error" || message.type === "warning") {
    Icon = AlertCircle;
  }

  return (
    <div
      className={`mt-2 mb-1 px-3 py-2 rounded-md border text-xs ${messageStyles[message.type]}`}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${message.type === "loading" ? "animate-spin" : ""}`}
        />
        <span>{message.message}</span>
      </div>
    </div>
  );
};
