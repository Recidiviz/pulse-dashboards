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

import { useMemo } from "react";

import { BaseModal, PrimaryButton } from "~@reentry/frontend-shared";

interface RemoveAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assessmentName?: string;
  userName?: string;
}

export default function RemoveAssessmentModal({
  isOpen,
  onClose,
  onConfirm,
  assessmentName,
  userName,
}: RemoveAssessmentModalProps) {
  const title = useMemo(() => {
    return `Remove ${assessmentName}`;
  }, [assessmentName]);

  return (
    <BaseModal isOpen={isOpen} title={title} onClose={onClose}>
      <>
        <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px] mb-4">
          This action will unassign this assessment from{" "}
          <span className="font-semibold">{userName}</span>’s profile. Remove
          the assessment only if you do not want {userName} to complete it.
          <br />
          <br />
          To assign {userName} a new assessment, click “Enable New Assessment”
          at the top right of the screen and select the assessment from the
          dropdown menu.
        </p>

        <div className="flex gap-3 justify-end">
          <PrimaryButton buttonText="No, go back" onClick={onClose} />

          <PrimaryButton
            buttonText={`Yes, remove assessment`}
            className="flex-1 h-8 px-4 py-2 bg-[#013830] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
            onClick={onConfirm}
          />
        </div>
      </>
    </BaseModal>
  );
}
