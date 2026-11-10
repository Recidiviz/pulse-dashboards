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

import { APPLICATION_STAGE, APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../datastores/IdahoTHStoreContext";
import {
  useStaffApplicationById,
  useStaffApplicationProviders,
} from "../../../hooks/useApplicationDetail";
import { TabBadge } from "../PreviewModal.styles";

export const ProvidersTabBadge = observer(function ProvidersBadge({
  detailLoaded = false,
}: {
  detailLoaded?: boolean;
}) {
  const { currentApplicationId } = useHousingApplicationsStore();
  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    detailLoaded && !!currentApplicationId,
  );
  const hasSent = currentApplication?.sentToProvidersAt != null;
  const isHomePlanSet = currentApplication?.homePlan != null;

  const { data: providersData } = useStaffApplicationProviders(
    currentApplicationId,
    detailLoaded && hasSent && !!currentApplicationId && !isHomePlanSet,
  );

  if (isHomePlanSet) return null;

  const count = hasSent
    ? (providersData?.providers ?? []).filter(
        (p) =>
          p.stage !== APPLICATION_STAGE.CLOSED &&
          (p.subStage === APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED ||
            p.subStage === APPLICATION_SUB_STAGE.INFO_NEEDED),
      ).length
    : 0;

  if (count === 0) return null;

  return <TabBadge>{count > 99 ? "99+" : count}</TabBadge>;
});
