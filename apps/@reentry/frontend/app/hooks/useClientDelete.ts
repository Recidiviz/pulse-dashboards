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


export const useClientDelete = () => {
  const { getAccessToken } = useAuth();

  const { mutateAsync: deleteClientMutation, isPending: isDeletingInProgress } =
    $api.useMutation("delete", "/clients/admin/remove");

  const handleDeleteClient = async (
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    onSuccess?: () => void,
    setIsDeletingClient?: (isDeleting: boolean) => void,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${firstName} ${lastName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Starting deletion for client:", firstName, lastName);

      if (setIsDeletingClient) {
        setIsDeletingClient(true);
      }

      await deleteClientMutation({
        body: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Client deleted successfully");
      alert("Client has been deleted successfully.");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client. Please try again.");
    } finally {
      if (setIsDeletingClient) {
        setIsDeletingClient(false);
      }
    }
  };

  return {
    handleDeleteClient,
    isDeletingInProgress,
  };
};
