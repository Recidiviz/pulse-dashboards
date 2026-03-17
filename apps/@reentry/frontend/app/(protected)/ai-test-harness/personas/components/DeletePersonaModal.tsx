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

import { CircularProgress } from "@mui/material";

import { $api } from "~@reentry/frontend/api";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { BaseModal } from "~@reentry/frontend-shared";

interface DeletePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  personaId: string;
  personaName: string;
  isDeleting: boolean;
}

export const DeletePersonaModal = ({
  isOpen,
  onClose,
  onConfirm,
  personaId,
  personaName,
  isDeleting,
}: DeletePersonaModalProps) => {
  const { getAccessToken } = useAuth();

  const { data: triggers, isLoading } = $api.useQuery(
    "get",
    "/ai-personas/{persona_id}/triggers",
    {
      params: { path: { persona_id: personaId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: isOpen && !!personaId },
  );

  const hasTriggers = !!triggers && triggers.length > 0;

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-4">
          <CircularProgress size={24} />
        </div>
      );
    }
    if (hasTriggers) {
      return (
        <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
          <span className="font-semibold">{personaName}</span> cannot be deleted
          because it has{" "}
          <span className="font-semibold">
            {triggers.length} trigger{triggers.length !== 1 ? "s" : ""}
          </span>{" "}
          associated with it.
        </p>
      );
    }
    return (
      <p className="text-[#2a5469]/90 text-sm font-medium font-['Public_Sans'] leading-[16.80px]">
        This action will permanently delete{" "}
        <span className="font-semibold">{personaName}</span>. This cannot be
        undone.
      </p>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title={`Delete ${personaName}`}
      onClose={onClose}
    >
      <>
        {renderBody()}

        <div className="flex gap-3 justify-end">
          <PrimaryButton
            buttonText="No, go back"
            onClick={onClose}
            ignoreCapabilities={true}
          />

          {!isLoading && (
            <PrimaryButton
              buttonText={isDeleting ? "Deleting..." : "Yes, delete persona"}
              className="flex-1 h-8 px-4 py-2 bg-[#013830] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
              onClick={onConfirm}
              disabled={isDeleting || hasTriggers}
              ignoreCapabilities={true}
            />
          )}
        </div>
      </>
    </BaseModal>
  );
};
