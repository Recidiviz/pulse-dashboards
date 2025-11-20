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

import { PrimaryButton } from "../buttons/PrimaryButton";
import { BaseModal } from "../modals/BaseModal";

interface EndChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // <- this performs save + logout or navigation
}

export function EndChatModal({
  isOpen,
  onClose,
  onConfirm,
}: EndChatModalProps) {
  return (
    <BaseModal isOpen={isOpen} title="End Chat" onClose={onClose}>
      <div className="text-[#2A5469]/90 text-sm font-medium font-['Public_Sans'] space-y-4">
        <p>
          Ending this chat will take you back to the login screen. Your answers
          will be saved and you can come back to this chat any time to finish
          the intake.
          <br />
          <br />
          <strong>Do you want to end the chat?</strong>
        </p>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        {/* Confirm */}
        <button
          onClick={onConfirm}
          className="w-full bg-[#006C67] text-white text-sm font-medium py-2 rounded-[32px] hover:bg-[#005752] transition-colors"
        >
          Yes, end the chat
        </button>

        {/* Cancel */}
        <PrimaryButton buttonText="No, keep chatting" onClick={onClose} />
      </div>
    </BaseModal>
  );
}
