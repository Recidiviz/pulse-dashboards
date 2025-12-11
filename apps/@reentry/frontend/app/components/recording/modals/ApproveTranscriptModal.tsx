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

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { BaseModal } from "~@reentry/frontend-shared";

interface ApproveTranscriptModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
}

export default function ApproveTranscriptModal({
  open,
  onClose,
  onApprove,
}: ApproveTranscriptModalProps) {
  return (
    <BaseModal isOpen={open} title="Approve Transcript" onClose={onClose}>
      <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
        Once approved, you won&apos;t be able to edit the transcript further.
      </p>

      <div className="flex gap-3">
        <PrimaryButton buttonText="Continue Editing" onClick={onClose} />
        <PrimaryButton
          buttonText="Approve Transcript"
          className="flex-1 h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
          onClick={onApprove}
        />
      </div>
    </BaseModal>
  );
}
