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

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth";

/**
 * Hook for resetting client intake data
 */
export const useClientReset = () => {
  const { getAccessToken } = useAuth();

  const { mutateAsync: resetClientMutation, isPending: isResettingInProgress } =
    $api.useMutation("delete", "/clients/{client_pseudo_id}/reset");

  const handleResetClient = async (
    clientPseudoId: string,
    onSuccess?: () => void,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to reset this client? This will delete all intake data.",
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Starting reset for client:", clientPseudoId);

      await resetClientMutation({
        params: {
          path: {
            client_pseudo_id: clientPseudoId,
          },
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Client reset successfully");
      alert("Client has been reset successfully.");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error resetting client:", error);
      alert("Failed to reset client. Please try again.");
    }
  };

  return {
    handleResetClient,
    isResettingInProgress,
  };
};
