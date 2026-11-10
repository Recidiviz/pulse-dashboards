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

import { observer } from "mobx-react-lite";
import React, { useState } from "react";

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import { useStaffApplicationById } from "../../../../hooks/useApplicationDetail";
import { SuccessModal } from "../../../common/SuccessModal";
import { ProviderResponses } from "../ProviderResponses";
import { ProviderSelectionView } from "../ProviderSelectionView/ProviderSelectionView";
import {
  APPLICATIONS_SENT_SUBHEADING,
  applicationsSentHeading,
} from "./ProvidersView.utils";

export const ProvidersView = observer(function ProvidersView() {
  const store = useHousingApplicationsStore();
  const { currentApplicationId } = store;
  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );
  const hasSent = currentApplication?.sentToProvidersAt != null;
  const isHomePlanSet = currentApplication?.homePlan != null;
  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;

  // Lives above the hasSent branch below: a first send flips hasSent to
  // true and swaps ProviderSelectionView out for ProviderResponses, which
  // would unmount the modal's state if it lived in either branch instead.
  const [sentCount, setSentCount] = useState<number | null>(null);

  return (
    <>
      {hasSent || isHomePlanSet || isClosed ? (
        <ProviderResponses onSent={setSentCount} />
      ) : (
        <ProviderSelectionView onSent={setSentCount} />
      )}

      {sentCount != null && (
        <SuccessModal
          isOpen
          onClose={() => setSentCount(null)}
          heading={applicationsSentHeading(sentCount)}
          subheading={APPLICATIONS_SENT_SUBHEADING}
        />
      )}
    </>
  );
});
