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

import PrimaryButton from "~@reentry/frontend/components/buttons/PrimaryButton";
import BaseModal from "~@reentry/frontend/components/recording/modals/BaseModal";

interface EndAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EndAssessmentModal({
  isOpen,
  onClose,
  onConfirm,
}: EndAssessmentModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      title="Are you sure you want to end the assessment?"
      onClose={onClose}
    >
      <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
        If you end the assessment now, you will not be able to start it again.
      </p>

      <div className="flex gap-3">
        <PrimaryButton buttonText="Continue Assessment" onClick={onClose} />
        <PrimaryButton
          buttonText="Yes, End Assessment"
          className="flex-1 h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
          onClick={onConfirm}
        />
      </div>
    </BaseModal>
  );
}
