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

import { X } from "lucide-react";
import type React from "react";
import Modal from "react-modal";

interface BaseModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="outline-none"
      overlayClassName="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      ariaHideApp={false}
    >
      <div className="w-full max-w-[410px] bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] inline-flex flex-col justify-start items-end overflow-hidden">
        {/* Header */}
        <div className="self-stretch px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-start gap-2">
          <div className="text-[#002321] text-base font-medium font-['Public_Sans'] leading-tight break-words flex-1 pr-2">
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
        <div className="self-stretch p-4 flex flex-col gap-5">{children}</div>
      </div>
    </Modal>
  );
};

export default BaseModal;
