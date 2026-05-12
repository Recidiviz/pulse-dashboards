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
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider/StoreProvider";
import { US_IA, US_MI } from "../../RootStore/TenantStore/dashboardTenants";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import LookerEmbed from "./LookerEmbed";

const TENANT_DASHBOARD: Partial<Record<string, string>> = {
  [US_MI]: "michigan_region_metrics",
  [US_IA]: "iowa_district_metrics",
};

const StyledLookerEmbed = styled(LookerEmbed)`
  width: 100%;
  height: calc(100vh - ${rem(NAV_BAR_HEIGHT)});
`;

const TenantLookerEmbed: React.FC = observer(function TenantLookerEmbed() {
  const { currentTenantId, userStore } = useRootStore();
  const dashboardName = currentTenantId
    ? TENANT_DASHBOARD[currentTenantId]
    : undefined;

  if (!dashboardName) return null;

  const filters: Record<string, string> = {};
  if (userStore.district) {
    filters["Region"] = userStore.district;
    filters["District Name"] = userStore.district;
  }

  return (
    <StyledLookerEmbed dashboardName={dashboardName} defaultFilters={filters} />
  );
});

export default TenantLookerEmbed;
