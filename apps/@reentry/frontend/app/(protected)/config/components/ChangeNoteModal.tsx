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

"use client";

import { useState } from "react";

const MAX_CHARS = 500;

const getCharCountColor = (isOverLimit: boolean, charsRemaining: number): string => {
  if (isOverLimit) return "text-red-500";
  if (charsRemaining < 50) return "text-amber-500";
  return "text-gray-400";
};

interface ChangeNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  title: string;
  description: string;
  actionLabel: string;
  actionColor?: "primary" | "danger" | "success";
  isLoading?: boolean;
  required?: boolean;
}

export const ChangeNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionLabel,
  actionColor = "primary",
  isLoading = false,
  required = true,
}: ChangeNoteModalProps) => {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (required && !note.trim()) return;
    onConfirm(note);
    setNote(""); // Reset for next use
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  const charsRemaining = MAX_CHARS - note.length;
  const isOverLimit = charsRemaining < 0;
  const canSubmit = (!required || note.trim().length > 0) && !isOverLimit;

  // Color variants for the action button
  const buttonColors = {
    primary: "bg-[#003331] hover:bg-gray-950",
    danger: "bg-red-600 hover:bg-red-700",
    success: "bg-green-600 hover:bg-green-700",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Change Note {required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              required
                ? "Describe what changed and why..."
                : "Optional: Add a note about this change..."
            }
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003331] focus:border-transparent resize-none ${
              isOverLimit ? "border-red-500" : "border-gray-300"
            }`}
            rows={4}
            maxLength={MAX_CHARS + 50} // Allow typing a bit over to show the warning
          />
          <div
            className={`flex justify-end text-xs mt-1 ${
              getCharCountColor(isOverLimit, charsRemaining)
            }`}
          >
            {charsRemaining} characters remaining
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit || isLoading}
            className={`px-4 py-2 text-white rounded-full transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${buttonColors[actionColor]}`}
          >
            {isLoading ? "Processing..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
