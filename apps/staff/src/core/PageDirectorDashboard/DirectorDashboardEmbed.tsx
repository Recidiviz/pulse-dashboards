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

import { format, startOfMonth, startOfToday, subMonths } from "date-fns";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider/StoreProvider";
import LookerEmbed from "../LookerEmbed/LookerEmbed";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";

const StyledLookerEmbed = styled(LookerEmbed)`
  width: 100%;
  height: calc(100vh - ${rem(NAV_BAR_HEIGHT)});
`;

const lookerDate = (d: Date) => format(d, "yyyy/MM/dd");

const TenantLookerEmbed: React.FC = observer(function TenantLookerEmbed() {
  const {
    tenantStore: { directorDashboardConfig },
    userStore,
  } = useRootStore();
  const dashboardName = directorDashboardConfig?.lookerDashboard;

  if (!dashboardName) return null;

  const thisMonthStart = startOfMonth(startOfToday());

  const filters: Record<string, string> = {
    "Population Start Date": lookerDate(subMonths(thisMonthStart, 3)),
    "Population End Date": lookerDate(thisMonthStart),
  };

  if (userStore.district) {
    filters["Region"] = userStore.district;
    filters["District Name"] = userStore.district;
  }

  return (
    <StyledLookerEmbed dashboardName={dashboardName} defaultFilters={filters} />
  );
});

export default TenantLookerEmbed;
