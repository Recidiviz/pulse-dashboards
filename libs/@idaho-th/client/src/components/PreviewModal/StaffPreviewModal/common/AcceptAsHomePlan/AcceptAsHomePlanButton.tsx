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

import React, { useState } from "react";
import toast from "react-hot-toast";

import { ActionButton } from "~@idaho-th/client/components/common/buttons/ActionButton/ActionButton";
import {
  useHousingApplicationsStore,
  usePreviewModalStore,
} from "~@idaho-th/client/datastores/IdahoTHStoreContext";
import { useAcceptProviderAsHomePlan } from "~@idaho-th/client/hooks/housingApplication";
import { Button2 } from "~@idaho-th/client/styles";

import { TAB_IDS } from "../../../constants";
import { AcceptAsHomePlanModal } from "./AcceptAsHomePlanModal";

interface AcceptAsHomePlanButtonProps {
  providerId: string;
}

export const AcceptAsHomePlanButton: React.FC<AcceptAsHomePlanButtonProps> = ({
  providerId,
}) => {
  const [isHomePlanModalOpen, setIsHomePlanModalOpen] = useState(false);
  const { currentApplicationId } = useHousingApplicationsStore();
  const previewModalStore = usePreviewModalStore();
  const { mutateAsync: acceptProviderAsHomePlan, isPending } =
    useAcceptProviderAsHomePlan();

  const handleConfirm = async () => {
    if (!currentApplicationId) {
      toast.error("No active application found.");
      return;
    }
    try {
      await acceptProviderAsHomePlan({
        applicationId: currentApplicationId,
        providerId,
      });
      setIsHomePlanModalOpen(false);
      previewModalStore.setActiveTab(TAB_IDS.HOME_PLAN);
    } catch {
      toast.error("Failed to accept provider as home plan.");
    }
  };

  return (
    <>
      <ActionButton
        height="32px"
        onClick={(e) => {
          e.stopPropagation();
          setIsHomePlanModalOpen(true);
        }}
      >
        <Button2>Set as Home Plan</Button2>
      </ActionButton>

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={(e) => e.stopPropagation()}>
        <AcceptAsHomePlanModal
          isOpen={isHomePlanModalOpen}
          onClose={() => setIsHomePlanModalOpen(false)}
          onConfirm={handleConfirm}
          isLoading={isPending}
        />
      </div>
    </>
  );
};
