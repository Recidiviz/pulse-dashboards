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

"use client";

import { X } from "lucide-react";
import type React from "react";
import Modal from "react-modal";

import { TAILWIND_WRAPPER_CLASS } from "~@jii/common-ui";

interface BaseModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const ModalStyles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  content: {
    position: "relative" as const,
    inset: "auto",
    border: "none",
    background: "transparent",
    overflow: "visible",
    borderRadius: 0,
    outline: "none",
    padding: 0,
  },
};

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={`${TAILWIND_WRAPPER_CLASS} outline-none`}
      overlayClassName={`${TAILWIND_WRAPPER_CLASS}`}
      style={ModalStyles}
      ariaHideApp={false}
      parentSelector={() => document.getElementById("root") || document.body}
    >
      <div className="w-full max-w-[410px] max-h-[90vh] bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-center">
          <div className="text-[#002321] text-base font-medium font-['Public_Sans'] leading-tight">
            {title}
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={14} className="text-[#004D48]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {children}
        </div>
      </div>
    </Modal>
  );
};
