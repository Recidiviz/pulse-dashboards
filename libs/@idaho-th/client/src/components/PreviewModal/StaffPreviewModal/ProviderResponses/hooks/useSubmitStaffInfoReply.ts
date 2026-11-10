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

import toast from "react-hot-toast";

import { useHousingApplicationsStore } from "~@idaho-th/client/datastores/IdahoTHStoreContext";
import { usePostStaffInfoReply } from "~@idaho-th/client/hooks/housingApplication";

export const useSubmitStaffInfoReply = (
  providerApplicationId: string | undefined,
) => {
  const { currentApplicationId } = useHousingApplicationsStore();
  const { mutateAsync: postStaffInfoReply } = usePostStaffInfoReply();

  const handleSubmitInfo = async (message: string) => {
    try {
      if (!currentApplicationId || !providerApplicationId) {
        toast.error("No active application found.");
        return;
      }
      await postStaffInfoReply({
        applicationId: currentApplicationId,
        providerApplicationId,
        message,
      });
    } catch {
      toast.error("Failed to send reply. Please try again.");
    }
  };

  return handleSubmitInfo;
};
